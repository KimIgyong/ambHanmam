import {
  Controller, Get, Post,
  Param, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from '../service/payroll.service';
import { CreatePayrollPeriodRequest } from '../dto/request/create-payroll-period.request';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { ManagerGuard } from '../../settings/guard/manager.guard';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Payroll')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  @ApiOperation({ summary: '급여기간 목록' })
  async getPeriods(@Req() req: any) {
    const data = await this.payrollService.getPeriods(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '급여기간 생성' })
  async createPeriod(@Req() req: any, @Body() request: CreatePayrollPeriodRequest) {
    const data = await this.payrollService.createPeriod(req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':periodId')
  @ApiOperation({ summary: '급여기간 상세' })
  async getPeriodById(@Req() req: any, @Param('periodId') periodId: string) {
    const data = await this.payrollService.getPeriodById(periodId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':periodId/calculate')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '급여 계산 실행' })
  async calculatePayroll(@Req() req: any, @Param('periodId') periodId: string) {
    const data = await this.payrollService.calculatePayroll(periodId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':periodId/submit')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '승인 제출' })
  async submitForApproval(@Req() req: any, @Param('periodId') periodId: string) {
    const data = await this.payrollService.submitForApproval(periodId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':periodId/approve')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: 'L1 승인 (MANAGER 이상)' })
  async approveL1(@Param('periodId') periodId: string, @Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const data = await this.payrollService.approveL1(periodId, req.entityId, userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':periodId/finalize')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'L2 최종승인 (ADMIN 전용)' })
  async approveL2(@Param('periodId') periodId: string, @Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    const data = await this.payrollService.approveL2(periodId, req.entityId, userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':periodId/reject')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: '반려 (MANAGER 이상)' })
  async reject(@Req() req: any, @Param('periodId') periodId: string) {
    const data = await this.payrollService.rejectPayroll(periodId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':periodId/details')
  @ApiOperation({ summary: '급여 상세 목록' })
  async getDetails(@Req() req: any, @Param('periodId') periodId: string) {
    const data = await this.payrollService.getPayrollDetails(periodId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':periodId/details/:empId')
  @ApiOperation({ summary: '개인 급여 상세' })
  async getDetailByEmployee(
    @Req() req: any,
    @Param('periodId') periodId: string,
    @Param('empId') empId: string,
  ) {
    const data = await this.payrollService.getPayrollDetailByEmployee(periodId, empId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':periodId/kr-details')
  @ApiOperation({ summary: 'KR 급여 상세 목록' })
  async getKrDetails(@Req() req: any, @Param('periodId') periodId: string) {
    const data = await this.payrollService.getKrPayrollDetails(periodId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':periodId/kr-details/:empId')
  @ApiOperation({ summary: 'KR 개인 급여 상세' })
  async getKrDetailByEmployee(
    @Req() req: any,
    @Param('periodId') periodId: string,
    @Param('empId') empId: string,
  ) {
    const data = await this.payrollService.getKrPayrollDetailByEmployee(periodId, empId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
