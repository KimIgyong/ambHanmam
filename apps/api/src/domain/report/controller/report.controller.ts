import {
  Controller, Get, Post, Delete, Query, Param,
  Headers, UseGuards, Req, Res, HttpCode, HttpStatus, NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { ReportAggregatorService } from '../service/report-aggregator.service';
import { ReportAiService } from '../service/report-ai.service';

@ApiTags('업무 리포트')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('reports/work')
export class ReportController {
  constructor(
    private readonly aggregatorService: ReportAggregatorService,
    private readonly reportAiService: ReportAiService,
  ) {}

  // ─── 일간 리포트 생성 (SSE) ────────────────────────

  @Post('daily/generate')
  @ApiOperation({ summary: '일간 업무 리포트 AI 생성 (SSE)' })
  async generateDailyReport(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Res() res: Response,
    @Query('date') date?: string,
    @Query('userId') targetUserId?: string,
    @Headers('accept-language') acceptLang?: string,
  ) {
    const lang = (acceptLang || 'en').split(',')[0].split('-')[0].trim();
    const effectiveDate = date || new Date().toISOString().split('T')[0];
    const effectiveUserId = targetUserId || user.userId;

    const data = await this.aggregatorService.aggregateDaily(effectiveUserId, req.entityId, effectiveDate);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream$ = this.reportAiService.generateDailyReport(data, req.entityId, effectiveUserId, lang);

    stream$.subscribe({
      next: (event) => { res.write(`data: ${JSON.stringify(event)}\n\n`); },
      error: (err) => {
        const message = err instanceof Error ? err.message : 'Internal server error';
        res.write(`data: ${JSON.stringify({ type: 'error', content: message })}\n\n`);
        res.end();
      },
      complete: () => { res.end(); },
    });
  }

  // ─── 주간 리포트 생성 (SSE) ────────────────────────

  @Post('weekly/generate')
  @ApiOperation({ summary: '주간 업무 리포트 AI 생성 (SSE)' })
  async generateWeeklyReport(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Res() res: Response,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('userId') targetUserId?: string,
    @Headers('accept-language') acceptLang?: string,
  ) {
    const lang = (acceptLang || 'en').split(',')[0].split('-')[0].trim();
    const effectiveUserId = targetUserId || user.userId;

    // 기본값: 이번 주 월~일
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const periodStart = start || monday.toISOString().split('T')[0];
    const periodEnd = end || sunday.toISOString().split('T')[0];

    const data = await this.aggregatorService.aggregateWeekly(effectiveUserId, req.entityId, periodStart, periodEnd);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream$ = this.reportAiService.generateWeeklyReport(data, req.entityId, effectiveUserId, lang);

    stream$.subscribe({
      next: (event) => { res.write(`data: ${JSON.stringify(event)}\n\n`); },
      error: (err) => {
        const message = err instanceof Error ? err.message : 'Internal server error';
        res.write(`data: ${JSON.stringify({ type: 'error', content: message })}\n\n`);
        res.end();
      },
      complete: () => { res.end(); },
    });
  }

  // ─── 일간 집계 데이터 조회 (raw data) ──────────────

  @Get('daily/data')
  @ApiOperation({ summary: '일간 업무 집계 데이터 조회' })
  async getDailyData(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Query('date') date?: string,
    @Query('userId') targetUserId?: string,
  ) {
    const effectiveDate = date || new Date().toISOString().split('T')[0];
    const effectiveUserId = targetUserId || user.userId;
    const data = await this.aggregatorService.aggregateDaily(effectiveUserId, req.entityId, effectiveDate);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── 저장된 리포트 목록 조회 ───────────────────────

  @Get()
  @ApiOperation({ summary: '저장된 업무 리포트 목록 조회' })
  async getReports(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Query('type') type?: string,
    @Query('userId') targetUserId?: string,
  ) {
    const effectiveUserId = targetUserId || user.userId;
    const reports = await this.reportAiService.getReports(req.entityId, effectiveUserId, type);
    return {
      success: true,
      data: reports.map(r => ({
        id: r.wkrId,
        type: r.wkrType,
        periodStart: r.wkrPeriodStart,
        periodEnd: r.wkrPeriodEnd,
        aiScore: r.wkrAiScore,
        createdAt: r.wkrCreatedAt,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  // ─── 저장된 리포트 상세 조회 ───────────────────────

  @Get(':id')
  @ApiOperation({ summary: '저장된 업무 리포트 상세 조회' })
  async getReport(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    const report = await this.reportAiService.getReportById(id, req.entityId);
    if (!report) throw new NotFoundException('Report not found');

    return {
      success: true,
      data: {
        id: report.wkrId,
        type: report.wkrType,
        periodStart: report.wkrPeriodStart,
        periodEnd: report.wkrPeriodEnd,
        rawData: report.wkrRawData,
        aiSummary: report.wkrAiSummary,
        aiScore: report.wkrAiScore,
        createdAt: report.wkrCreatedAt,
        updatedAt: report.wkrUpdatedAt,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ─── 리포트 삭제 ──────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '업무 리포트 삭제' })
  async deleteReport(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    await this.reportAiService.deleteReport(id, req.entityId);
  }
}
