import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityCustomAppService } from '../service/entity-custom-app.service';
import { CreateCustomAppRequest, UpdateCustomAppRequest } from '../dto/custom-app.dto';
import { resolveEntityId } from '../util/resolve-entity-id';

/**
 * 커스텀 앱 관리 컨트롤러.
 *
 * 관리 엔드포인트 (MASTER+): GET/POST/PATCH/DELETE + health
 * 사용자 엔드포인트: GET /my, POST /:id/token
 */
@Controller('entity-settings/custom-apps')
export class EntityCustomAppController {
  constructor(
    private readonly customAppService: EntityCustomAppService,
  ) {}

  /* ── 사용자 엔드포인트 (일반 사용자 접근 가능) ── */

  /**
   * 현재 사용자의 법인에 등록된 활성 앱 목록 (사이드바용)
   * 역할 기반 필터링 적용
   */
  @Get('my')
  @Auth()
  async getMyApps(@CurrentUser() user: UserPayload) {
    const entityId = user.entityId || user.companyId;
    if (!entityId) {
      return { success: true, data: [], timestamp: new Date().toISOString() };
    }
    const data = await this.customAppService.findMyApps(entityId, user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /**
   * 앱용 JWT 토큰 발급 (iframe 인증용)
   */
  @Post(':id/token')
  @Auth()
  async getAppToken(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.customAppService.generateAppToken(id, user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /* ── 관리 엔드포인트 (MASTER+ with OwnEntityGuard) ── */

  /**
   * 커스텀 앱 목록 조회 (관리용)
   */
  @Get()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async findAll(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.customAppService.findAll(entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /**
   * 커스텀 앱 등록
   */
  @Post()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async create(
    @Body() dto: CreateCustomAppRequest,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.customAppService.create(entityId, dto, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /**
   * 커스텀 앱 수정
   */
  @Patch(':id')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomAppRequest,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.customAppService.update(id, entityId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /**
   * 커스텀 앱 삭제 (soft delete)
   */
  @Delete(':id')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    await this.customAppService.remove(id, entityId);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }

  /**
   * 외부 앱 연결 테스트
   */
  @Post(':id/health')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async healthCheck(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.customAppService.healthCheck(id, entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
