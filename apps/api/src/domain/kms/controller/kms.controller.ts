import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../../../global/decorator/current-user.decorator';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { TagService } from '../service/tag.service';
import { TagAssignmentService } from '../service/tag-assignment.service';
import { TagNormalizationService } from '../service/tag-normalization.service';
import { BatchSyncService } from '../service/batch-sync.service';

@Controller('kms')
@UseGuards(EntityGuard, JwtAuthGuard)
export class KmsController {
  constructor(
    private readonly tagService: TagService,
    private readonly tagAssignmentService: TagAssignmentService,
    private readonly tagNormalizationService: TagNormalizationService,
    private readonly batchSyncService: BatchSyncService,
  ) {}

  // ===== Tag CRUD =====

  @Post('tags')
  async createTag(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Body() body: {
      name: string;
      name_local?: string;
      level?: number;
      parent_id?: string;
      color?: string;
      is_system?: boolean;
    },
  ) {
    const data = await this.tagService.createTag({
      entityId: req.entityId,
      name: body.name,
      nameLocal: body.name_local,
      level: body.level,
      parentId: body.parent_id,
      color: body.color,
      isSystem: body.is_system,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('tags/tree')
  async getTagTree(@Req() req: any) {
    const data = await this.tagService.getTagTree(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('tags/search')
  async searchTags(
    @Req() req: any,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.tagService.searchTags(
      req.entityId,
      query || '',
      limit ? parseInt(limit, 10) : 10,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('tags/autocomplete')
  async autocomplete(
    @Req() req: any,
    @Query('prefix') prefix: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.tagService.autocomplete(
      req.entityId,
      prefix || '',
      limit ? parseInt(limit, 10) : 8,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('tags/:id')
  async getTag(@Param('id') id: string) {
    const data = await this.tagService.getTag(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put('tags/:id')
  async updateTag(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      name_local?: string;
      level?: number;
      parent_id?: string;
      color?: string;
    },
  ) {
    const data = await this.tagService.updateTag(id, {
      name: body.name,
      nameLocal: body.name_local,
      level: body.level,
      parentId: body.parent_id,
      color: body.color,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('tags/:id')
  async deleteTag(@Param('id') id: string) {
    await this.tagService.deleteTag(id);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }

  // ===== Tag Assignment =====

  @Get('items/:witId/tags')
  async getWorkItemTags(@Param('witId') witId: string) {
    const data = await this.tagAssignmentService.getTagsForWorkItem(witId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('items/:witId/tags')
  async assignTag(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Param('witId') witId: string,
    @Body() body: {
      tag_id?: string;
      tag_name?: string;
      source?: string;
      confidence?: number;
      weight?: number;
    },
  ) {
    let tagId = body.tag_id;

    // If tag_name provided instead of tag_id, normalize and find/create
    if (!tagId && body.tag_name) {
      const tag = await this.tagNormalizationService.normalizeTag(
        req.entityId,
        body.tag_name,
      );
      tagId = tag.tagId;
    }

    if (!tagId) {
      return {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'tag_id or tag_name is required' },
        timestamp: new Date().toISOString(),
      };
    }

    const data = await this.tagAssignmentService.assignTag({
      workItemId: witId,
      tagId,
      source: body.source || 'USER_MANUAL',
      confidence: body.confidence,
      weight: body.weight,
      assignedBy: user.userId,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('items/:witId/tags/:tagId')
  async removeTag(
    @Param('witId') witId: string,
    @Param('tagId') tagId: string,
  ) {
    await this.tagAssignmentService.removeTag(witId, tagId);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }

  // ===== Batch Sync =====

  @Post('batch-sync')
  async batchSync(@CurrentUser() user: UserPayload) {
    const data = await this.batchSyncService.syncUserData(user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('tags/:tagId/items')
  async getWorkItemsForTag(
    @Param('tagId') tagId: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.tagAssignmentService.getWorkItemsForTag(
      tagId,
      limit ? parseInt(limit, 10) : 50,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
