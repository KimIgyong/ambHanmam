import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, UseGuards, Req, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { Roles } from '../../../global/decorator/roles.decorator';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { IssueService } from '../service/issue.service';
import { CreateIssueRequest } from '../dto/request/create-issue.request';
import { UpdateIssueRequest } from '../dto/request/update-issue.request';
import { UpdateIssueStatusRequest } from '../dto/request/update-issue-status.request';
import { CreateIssueCommentRequest } from '../dto/request/create-issue-comment.request';
import { ReactIssueCommentRequest } from '../dto/request/react-issue-comment.request';

@ApiTags('이슈 관리')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('issues')
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Get('filter-presets')
  @ApiOperation({ summary: '이슈 필터 프리셋 조회' })
  async getFilterPresets(@CurrentUser() user: UserPayload) {
    const data = await this.issueService.getFilterPresets(user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put('filter-presets')
  @ApiOperation({ summary: '이슈 필터 프리셋 저장' })
  async saveFilterPresets(
    @CurrentUser() user: UserPayload,
    @Body() body: { presets: Array<{ name: string; filters: Record<string, any> }> },
  ) {
    await this.issueService.saveFilterPresets(user.userId, body.presets || []);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Get('my')
  @ApiOperation({ summary: '내가 작성하거나 할당된 이슈 조회' })
  async getMyIssues(
    @CurrentUser() user: UserPayload,
    @Query('size') size?: string,
    @Req() req?: any,
  ) {
    const data = await this.issueService.getMyIssues(
      user.userId,
      req?.entityId,
      Number(size) || 5,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: '이슈 목록 조회' })
  async getIssues(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('project_id') project_id?: string,
    @Query('scope') scope?: string,
    @Query('reporter_id') reporter_id?: string,
    @Query('cell_id') cell_id?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @CurrentUser() user?: UserPayload,
    @Req() req?: any,
  ) {
    const data = await this.issueService.getIssues(
      { type, status, severity, priority: priority ? Number(priority) : undefined, search, project_id, scope, reporter_id, cell_id },
      Number(page) || 1,
      Number(size) || 20,
      req?.entityId,
      user?.userId,
    );
    return { success: true, data: data.data, totalCount: data.totalCount, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '이슈 상세 조회' })
  async getIssueById(@Param('id') id: string, @CurrentUser() user?: UserPayload) {
    const data = await this.issueService.getIssueById(id, user?.userId);
    return data;
  }

  @Post()
  @ApiOperation({ summary: '이슈 신규 생성' })
  async createIssue(
    @Body() dto: CreateIssueRequest,
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    const data = await this.issueService.createIssue(dto, user.userId, req?.entityId);
    return data;
  }

  @Patch(':id')
  @ApiOperation({ summary: '이슈 정보 수정' })
  async updateIssue(
    @Param('id') id: string,
    @Body() dto: UpdateIssueRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.issueService.updateIssue(id, dto, user.userId);
    return data;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '이슈 상태 변경' })
  async updateIssueStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIssueStatusRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.issueService.updateIssueStatus(id, dto.status, user.userId, dto.note);
    return data;
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: '이슈 승인 (MANAGER 이상)' })
  async approveIssue(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() body?: { note?: string },
  ) {
    const data = await this.issueService.updateIssueStatus(id, 'APPROVED', user.userId, body?.note);
    return data;
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: '이슈 반려 (MANAGER 이상)' })
  async rejectIssue(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() body?: { note?: string },
  ) {
    const data = await this.issueService.updateIssueStatus(id, 'REJECTED', user.userId, body?.note);
    return data;
  }

  @Get(':id/comments')
  @ApiOperation({ summary: '이슈 코멘트 목록 조회' })
  async getIssueComments(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.issueService.getIssueComments(id, user.userId);
    return data;
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '이슈 코멘트 작성' })
  async addIssueComment(
    @Param('id') id: string,
    @Body() dto: CreateIssueCommentRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.issueService.addIssueComment(id, dto.content, user.userId, 'USER', dto.parent_id, dto.client_visible ?? false);
    return data;
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '이슈 코멘트 삭제' })
  async deleteIssueComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.issueService.deleteIssueComment(commentId, user.userId);
  }

  @Patch(':id/comments/:commentId/client-visible')
  @ApiOperation({ summary: '이슈 코멘트 고객 공개 토글' })
  async toggleCommentClientVisible(
    @Param('commentId') commentId: string,
    @Body() body: { client_visible: boolean },
  ) {
    const data = await this.issueService.toggleCommentClientVisible(commentId, body.client_visible);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/comments/:commentId/reactions')
  @ApiOperation({ summary: '이슈 코멘트 리액션 토글' })
  async toggleCommentReaction(
    @Param('commentId') commentId: string,
    @Body() dto: ReactIssueCommentRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.issueService.toggleCommentReaction(commentId, dto.type, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/status-logs')
  @ApiOperation({ summary: '이슈 상태 변경 이력 조회' })
  async getIssueStatusLogs(@Param('id') id: string) {
    const data = await this.issueService.getIssueStatusLogs(id);
    return data;
  }

  @Post(':id/ai-review')
  @ApiOperation({ summary: '이슈 AI 검토 (SSE 스트리밍)' })
  async aiReview(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Body() body: { language?: string },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const stream$ = this.issueService.aiReview(id, user.userId, req?.entityId, body?.language || 'en');

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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '이슈 소프트 삭제 (생성자/PM/MASTER)' })
  async softDeleteIssue(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    await this.issueService.softDeleteIssue(id, user.userId, user.role, req?.entityId);
  }

  @Delete(':id/permanent')
  @UseGuards(RolesGuard)
  @Roles('MASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '이슈 영구 삭제 (MASTER 전용)' })
  async permanentDeleteIssue(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    await this.issueService.permanentDeleteIssue(id, req?.entityId);
  }
}
