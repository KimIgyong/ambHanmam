import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SharingService } from '../service/sharing.service';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@Controller('work-items')
@UseGuards(AuthGuard('jwt'))
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Get(':workItemId/shares')
  async getShares(@Param('workItemId') workItemId: string) {
    return {
      success: true,
      data: await this.sharingService.getSharesForItem(workItemId),
    };
  }

  @Post(':workItemId/shares')
  async shareItem(
    @Param('workItemId') workItemId: string,
    @Body() body: {
      target_type: string;
      target_id: string;
      permission?: string;
      expires_at?: string;
    },
    @CurrentUser() user: UserPayload,
  ) {
    return {
      success: true,
      data: await this.sharingService.shareItem({
        workItemId,
        targetType: body.target_type,
        targetId: body.target_id,
        permission: body.permission || 'VIEW',
        sharedBy: user.userId,
        expiresAt: body.expires_at,
      }),
    };
  }

  @Delete('shares/:shareId')
  async unshareItem(@Param('shareId') shareId: string) {
    await this.sharingService.unshareItem(shareId);
    return { success: true };
  }
}
