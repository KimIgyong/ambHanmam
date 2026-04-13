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
import { OpenProjectListDto } from '../dto/open-project.dto';
import { ProjectService } from '../../project/service/project.service';
import { Public } from '../../../global/decorator/public.decorator';

@Controller('open/projects')
@Public()
@UseGuards(OAuthTokenGuard, RequireScopeGuard)
@UseInterceptors(OpenApiLogInterceptor)
export class OpenProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @RequireScope('projects:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async list(
    @OAuthContext() ctx: OAuthTokenContext,
    @Query() query: OpenProjectListDto,
  ) {
    const result = await this.projectService.findAll(ctx.entityId, {
      status: query.status,
      category: query.category,
      search: query.q,
      page: query.page,
      size: query.size,
    });
    return { success: true, ...result, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @RequireScope('projects:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async detail(
    @OAuthContext() ctx: OAuthTokenContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.projectService.findById(id, ctx.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
