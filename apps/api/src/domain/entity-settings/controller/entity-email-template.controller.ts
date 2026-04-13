import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { EmailTemplateService } from '../../settings/service/email-template.service';
import { UpsertEmailTemplateRequest } from '../../settings/dto/request/upsert-email-template.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { resolveEntityId } from '../util/resolve-entity-id';

/**
 * USER_LEVEL MASTER 전용 법인 초대 이메일 템플릿 관리
 * - 법인별 템플릿 (ent_id = 법인 UUID)
 * - 대상 코드: INVITATION
 */
@Controller('entity-settings/email-templates')
export class EntityEmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Get(':code')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getTemplate(
    @Param('code') code: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const entity = await this.emailTemplateService.getEntityTemplate(code, entityId);
    return { success: true, data: this.emailTemplateService.toResponse(entity, code) };
  }

  @Put(':code')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async upsertTemplate(
    @Param('code') code: string,
    @Body() dto: UpsertEmailTemplateRequest,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const entity = await this.emailTemplateService.upsertEntityTemplate(code, entityId, dto, user.userId);
    return { success: true, data: this.emailTemplateService.toResponse(entity, code) };
  }

  @Delete(':code')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async deleteTemplate(
    @Param('code') code: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    await this.emailTemplateService.deleteEntityTemplate(code, entityId);
    return { success: true };
  }

  @Get(':code/preview')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async previewTemplate(
    @Param('code') code: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const rendered = await this.emailTemplateService.preview(code, entityId);
    return { success: true, data: rendered };
  }
}
