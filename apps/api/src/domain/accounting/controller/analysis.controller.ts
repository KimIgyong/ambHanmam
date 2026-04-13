import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, Res,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from '../service/analysis.service';
import { AccountingService } from '../service/accounting.service';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Analysis')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('accounts/analysis')
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly accountingService: AccountingService,
  ) {}

  // ─── Reports ──────────────────────────────────────────

  @Get('reports/:accountId')
  @ApiOperation({ summary: '저장된 분석 리포트 목록' })
  async getReports(@Req() req: any, @Param('accountId') accountId: string) {
    const data = await this.analysisService.getReports(accountId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('reports/:accountId/:reportId')
  @ApiOperation({ summary: '분석 리포트 상세' })
  async getReport(@Req() req: any, @Param('reportId') reportId: string) {
    const data = await this.analysisService.getReportById(reportId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('reports/:accountId')
  @ApiOperation({ summary: '분석 리포트 저장' })
  async saveReport(
    @Req() req: any,
    @Param('accountId') accountId: string,
    @CurrentUser() user: UserPayload,
    @Body() body: { title: string; content: string; date_from?: string; date_to?: string; prompt_id?: string },
  ) {
    const data = await this.analysisService.saveReport({
      accountId,
      entityId: req.entityId,
      userId: user.userId,
      title: body.title,
      content: body.content,
      dateFrom: body.date_from,
      dateTo: body.date_to,
      promptId: body.prompt_id,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('reports/:accountId/:reportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '분석 리포트 삭제' })
  async deleteReport(@Req() req: any, @Param('reportId') reportId: string) {
    await this.analysisService.deleteReport(reportId, req.entityId);
  }

  // ─── Prompts ──────────────────────────────────────────

  @Get('prompts')
  @ApiOperation({ summary: '분석 프롬프트 목록' })
  async getPrompts(@Req() req: any) {
    const data = await this.analysisService.getPrompts(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('prompts')
  @ApiOperation({ summary: '분석 프롬프트 생성' })
  async createPrompt(
    @Req() req: any,
    @Body() body: { name: string; system_prompt: string; user_prompt: string; is_default?: boolean },
  ) {
    const data = await this.analysisService.createPrompt({
      entityId: req.entityId,
      name: body.name,
      systemPrompt: body.system_prompt,
      userPrompt: body.user_prompt,
      isDefault: body.is_default,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('prompts/:promptId')
  @ApiOperation({ summary: '분석 프롬프트 수정' })
  async updatePrompt(
    @Req() req: any,
    @Param('promptId') promptId: string,
    @Body() body: { name?: string; system_prompt?: string; user_prompt?: string; is_default?: boolean },
  ) {
    const data = await this.analysisService.updatePrompt(promptId, req.entityId, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('prompts/:promptId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '분석 프롬프트 삭제' })
  async deletePrompt(@Req() req: any, @Param('promptId') promptId: string) {
    await this.analysisService.deletePrompt(promptId, req.entityId);
  }

  // ─── Dashboard Chat Reports ─────────────────────────

  @Get('chat/reports')
  @ApiOperation({ summary: '대시보드 채팅 리포트 목록' })
  async getChatReports(@Req() req: any) {
    const data = await this.analysisService.getChatReports(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('chat/reports')
  @ApiOperation({ summary: '대시보드 채팅 리포트 저장' })
  async saveChatReport(
    @Req() req: any,
    @CurrentUser() user: UserPayload,
    @Body() body: { title: string; content: string },
  ) {
    const data = await this.analysisService.saveChatReport({
      entityId: req.entityId,
      userId: user.userId,
      title: body.title,
      content: body.content,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('chat/reports/:reportId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '대시보드 채팅 리포트 삭제' })
  async deleteChatReport(@Req() req: any, @Param('reportId') reportId: string) {
    await this.analysisService.deleteReport(reportId, req.entityId);
  }

  // ─── AI Chat Assistant ───────────────────────────────

  @Post('chat')
  @ApiOperation({ summary: '회계 AI 어시스턴트 채팅 (SSE)' })
  async chatAssistant(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Res() res: Response,
    @Body() body: { message: string; history?: Array<{ role: 'user' | 'assistant'; content: string }> },
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const stream$ = this.accountingService.chatAssistant(
        req.entityId,
        user.userId,
        body.message,
        body.history || [],
      );

      stream$.subscribe({
        next: (event) => { res.write(`data: ${JSON.stringify(event)}\n\n`); },
        error: (err) => {
          const message = err instanceof Error ? err.message : 'Internal server error';
          res.write(`data: ${JSON.stringify({ type: 'error', content: message })}\n\n`);
          res.end();
        },
        complete: () => { res.end(); },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.write(`data: ${JSON.stringify({ type: 'error', content: message })}\n\n`);
      res.end();
    }
  }

  // ─── AI Analysis with prompt ──────────────────────────

  @Post('generate/:accountId')
  @ApiOperation({ summary: 'AI 분석 리포트 생성 (프롬프트 선택 가능, SSE)' })
  async generateAnalysis(
    @Param('accountId') accountId: string,
    @Query('date_from') dateFrom: string,
    @Query('date_to') dateTo: string,
    @Query('prompt_id') promptId: string,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const stream$ = this.accountingService.aiAnalysis(
        accountId, req.entityId, user.userId,
        {
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          prompt_id: promptId || undefined,
        },
      );

      stream$.subscribe({
        next: (event) => {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        },
        error: (err) => {
          const message = err instanceof Error ? err.message : 'Internal server error';
          res.write(`data: ${JSON.stringify({ type: 'error', content: message })}\n\n`);
          res.end();
        },
        complete: () => {
          res.end();
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.write(`data: ${JSON.stringify({ type: 'error', content: message })}\n\n`);
      res.end();
    }
  }
}
