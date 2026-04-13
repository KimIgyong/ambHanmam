import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { AppStoreService } from '../service/app-store.service';
import { resolveEntityId } from '../util/resolve-entity-id';

@Controller('entity-settings/app-store')
export class AppStoreController {
  constructor(private readonly appStoreService: AppStoreService) {}

  /**
   * 앱스토어 구독 현황 조회 (AppStore Subscription API 프록시)
   */
  @Get('subscriptions')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getSubscriptions(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.appStoreService.getSubscriptions(entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
