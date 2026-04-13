import {
  Controller, Get, Post, Patch,
  Param, Body, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from '../service/subscription.service';
import { CreateSubscriptionRequest } from '../dto/request/create-subscription.request';
import { UpdateSubscriptionRequest } from '../dto/request/update-subscription.request';

@ApiTags('Service Management - Subscriptions')
@ApiBearerAuth()
@Controller('service/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: '구독 목록 조회' })
  async findAll(@Query() query: any) {
    const data = await this.subscriptionService.findAll(query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('expiring')
  @ApiOperation({ summary: '만료 임박 구독 목록' })
  async findExpiring(@Query('days') days?: string) {
    const data = await this.subscriptionService.findExpiring(days ? parseInt(days, 10) : 30);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '구독 상세 조회' })
  async findById(@Param('id') id: string) {
    const data = await this.subscriptionService.findById(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '구독 등록' })
  async create(@Body() dto: CreateSubscriptionRequest, @Req() req: any) {
    const data = await this.subscriptionService.create(dto, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '구독 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateSubscriptionRequest, @Req() req: any) {
    const data = await this.subscriptionService.update(id, dto, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '구독 해지' })
  async cancel(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    const data = await this.subscriptionService.cancel(id, body.reason, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: '구독 정지' })
  async suspend(@Param('id') id: string, @Req() req: any) {
    const data = await this.subscriptionService.suspend(id, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/resume')
  @ApiOperation({ summary: '구독 재개' })
  async resume(@Param('id') id: string, @Req() req: any) {
    const data = await this.subscriptionService.resume(id, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/renew')
  @ApiOperation({ summary: '구독 갱신' })
  async renew(@Param('id') id: string, @Req() req: any) {
    const data = await this.subscriptionService.renew(id, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/history')
  @ApiOperation({ summary: '구독 변경 이력' })
  async findHistory(@Param('id') id: string) {
    const data = await this.subscriptionService.findHistory(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
