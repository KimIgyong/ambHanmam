import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { TagAssignmentService } from '../service/tag-assignment.service';
import { TagNormalizationService } from '../service/tag-normalization.service';
import { AutoTaggingService } from '../service/auto-tagging.service';

@Controller('kms/items')
@UseGuards(JwtAuthGuard)
export class FolksonomyController {
  constructor(
    private readonly tagAssignmentService: TagAssignmentService,
    private readonly tagNormalizationService: TagNormalizationService,
    private readonly autoTaggingService: AutoTaggingService,
  ) {}

  /**
   * Confirm an AI-suggested tag (change source to USER_CONFIRMED)
   */
  @Post(':witId/tags/confirm')
  async confirmTag(
    @CurrentUser() user: UserPayload,
    @Param('witId') witId: string,
    @Body() body: { tag_id: string },
  ) {
    const data = await this.tagAssignmentService.assignTag({
      workItemId: witId,
      tagId: body.tag_id,
      source: 'USER_CONFIRMED',
      assignedBy: user.userId,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /**
   * Reject an AI-suggested tag (change source to USER_REJECTED and set weight to 0)
   */
  @Post(':witId/tags/reject')
  async rejectTag(
    @CurrentUser() user: UserPayload,
    @Param('witId') witId: string,
    @Body() body: { tag_id: string },
  ) {
    const data = await this.tagAssignmentService.assignTag({
      workItemId: witId,
      tagId: body.tag_id,
      source: 'USER_REJECTED',
      weight: 0,
      assignedBy: user.userId,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /**
   * Manually add a tag (with normalization)
   */
  @Post(':witId/tags/manual')
  async addManualTag(
    @CurrentUser() user: UserPayload,
    @Param('witId') witId: string,
    @Body() body: { tag_name: string; level?: number },
  ) {
    const tag = await this.tagNormalizationService.normalizeTag(
      user.entityId!,
      body.tag_name,
      body.level,
    );

    const data = await this.tagAssignmentService.assignTag({
      workItemId: witId,
      tagId: tag.tagId,
      source: 'USER_MANUAL',
      confidence: 1.0,
      weight: 1.0,
      assignedBy: user.userId,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /**
   * Trigger AI auto-tagging for a work item
   */
  @Post(':witId/auto-tag')
  async triggerAutoTag(
    @Param('witId') witId: string,
  ) {
    await this.autoTaggingService.tagWorkItem(witId);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }
}
