import {
  Controller, Get, Param, Res, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { HrReportService } from '../service/hr-report.service';
import { PayslipPdfService } from '../service/payslip-pdf.service';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Reports')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/reports')
export class HrReportController {
  constructor(
    private readonly reportService: HrReportService,
    private readonly payslipService: PayslipPdfService,
  ) {}

  @Get('payslip/:periodId/:empId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '급여명세서 PDF 다운로드' })
  async downloadPayslip(
    @Req() req: any,
    @Param('periodId') periodId: string,
    @Param('empId') empId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.payslipService.generatePayslip(periodId, empId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${periodId}-${empId}.pdf"`);
    res.send(buffer);
  }

  @Get('payroll-register/:periodId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '급여대장 Excel 다운로드' })
  async downloadPayrollRegister(
    @Req() req: any,
    @Param('periodId') periodId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportService.generatePayrollRegister(periodId, req.entityId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="payroll-register-${periodId}.xlsx"`);
    res.send(buffer);
  }

  @Get('insurance/:periodId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '보험 내역 Excel 다운로드' })
  async downloadInsuranceReport(
    @Req() req: any,
    @Param('periodId') periodId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportService.generateInsuranceReport(periodId, req.entityId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="insurance-report-${periodId}.xlsx"`);
    res.send(buffer);
  }

  @Get('pit/:periodId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'PIT 세금 보고서 Excel 다운로드' })
  async downloadPitReport(
    @Req() req: any,
    @Param('periodId') periodId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportService.generatePitReport(periodId, req.entityId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="pit-report-${periodId}.xlsx"`);
    res.send(buffer);
  }

  @Get('employee-roster')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '직원 명부 Excel 다운로드' })
  async downloadEmployeeRoster(@Req() req: any, @Res() res: Response) {
    const buffer = await this.reportService.generateEmployeeRoster(req.entityId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="employee-roster.xlsx"');
    res.send(buffer);
  }
}
