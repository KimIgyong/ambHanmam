import {
  Controller, Get, Post, Body, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingAutomationService } from '../service/billing-automation.service';
import { GenerateInvoicesRequest } from '../dto/request/generate-invoices.request';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Billing - Automation')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('billing/automation')
export class BillingAutomationController {
  constructor(private readonly automationService: BillingAutomationService) {}

  @Get('due-contracts')
  @ApiOperation({ summary: '이번 달 청구 대상 계약 목록' })
  async getDueContracts(@Req() req: any, @Query('year_month') yearMonth: string) {
    const data = await this.automationService.getDueContracts(req.entityId, yearMonth);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('usage-based')
  @ApiOperation({ summary: 'USAGE_BASED 계약 수량 입력 대기 목록' })
  async getUsageBasedDrafts(@Req() req: any, @Query('year_month') yearMonth: string) {
    const data = await this.automationService.getUsageBasedDrafts(req.entityId, yearMonth);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('billing-calendar')
  @ApiOperation({ summary: '월별 청구 일정 달력 (계약 billingDay 기준)' })
  async getBillingCalendar(@Req() req: any, @Query('year_month') yearMonth: string) {
    const data = await this.automationService.getBillingCalendar(req.entityId, yearMonth);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('overdue-billings')
  @ApiOperation({ summary: '미발행 청구서 알림 (billingDay 지남 & 인보이스 미생성)' })
  async getOverdueBillings(@Req() req: any) {
    const data = await this.automationService.getOverdueBillings(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('generate')
  @ApiOperation({ summary: 'FIXED 계약 월별 인보이스 일괄 생성' })
  async generateMonthlyInvoices(@Body() dto: GenerateInvoicesRequest, @Req() req: any) {
    const data = await this.automationService.generateMonthlyInvoices(req.entityId, dto.year_month);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
