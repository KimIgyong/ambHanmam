import {
  Controller, Get, Post, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminPartnerAppService } from '../service/admin-partner-app.service';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('Admin Partner Apps')
@Controller('admin/partner-apps')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminPartnerAppController {
  constructor(private readonly adminAppService: AdminPartnerAppService) {}

  @Get('oauth-clients')
  @ApiOperation({ summary: 'OAuth 클라이언트 목록' })
  async getOAuthClients() {
    const data = await this.adminAppService.findOAuthClients();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/reissue-credentials')
  @ApiOperation({ summary: 'OAuth client credentials 재발급' })
  async reissueCredentials(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.adminAppService.reissueCredentials(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: '전체 파트너 앱 목록' })
  async findAll(@Query('status') status?: string, @Query('partner_id') partnerId?: string) {
    const data = await this.adminAppService.findAll({ status, partnerId });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '앱 상세' })
  async findOne(@Param('id') id: string) {
    const data = await this.adminAppService.findOne(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/review')
  @ApiOperation({ summary: '심사 시작 (SUBMITTED→IN_REVIEW)' })
  async startReview(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.adminAppService.startReview(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '승인 (IN_REVIEW→APPROVED)' })
  async approve(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const result = await this.adminAppService.approve(id, user.userId);
    return {
      success: true,
      data: {
        app: result.app,
        ...(result.clientCredentials && { clientCredentials: result.clientCredentials }),
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '거절 (IN_REVIEW→REJECTED)' })
  async reject(@Param('id') id: string, @CurrentUser() user: UserPayload, @Body() body: { review_note: string }) {
    const data = await this.adminAppService.reject(id, user.userId, body.review_note);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '발행 (APPROVED→PUBLISHED)' })
  async publish(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.adminAppService.publish(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: '정지 (→SUSPENDED)' })
  async suspend(@Param('id') id: string, @CurrentUser() user: UserPayload, @Body() body: { reason?: string }) {
    const data = await this.adminAppService.suspend(id, user.userId, body.reason);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
