import {
  Controller, Get, Param, Query, Req, Res, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { KrReportService } from '../service/kr-report.service';
import { KrPayslipPdfService } from '../service/kr-payslip-pdf.service';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - KR Reports')
@ApiBearerAuth()
@Controller('hr/kr-reports')
@UseGuards(EntityGuard)
export class KrReportController {
  constructor(
    private readonly krReportService: KrReportService,
    private readonly krPayslipService: KrPayslipPdfService,
  ) {}

  @Get('payslip/:periodId/:empId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'KR 급여명세서 PDF 다운로드' })
  async downloadKrPayslip(
    @Param('periodId') periodId: string,
    @Param('empId') empId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.krPayslipService.generatePayslip(periodId, empId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="kr-payslip-${periodId}-${empId}.pdf"`);
    res.send(buffer);
  }

  @Get('payroll-register/:periodId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'KR 급여대장 Excel 다운로드' })
  async downloadKrPayrollRegister(
    @Param('periodId') periodId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.krReportService.generateKrPayrollRegister(periodId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="kr-payroll-register-${periodId}.xlsx"`);
    res.send(buffer);
  }

  @Get('insurance-summary/:periodId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '4대보험 집계표 Excel 다운로드' })
  async downloadInsuranceSummary(
    @Param('periodId') periodId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.krReportService.generateKrInsuranceSummary(periodId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="kr-insurance-summary-${periodId}.xlsx"`);
    res.send(buffer);
  }

  @Get('business-income-register')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '사업소득 지급대장 Excel 다운로드' })
  async downloadBusinessIncomeRegister(
    @Req() req: Request,
    @Query('year_month') yearMonth: string,
    @Res() res: Response,
  ) {
    const entityId = req.headers['x-entity-id'] as string;
    const buffer = await this.krReportService.generateBusinessIncomeRegister(entityId, yearMonth);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="business-income-${yearMonth}.xlsx"`);
    res.send(buffer);
  }

  @Get('tax-accountant/:periodId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '세무사 연동 Excel 다운로드' })
  async downloadTaxAccountantExcel(
    @Param('periodId') periodId: string,
    @Query('year_month') yearMonth: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const entityId = req.headers['x-entity-id'] as string;
    const buffer = await this.krReportService.generateTaxAccountantExcel(periodId, entityId, yearMonth);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="tax-accountant-${periodId}.xlsx"`);
    res.send(buffer);
  }
}
