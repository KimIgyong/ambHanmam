import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityCustomAppService } from '../service/entity-custom-app.service';
import { ExternalTaskImportService } from '../../external-task-import/service/external-task-import.service';
import { CreateExternalToolRequest, UpdateExternalToolRequest } from '../../external-task-import/dto/external-tool.dto';
import { resolveEntityId } from '../util/resolve-entity-id';

/**
 * 외부 태스크 도구 설정 컨트롤러 (Entity Settings 영역)
 * Custom App을 래핑하여 외부 태스크 도구 전용 CRUD 제공
 */
@Controller('entity-settings/external-task-tools')
export class ExternalTaskToolController {
  constructor(
    private readonly customAppService: EntityCustomAppService,
    private readonly importService: ExternalTaskImportService,
  ) {}

  /** 등록된 외부 태스크 도구 목록 */
  @Get()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async findAll(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.importService.getExternalTools(entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 도구 연결 등록 (Custom App 생성 래퍼) */
  @Post()
  @Auth()
  @UseGuards(OwnEntityGuard)
  async create(
    @Body() dto: CreateExternalToolRequest,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.customAppService.create(entityId, {
      code: `${dto.provider}-${Date.now()}`,
      name: dto.name,
      url: dto.url || `https://${dto.provider}.com`,
      auth_mode: 'api_key',
      open_mode: 'new_tab',
      api_key: dto.api_key,
      icon: dto.provider === 'asana' ? 'ListChecks' : dto.provider === 'redmine' ? 'Bug' : 'ExternalLink',
    }, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 도구 연결 수정 */
  @Patch(':id')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExternalToolRequest,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.url) updateData.url = dto.url;
    if (dto.api_key) updateData.api_key = dto.api_key;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    const data = await this.customAppService.update(id, entityId, updateData);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 도구 연결 삭제 */
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

  /** 연결 테스트 */
  @Post(':id/test')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async testConnection(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    // Determine provider from the custom app code
    const tools = await this.importService.getExternalTools(entityId);
    const tool = (tools as any[]).find((t) => t.id === id);
    if (!tool) {
      return { success: false, error: 'Tool not found', timestamp: new Date().toISOString() };
    }
    const providerType = tool.code?.split('-')[0] || 'unknown';
    const data = await this.importService.testConnection(providerType, id, entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
