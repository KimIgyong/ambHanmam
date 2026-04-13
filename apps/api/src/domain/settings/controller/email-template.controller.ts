import { Controller, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EmailTemplateService } from '../service/email-template.service';
import { UpsertEmailTemplateRequest } from '../dto/request/upsert-email-template.request';
import { AdminGuard } from '../guard/admin.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

/**
 * ADMIN_LEVEL 전용 이메일 템플릿 관리
 * - 전역 템플릿 (ent_id = NULL)
 * - 대상 코드: ACCOUNT_CREATED
 */
@Controller('settings/email-templates')
@UseGuards(AdminGuard)
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Get(':code')
  async getTemplate(@Param('code') code: string) {
    const entity = await this.emailTemplateService.getGlobalTemplate(code);
    return { success: true, data: this.emailTemplateService.toResponse(entity, code) };
  }

  @Put(':code')
  async upsertTemplate(
    @Param('code') code: string,
    @Body() dto: UpsertEmailTemplateRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entity = await this.emailTemplateService.upsertGlobalTemplate(code, dto, user.userId);
    return { success: true, data: this.emailTemplateService.toResponse(entity, code) };
  }

  @Delete(':code')
  async deleteTemplate(@Param('code') code: string) {
    await this.emailTemplateService.deleteGlobalTemplate(code);
    return { success: true };
  }

  @Get(':code/preview')
  async previewTemplate(@Param('code') code: string) {
    const rendered = await this.emailTemplateService.preview(code, null);
    return { success: true, data: rendered };
  }
}
