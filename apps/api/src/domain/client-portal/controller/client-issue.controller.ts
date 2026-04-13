import {
  Controller, Get, Post, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientIssueService } from '../service/client-issue.service';
import { ClientGuard } from '../guard/client.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { CreateClientIssueRequest } from '../dto/create-client-issue.request';
import { ClientIssueQueryRequest } from '../dto/client-issue-query.request';
import { AddClientCommentRequest } from '../dto/add-client-comment.request';

@ApiTags('Client Issues')
@ApiBearerAuth()
@UseGuards(ClientGuard)
@Controller('client/issues')
export class ClientIssueController {
  constructor(private readonly clientIssueService: ClientIssueService) {}

  @Post()
  @ApiOperation({ summary: '이슈 등록 (고객)' })
  async create(@CurrentUser() user: UserPayload, @Body() body: CreateClientIssueRequest) {
    const data = await this.clientIssueService.createIssue(user.userId, user.cliId!, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: '내가 등록한 이슈 목록' })
  async findMyIssues(@CurrentUser() user: UserPayload, @Query() query: ClientIssueQueryRequest) {
    const result = await this.clientIssueService.findMyIssues(user.userId, user.cliId!, query);
    return { success: true, ...result, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '이슈 상세' })
  async findById(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.clientIssueService.findIssueById(id, user.userId, user.cliId!);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '코멘트 추가' })
  async addComment(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body() body: AddClientCommentRequest,
  ) {
    const data = await this.clientIssueService.addComment(id, user.userId, user.cliId!, body.content);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '해결 확인 (RESOLVED→CLOSED)' })
  async confirmResolution(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.clientIssueService.confirmResolution(id, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/status-logs')
  @ApiOperation({ summary: '이슈 상태 변경 이력' })
  async getStatusLogs(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.clientIssueService.getStatusLogs(id, user.userId, user.cliId!);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
