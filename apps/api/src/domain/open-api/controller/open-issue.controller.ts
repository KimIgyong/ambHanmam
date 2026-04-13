import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OAuthTokenGuard } from '../../oauth/guard/oauth-token.guard';
import { RequireScopeGuard } from '../../oauth/guard/require-scope.guard';
import { RequireScope, OAuthContext } from '../../oauth/decorator/oauth.decorator';
import { OAuthTokenContext } from '../../oauth/interface/oauth-context.interface';
import { OpenApiLogInterceptor } from '../interceptor/open-api-log.interceptor';
import { OpenIssueListDto } from '../dto/open-issue.dto';
import { IssueService } from '../../issues/service/issue.service';
import { Public } from '../../../global/decorator/public.decorator';

@Controller('open/issues')
@Public()
@UseGuards(OAuthTokenGuard, RequireScopeGuard)
@UseInterceptors(OpenApiLogInterceptor)
export class OpenIssueController {
  constructor(private readonly issueService: IssueService) {}

  @Get()
  @RequireScope('issues:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async list(
    @OAuthContext() ctx: OAuthTokenContext,
    @Query() query: OpenIssueListDto,
  ) {
    const result = await this.issueService.getIssues(
      {
        status: query.status,
        priority: query.priority,
        assignee_id: query.assignee_id,
        project_id: query.project_id,
        search: query.q,
      } as any,
      query.page,
      query.size,
      ctx.entityId,
      ctx.userId,
    );
    return {
      success: true,
      data: result.data,
      totalCount: result.totalCount,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @RequireScope('issues:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async detail(
    @OAuthContext() ctx: OAuthTokenContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.issueService.getIssueById(id, ctx.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/comments')
  @RequireScope('issues:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async comments(
    @OAuthContext() ctx: OAuthTokenContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.issueService.getIssueComments(id, ctx.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
