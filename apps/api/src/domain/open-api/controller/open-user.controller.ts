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
import { MemberService } from '../../members/service/member.service';
import { Public } from '../../../global/decorator/public.decorator';

@Controller('open/users')
@Public()
@UseGuards(OAuthTokenGuard, RequireScopeGuard)
@UseInterceptors(OpenApiLogInterceptor)
export class OpenUserController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  @RequireScope('users:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async list(@OAuthContext() ctx: OAuthTokenContext) {
    const data = await this.memberService.findAll(ctx.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
