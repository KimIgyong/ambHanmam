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
import { OpenAssetListDto } from '../dto/open-asset.dto';
import { AssetService } from '../../asset/service/asset.service';
import { Public } from '../../../global/decorator/public.decorator';

@Controller('open/assets')
@Public()
@UseGuards(OAuthTokenGuard, RequireScopeGuard)
@UseInterceptors(OpenApiLogInterceptor)
export class OpenAssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @RequireScope('assets:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async list(
    @OAuthContext() ctx: OAuthTokenContext,
    @Query() query: OpenAssetListDto,
  ) {
    const data = await this.assetService.findAll(
      ctx.entityId,
      ctx.userId,
      'MEMBER',
      { category: query.category, status: query.status, q: query.q },
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @RequireScope('assets:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async detail(
    @OAuthContext() ctx: OAuthTokenContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.assetService.findById(id, ctx.entityId, ctx.userId, 'MEMBER');
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
