import {
  Controller, Get, Put, Query, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { resolveEntityId } from '../util/resolve-entity-id';
import { EntitySiteConfigService } from '../service/entity-site-config.service';

@ApiTags('Entity Site Config')
@ApiBearerAuth()
@Controller('entity-settings/site-config')
export class EntitySiteConfigController {
  constructor(private readonly siteConfigService: EntitySiteConfigService) {}

  /** 사이트 설정 조회 (관리자용) */
  @Get()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getSiteConfig(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.siteConfigService.getSiteConfig(entityId);
    return { success: true, data };
  }

  /** 사이트 설정 저장 (관리자용) */
  @Put()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async upsertSiteConfig(
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: { login_modal_enabled?: boolean; login_modal_title?: string; login_modal_content?: string },
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.siteConfigService.upsertSiteConfig(entityId, dto);
    return { success: true, data };
  }

  /** 로그인 모달 데이터 (인증 사용자용 — 로그인 직후 호출) */
  @Get('login-modal')
  @Auth()
  async getLoginModal(@CurrentUser() user: UserPayload) {
    const entityId = user.entityId;
    if (!entityId) return { success: true, data: { enabled: false } };
    const data = await this.siteConfigService.getLoginModal(entityId);
    return { success: true, data };
  }

  /** 메뉴 팁 전체 조회 (관리자용) */
  @Get('menu-tips')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getMenuTips(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.siteConfigService.getMenuTips(entityId);
    return { success: true, data };
  }

  /** 특정 메뉴 팁 조회 (사용자용) */
  @Get('menu-tips/:menuCode')
  @Auth()
  async getMenuTip(
    @Param('menuCode') menuCode: string,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = user.entityId;
    if (!entityId) return { success: true, data: null };
    const data = await this.siteConfigService.getMenuTip(entityId, menuCode);
    return { success: true, data };
  }

  /** 메뉴 팁 저장/수정 (관리자용) */
  @Put('menu-tips/:menuCode')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async upsertMenuTip(
    @Param('menuCode') menuCode: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: { title?: string; content?: string; is_active?: boolean; sort_order?: number },
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.siteConfigService.upsertMenuTip(entityId, menuCode, dto);
    return { success: true, data };
  }
}
