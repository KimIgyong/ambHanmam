import {
  Controller, Get, Query, Req, Res, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { BillingReportService } from '../service/billing-report.service';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Billing - Reports')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('billing/reports')
export class BillingReportController {
  constructor(private readonly reportService: BillingReportService) {}

  @Get('summary')
  @ApiOperation({ summary: '대시보드 요약 카드 데이터' })
  async getDashboardSummary(@Req() req: any) {
    const data = await this.reportService.getDashboardSummary(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('revenue')
  @ApiOperation({ summary: '월별 매출/비용 요약' })
  async getRevenueSummary(@Req() req: any, @Query('year') year: string) {
    const y = parseInt(year) || new Date().getFullYear();
    const data = await this.reportService.getRevenueSummary(req.entityId, y);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('outstanding')
  @ApiOperation({ summary: '미수금/미지급 현황' })
  async getOutstandingReport(@Req() req: any) {
    const data = await this.reportService.getOutstandingReport(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('contract-timeline')
  @ApiOperation({ summary: '계약 만료 타임라인' })
  async getContractTimeline(@Req() req: any) {
    const data = await this.reportService.getContractTimeline(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('partner-distribution')
  @ApiOperation({ summary: '거래처 유형별 분포' })
  async getPartnerDistribution(@Req() req: any) {
    const data = await this.reportService.getPartnerDistribution(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('export/invoices')
  @ApiOperation({ summary: '청구서 엑셀 다운로드' })
  async exportInvoices(@Req() req: any, @Res() res: Response, @Query() query: any) {
    const params = {
      year: query.year ? parseInt(query.year) : undefined,
      direction: query.direction || undefined,
    };
    const buffer = await this.reportService.exportInvoicesToExcel(req.entityId, params);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="billing-invoices${params.year ? `-${params.year}` : ''}.xlsx"`);
    res.send(buffer);
  }

  @Get('monthly-matrix')
  @ApiOperation({ summary: '월별 청구 금액 매트릭스' })
  async getMonthlyMatrix(@Req() req: any, @Query('year') year: string) {
    const y = parseInt(year) || new Date().getFullYear();
    const data = await this.reportService.getMonthlyFeeMatrix(req.entityId, y);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('export/monthly-matrix')
  @ApiOperation({ summary: '월별 매트릭스 엑셀 다운로드' })
  async exportMonthlyMatrix(@Req() req: any, @Res() res: Response, @Query('year') year: string) {
    const y = parseInt(year) || new Date().getFullYear();
    const buffer = await this.reportService.exportMonthlyMatrixToExcel(req.entityId, y);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="monthly-matrix-${y}.xlsx"`);
    res.send(buffer);
  }

  @Get('tax-invoices')
  @ApiOperation({ summary: '세금계산서 발행 이력' })
  async getTaxInvoiceHistory(@Req() req: any, @Query() query: any) {
    const params = {
      year: query.year ? parseInt(query.year) : undefined,
      month: query.month ? parseInt(query.month) : undefined,
    };
    const data = await this.reportService.getTaxInvoiceHistory(req.entityId, params);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('export/tax-invoices')
  @ApiOperation({ summary: '세금계산서 엑셀 다운로드' })
  async exportTaxInvoices(@Req() req: any, @Res() res: Response, @Query() query: any) {
    const params = {
      year: query.year ? parseInt(query.year) : undefined,
      month: query.month ? parseInt(query.month) : undefined,
    };
    const buffer = await this.reportService.exportTaxInvoicesToExcel(req.entityId, params);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="tax-invoices${params.year ? `-${params.year}` : ''}.xlsx"`);
    res.send(buffer);
  }

  @Get('category-breakdown')
  @ApiOperation({ summary: '카테고리별 계약 현황' })
  async getCategoryBreakdown(@Req() req: any) {
    const data = await this.reportService.getCategoryBreakdown(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('consolidated')
  @ApiOperation({ summary: '법인 통합 조회' })
  async getConsolidatedSummary(@Req() req: any) {
    const data = await this.reportService.getConsolidatedSummary(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
