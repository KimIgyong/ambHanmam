import { Controller, Get, Post, Patch, Delete, Query, Param, Body, Headers, UseGuards, Req, Res, ForbiddenException, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TodayService } from '../service/today.service';
import { MissionService } from '../service/mission.service';
import { SnapshotService } from '../service/snapshot.service';
import { SnapshotMemoService } from '../service/snapshot-memo.service';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('오늘')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('today')
export class TodayController {
  constructor(
    private readonly todayService: TodayService,
    private readonly missionService: MissionService,
    private readonly snapshotService: SnapshotService,
    private readonly snapshotMemoService: SnapshotMemoService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: '나의 오늘 현황' })
  async getMyToday(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const tz = user.timezone;
    const [data, mission, uncheckedMission] = await Promise.all([
      this.todayService.getMyToday(user.userId, req.entityId, tz),
      this.missionService.getTodayMission(user.userId, tz),
      this.missionService.getLatestUncheckedMission(user.userId, tz),
    ]);

    // carryOverText: 오늘 미션이 없을 때 최근 체크된 미션의 이월 텍스트 사용
    let carryOverText: string | null = mission?.msnCarryOverText ?? null;
    if (!carryOverText && !mission) {
      carryOverText = await this.missionService.getLatestCarryOverText(user.userId, tz);
    }

    return {
      success: true,
      data: {
        ...data,
        mission: mission ? {
          msnId: mission.msnId,
          msnDate: mission.msnDate,
          msnContent: mission.msnContent,
          msnCheckResult: mission.msnCheckResult,
          msnCheckScore: mission.msnCheckScore,
          msnRegisteredLines: mission.msnRegisteredLines,
        } : null,
        yesterdayMission: uncheckedMission ? {
          msnId: uncheckedMission.msnId,
          msnDate: uncheckedMission.msnDate,
          msnContent: uncheckedMission.msnContent,
        } : null,
        carryOverText,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('team')
  @ApiOperation({ summary: 'Unit의 오늘 현황' })
  async getTeamToday(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.todayService.getTeamToday(user.userId, req.entityId, user.timezone, user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('cell')
  @ApiOperation({ summary: 'Cell의 오늘 현황' })
  async getCellToday(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.todayService.getCellToday(user.userId, req.entityId, user.timezone, user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('all')
  @ApiOperation({ summary: '모두의 오늘 현황' })
  async getAllToday(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.todayService.getAllToday(req.entityId, user.timezone, user.role);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('members/:userId/hidden')
  @ApiOperation({ summary: '멤버 Today 가리기/보이기 토글 (MASTER 전용)' })
  async toggleMemberHidden(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Param('userId') targetUserId: string,
    @Body() body: { hidden: boolean },
  ) {
    if (user.role !== 'MASTER') {
      throw new ForbiddenException('MASTER 권한이 필요합니다.');
    }
    const data = await this.todayService.toggleMemberHidden(req.entityId, targetUserId, body.hidden);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Mission ──────────────────────────────────────────

  @Post('mission')
  @ApiOperation({ summary: '미션 저장 (+ 스냅샷 자동 생성)' })
  async saveMission(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Body() body: { content: string | null },
  ) {
    const data = await this.missionService.saveMission(user.userId, req.entityId, body.content, user.timezone);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('mission/:date')
  @ApiOperation({ summary: '미션 수정' })
  async updateMission(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Param('date') date: string,
    @Body() body: { content: string },
  ) {
    const data = await this.missionService.updateMission(user.userId, req.entityId, date, body.content, user.timezone);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('mission/:date/check')
  @ApiOperation({ summary: '어제 미션 라인별 체크 결과 저장' })
  async saveMissionCheck(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Param('date') date: string,
    @Body() body: {
      lines: Array<{
        lineIndex: number;
        text: string;
        state: 'done' | 'incomplete' | 'na';
        subChoice: 'mission' | 'task' | null;
      }>;
    },
  ) {
    if (!Array.isArray(body.lines) || body.lines.length === 0) {
      throw new BadRequestException('lines array is required and must not be empty');
    }
    const validStates = ['done', 'incomplete', 'na'];
    for (const line of body.lines) {
      if (!validStates.includes(line.state)) {
        throw new BadRequestException(`Invalid state: ${line.state}`);
      }
      if (line.state === 'incomplete' && !['mission', 'task'].includes(line.subChoice as string)) {
        throw new BadRequestException(`Incomplete line at index ${line.lineIndex} requires subChoice (mission or task)`);
      }
      if (line.state !== 'incomplete' && line.subChoice != null) {
        throw new BadRequestException(`Non-incomplete line at index ${line.lineIndex} must not have subChoice`);
      }
    }
    const data = await this.missionService.saveCheck(user.userId, req.entityId, date, body.lines, user.timezone);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Snapshots ────────────────────────────────────────

  @Get('snapshots/calendar')
  @ApiOperation({ summary: '스냅샷 달력 조회' })
  async getSnapshotCalendar(
    @CurrentUser() user: UserPayload,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const data = await this.snapshotService.getCalendar(user.userId, y, m);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('snapshots/:date')
  @ApiOperation({ summary: '스냅샷 상세 조회' })
  async getSnapshotDetail(
    @CurrentUser() user: UserPayload,
    @Param('date') date: string,
  ) {
    const data = await this.snapshotService.getDetail(user.userId, date);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ─── Snapshot Memos ───────────────────────────────────

  @Post('snapshots/:snpId/memos')
  @ApiOperation({ summary: '스냅샷 메모 추가' })
  async addSnapshotMemo(
    @CurrentUser() user: UserPayload,
    @Param('snpId') snpId: string,
    @Body() body: { content: string },
  ) {
    if (!body.content || body.content.length > 2000) {
      throw new BadRequestException('content must be 1~2000 characters');
    }
    const data = await this.snapshotMemoService.addMemo(user.userId, snpId, body.content);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('snapshots/:snpId/memos/:memoId')
  @ApiOperation({ summary: '스냅샷 메모 수정' })
  async updateSnapshotMemo(
    @CurrentUser() user: UserPayload,
    @Param('snpId') snpId: string,
    @Param('memoId') memoId: string,
    @Body() body: { content: string },
  ) {
    if (!body.content || body.content.length > 2000) {
      throw new BadRequestException('content must be 1~2000 characters');
    }
    const data = await this.snapshotMemoService.updateMemo(user.userId, snpId, memoId, body.content);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('snapshots/:snpId/memos/:memoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '스냅샷 메모 삭제' })
  async deleteSnapshotMemo(
    @CurrentUser() user: UserPayload,
    @Param('snpId') snpId: string,
    @Param('memoId') memoId: string,
  ) {
    await this.snapshotMemoService.deleteMemo(user.userId, snpId, memoId);
  }

  // ─── AI Analysis ──────────────────────────────────────

  @Post('ai-analysis/me')
  @ApiOperation({ summary: '나의 업무 AI 분석 (SSE)' })
  async myAiAnalysis(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Res() res: Response,
    @Headers('accept-language') acceptLang?: string,
  ) {
    const lang = (acceptLang || 'en').split(',')[0].split('-')[0].trim();
    const myData = await this.todayService.getMyToday(user.userId, req.entityId);
    const myIssues = await this.todayService.getMyIssues(user.userId, req.entityId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream$ = this.todayService.myAiAnalysis(myData, myIssues, req.entityId, user.userId, lang);

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

  @Post('ai-analysis')
  @ApiOperation({ summary: 'AI 업무 현황 분석 (SSE)' })
  async aiAnalysis(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Res() res: Response,
    @Query('scope') scope?: string,
    @Headers('accept-language') acceptLang?: string,
  ) {
    const lang = (acceptLang || 'en').split(',')[0].split('-')[0].trim();
    const role = user.role;
    const isManager = role && ['MANAGER', 'MASTER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
    if (!isManager) {
      throw new ForbiddenException('MANAGER 이상 권한이 필요합니다.');
    }

    const effectiveScope = scope === 'team' ? 'team' : 'all';
    const data = effectiveScope === 'team'
      ? await this.todayService.getTeamToday(user.userId, req.entityId)
      : await this.todayService.getAllToday(req.entityId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream$ = this.todayService.aiAnalysis(
      data.members, data.summary, effectiveScope, req.entityId, user.userId, lang,
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
  }

  // ─── Reports ──────────────────────────────────────────

  @Get('reports')
  @ApiOperation({ summary: 'AI 분석 리포트 목록' })
  async getReports(@Req() req: any, @Query('scope') scope?: string) {
    const data = await this.todayService.getReports(req.entityId, scope);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('reports')
  @ApiOperation({ summary: 'AI 분석 리포트 저장' })
  async saveReport(
    @Req() req: any,
    @CurrentUser() user: UserPayload,
    @Body() body: { title: string; content: string; scope: string },
  ) {
    const data = await this.todayService.saveReport({
      entityId: req.entityId,
      userId: user.userId,
      title: body.title,
      content: body.content,
      scope: body.scope,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('reports/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'AI 분석 리포트 삭제' })
  async deleteReport(@Req() req: any, @Param('id') id: string) {
    await this.todayService.deleteReport(id, req.entityId);
  }
}
