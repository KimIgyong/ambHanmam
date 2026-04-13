import {
  Controller, Get, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProjectService } from '../service/client-project.service';
import { ClientIssueService } from '../service/client-issue.service';
import { ClientGuard } from '../guard/client.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ClientProjectQueryRequest } from '../dto/client-project-query.request';
import { ClientProjectIssueQueryRequest } from '../dto/client-project-issue-query.request';

@ApiTags('Client Projects')
@ApiBearerAuth()
@UseGuards(ClientGuard)
@Controller('client/projects')
export class ClientProjectController {
  constructor(
    private readonly clientProjectService: ClientProjectService,
    private readonly clientIssueService: ClientIssueService,
  ) {}

  @Get()
  @ApiOperation({ summary: '배정된 프로젝트 목록' })
  async findAll(@CurrentUser() user: UserPayload, @Query() query: ClientProjectQueryRequest) {
    const data = await this.clientProjectService.findClientProjects(user.cliId!, query);
    return { success: true, ...data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '프로젝트 상세 (고객 뷰)' })
  async findById(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.clientProjectService.findClientProjectById(id, user.cliId!);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/issues')
  @ApiOperation({ summary: '프로젝트 이슈 목록 (고객 뷰)' })
  async findProjectIssues(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Query() query: ClientProjectIssueQueryRequest,
  ) {
    const result = await this.clientIssueService.findProjectIssues(id, user.cliId!, query);
    return { success: true, ...result, timestamp: new Date().toISOString() };
  }

  @Get(':id/members')
  @ApiOperation({ summary: '프로젝트 멤버 목록 (고객 뷰)' })
  async findProjectMembers(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const data = await this.clientProjectService.findProjectMembers(id, user.cliId!);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
