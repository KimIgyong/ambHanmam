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
import { UnitService } from '../../unit/service/unit.service';
import { Public } from '../../../global/decorator/public.decorator';

@Controller('open/units')
@Public()
@UseGuards(OAuthTokenGuard, RequireScopeGuard)
@UseInterceptors(OpenApiLogInterceptor)
export class OpenUnitController {
  constructor(private readonly unitService: UnitService) {}

  @Get()
  @RequireScope('units:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async list(@OAuthContext() ctx: OAuthTokenContext) {
    const data = await this.unitService.getAllUnits(ctx.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('tree')
  @RequireScope('units:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async tree(@OAuthContext() ctx: OAuthTokenContext) {
    const data = await this.unitService.getUnitTree(ctx.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
