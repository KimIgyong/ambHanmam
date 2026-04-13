import {
  Controller,
  Get,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OAuthTokenGuard } from '../../oauth/guard/oauth-token.guard';
import { RequireScopeGuard } from '../../oauth/guard/require-scope.guard';
import { RequireScope, OAuthContext } from '../../oauth/decorator/oauth.decorator';
import { OAuthTokenContext } from '../../oauth/interface/oauth-context.interface';
import { OpenApiLogInterceptor } from '../interceptor/open-api-log.interceptor';
import { EntityService } from '../../hr/service/entity.service';
import { Public } from '../../../global/decorator/public.decorator';

@Controller('open/entity')
@Public()
@UseGuards(OAuthTokenGuard, RequireScopeGuard)
@UseInterceptors(OpenApiLogInterceptor)
export class OpenEntityController {
  constructor(private readonly entityService: EntityService) {}

  @Get()
  @RequireScope('entity:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async detail(@OAuthContext() ctx: OAuthTokenContext) {
    const data = await this.entityService.getEntityById(ctx.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
