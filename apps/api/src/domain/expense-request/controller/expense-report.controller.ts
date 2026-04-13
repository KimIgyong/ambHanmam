import {
  Controller, Post, Patch, Param, Body, Query, Get, Res,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ExpenseExecutionService } from '../service/expense-execution.service';
import { CreateExpenseExecutionDto, UpdateExpenseExecutionDto } from '../dto/expense-execution.dto';
import { ExpenseReportService } from '../service/expense-report.service';
import { ExpenseForecastService } from '../service/expense-forecast.service';
import { MonthlyReportQueryDto, CreateForecastReportDto, UpdateForecastReportDto } from '../dto/expense-report.dto';

@ApiTags('Expense - Execution & Reports')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('expense-requests')
export class ExpenseExecutionController {
  constructor(
    private readonly executionService: ExpenseExecutionService,
  ) {}

  @Post(':id/execute')
  @ApiOperation({ summary: '집행 정보 입력 (APPROVED → EXECUTED)' })
  createExecution(
    @Param('id') id: string,
    @Body() dto: CreateExpenseExecutionDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.executionService.create(id, dto, user, user.entityId!);
  }

  @Patch(':id/execute')
  @ApiOperation({ summary: '집행 정보 수정' })
  updateExecution(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseExecutionDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.executionService.update(id, dto, user, user.entityId!);
  }

  @Post(':id/execute/receipt')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '증빙 파일 업로드' })
  uploadReceipt(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserPayload,
  ) {
    return this.executionService.uploadReceiptFile(id, file, user, user.entityId!);
  }
}

@ApiTags('Expense - Reports')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('expense-requests/reports')
export class ExpenseReportController {
  constructor(
    private readonly reportService: ExpenseReportService,
    private readonly forecastService: ExpenseForecastService,
  ) {}

  @Get('monthly')
  @ApiOperation({ summary: '월별 실적 리포트 조회' })
  getMonthlyReport(
    @Query() query: MonthlyReportQueryDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.reportService.getMonthlyReport(user.entityId!, query);
  }

  @Get('monthly/export')
  @ApiOperation({ summary: '월별 실적 리포트 Excel 다운로드' })
  async exportMonthlyReport(
    @Query() query: MonthlyReportQueryDto,
    @CurrentUser() user: UserPayload,
    @Res() res: Response,
  ) {
    const buffer = await this.reportService.exportMonthlyReportToExcel(user.entityId!, query);
    const filename = `expense_monthly_${query.year}_${String(query.month).padStart(2, '0')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('forecast')
  @ApiOperation({ summary: '예정 리포트 조회 (year+month 시 단건, 없으면 목록)' })
  async getForecast(
    @CurrentUser() user: UserPayload,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    if (year && month) {
      const report = await this.forecastService.findByMonth(
        user.entityId!,
        Number(year),
        Number(month),
      );
      return report ? this.forecastService.toReportResponse(report) : null;
    }
    const list = await this.forecastService.findAll(user.entityId!);
    return list.map((r) => this.forecastService.toReportResponse(r));
  }

  @Get('forecast/preview')
  @ApiOperation({ summary: '익월 예정 자동 미리보기' })
  getForecastPreview(
    @Query('year') year: string,
    @Query('month') month: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.forecastService.getPreview(user.entityId!, Number(year), Number(month));
  }

  @Post('forecast')
  @ApiOperation({ summary: '예정 리포트 저장' })
  createForecast(
    @Body() dto: CreateForecastReportDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.forecastService.create(dto, user, user.entityId!);
  }

  @Patch('forecast/:id')
  @ApiOperation({ summary: '예정 리포트 수정' })
  updateForecast(
    @Param('id') id: string,
    @Body() dto: UpdateForecastReportDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.forecastService.update(id, dto, user.entityId!);
  }

  @Post('forecast/:id/submit')
  @ApiOperation({ summary: '예정 리포트 검토 요청 (DRAFT → SUBMITTED)' })
  submitForecast(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.forecastService.submit(id, user.entityId!);
  }

  @Post('forecast/:id/approve')
  @ApiOperation({ summary: '예정 리포트 승인 (SUBMITTED → APPROVED)' })
  approveForecast(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.forecastService.approve(id, user.entityId!);
  }

  @Post('forecast/:id/reject')
  @ApiOperation({ summary: '예정 리포트 반려 (SUBMITTED → DRAFT)' })
  rejectForecast(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.forecastService.reject(id, user.entityId!);
  }

  @Get('forecast/:id/export')
  @ApiOperation({ summary: '예정 리포트 Excel 다운로드' })
  async exportForecast(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Res() res: Response,
  ) {
    const buffer = await this.forecastService.exportToExcel(id, user.entityId!);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="expense_forecast_${id}.xlsx"`);
    res.send(buffer);
  }
}
