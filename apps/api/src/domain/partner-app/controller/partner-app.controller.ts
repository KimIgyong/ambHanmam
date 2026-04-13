import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PartnerAppService } from '../service/partner-app.service';
import { CreatePartnerAppRequest } from '../dto/create-partner-app.request';
import { UpdatePartnerAppRequest } from '../dto/update-partner-app.request';
import { PartnerGuard } from '../../partner-portal/guard/partner.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('Partner Apps')
@Controller('partner/apps')
@UseGuards(PartnerGuard)
@ApiBearerAuth()
export class PartnerAppController {
  constructor(private readonly partnerAppService: PartnerAppService) {}

  @Get()
  @ApiOperation({ summary: '내 파트너사 앱 목록' })
  async findAll(@CurrentUser() user: UserPayload, @Query('status') status?: string) {
    const data = await this.partnerAppService.findAllByPartner(user.partnerId!, status);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '앱 상세' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.partnerAppService.findOne(id, user.partnerId!);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '앱 등록 (DRAFT)' })
  async create(@Body() dto: CreatePartnerAppRequest, @CurrentUser() user: UserPayload) {
    const data = await this.partnerAppService.create(user.partnerId!, user.userId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '앱 수정 (DRAFT/REJECTED)' })
  async update(@Param('id') id: string, @Body() dto: UpdatePartnerAppRequest, @CurrentUser() user: UserPayload) {
    const data = await this.partnerAppService.update(id, user.partnerId!, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '심사 제출 (DRAFT→SUBMITTED)' })
  async submit(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.partnerAppService.submit(id, user.partnerId!);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'DRAFT 앱 삭제' })
  async remove(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.partnerAppService.remove(id, user.partnerId!);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '버전 이력 조회' })
  async findVersions(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.partnerAppService.findVersions(id, user.partnerId!);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/versions')
  @ApiOperation({ summary: '새 버전 등록' })
  async createVersion(@Param('id') id: string, @CurrentUser() user: UserPayload, @Body() body: { version: string; url?: string; change_log?: string }) {
    const data = await this.partnerAppService.createVersion(id, user.partnerId!, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
