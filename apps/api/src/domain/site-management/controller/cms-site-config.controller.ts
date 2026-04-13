import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { CmsSiteConfigService } from '../service/cms-site-config.service';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';
import { CmsSiteConfigMapper } from '../mapper/cms-site-config.mapper';
import { UpdateSiteConfigRequest } from '../dto/request/update-site-config.request';

@Controller('cms/site-config')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CmsSiteConfigController {
  constructor(private readonly siteConfigService: CmsSiteConfigService) {}

  /** 전체 설정 조회 */
  @Get()
  async findAll(@Req() req: any) {
    const entityId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const configs = await this.siteConfigService.findAll(entityId);
    return {
      success: true,
      data: configs.map(CmsSiteConfigMapper.toResponse),
      timestamp: new Date().toISOString(),
    };
  }

  /** 특정 키 조회 */
  @Get(':key')
  async findByKey(@Param('key') key: string, @Req() req: any) {
    const entityId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const config = await this.siteConfigService.findByKey(entityId, key);
    return {
      success: true,
      data: CmsSiteConfigMapper.toResponse(config),
      timestamp: new Date().toISOString(),
    };
  }

  /** DRAFT 저장 (upsert) */
  @Put(':key')
  async upsert(
    @Param('key') key: string,
    @Body() dto: UpdateSiteConfigRequest,
    @Req() req: any,
  ) {
    const entityId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const userId = req.user.userId;
    const config = await this.siteConfigService.upsert(entityId, key, dto.value, userId);
    return {
      success: true,
      data: CmsSiteConfigMapper.toResponse(config),
      timestamp: new Date().toISOString(),
    };
  }

  /** 발행 */
  @Post(':key/publish')
  async publish(@Param('key') key: string, @Req() req: any) {
    const entityId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const userId = req.user.userId;
    const config = await this.siteConfigService.publish(entityId, key, userId);
    return {
      success: true,
      data: CmsSiteConfigMapper.toResponse(config),
      timestamp: new Date().toISOString(),
    };
  }
}
