import {
  Controller, Get, Post, Delete, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerAppEntity } from '../entity/partner-app.entity';
import { PartnerAppInstallEntity } from '../entity/partner-app-install.entity';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';

@ApiTags('Entity Apps')
@Controller('entity/apps')
export class EntityPartnerAppController {
  constructor(
    @InjectRepository(PartnerAppEntity)
    private readonly appRepo: Repository<PartnerAppEntity>,
    @InjectRepository(PartnerAppInstallEntity)
    private readonly installRepo: Repository<PartnerAppInstallEntity>,
  ) {}

  @Get('marketplace')
  @Auth()
  @ApiOperation({ summary: 'PUBLISHED 앱 목록 (마켓플레이스)' })
  async getMarketplaceApps(@CurrentUser() user: UserPayload) {
    const apps = await this.appRepo.find({
      where: { papStatus: 'PUBLISHED' },
      relations: ['partner'],
      order: { papPublishedAt: 'DESC' },
    });
    return { success: true, data: apps, timestamp: new Date().toISOString() };
  }

  @Get('installed')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '내 법인에 설치된 앱 목록' })
  async getInstalledApps(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const installs = await this.installRepo.find({
      where: { paiEntityId: entityId },
      relations: ['app', 'app.partner'],
      order: { paiInstalledAt: 'DESC' },
    });
    return { success: true, data: installs, timestamp: new Date().toISOString() };
  }

  @Post(':appId/install')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '앱 설치 (scope 승인 포함)' })
  async installApp(
    @Param('appId') appId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
    @Body() body: { scopes?: string[] },
  ) {
    const entityId = resolveEntityId(queryEntityId, user);

    const app = await this.appRepo.findOne({ where: { papId: appId, papStatus: 'PUBLISHED' } });
    if (!app) {
      return { success: false, error: { message: 'App not found or not published' }, timestamp: new Date().toISOString() };
    }

    const existing = await this.installRepo.findOne({
      where: { papId: appId, paiEntityId: entityId },
    });
    if (existing) {
      return { success: false, error: { message: 'App already installed' }, timestamp: new Date().toISOString() };
    }

    const install = this.installRepo.create({
      papId: appId,
      paiEntityId: entityId,
      paiInstalledBy: user.userId,
      paiIsActive: true,
      paiApprovedScopes: body.scopes || app.papScopes || [],
    });
    const saved = await this.installRepo.save(install);
    return { success: true, data: saved, timestamp: new Date().toISOString() };
  }

  @Delete(':appId/uninstall')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '앱 제거' })
  async uninstallApp(
    @Param('appId') appId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const install = await this.installRepo.findOne({
      where: { papId: appId, paiEntityId: entityId },
    });
    if (!install) {
      return { success: false, error: { message: 'App not installed' }, timestamp: new Date().toISOString() };
    }
    await this.installRepo.remove(install);
    return { success: true, data: { removed: true }, timestamp: new Date().toISOString() };
  }

  @Patch(':installId/scopes')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '설치된 앱 Scope 수정' })
  async updateScopes(
    @Param('installId') installId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
    @Body() body: { scopes: string[] },
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const install = await this.installRepo.findOne({
      where: { paiId: installId, paiEntityId: entityId },
    });
    if (!install) {
      return { success: false, error: { message: 'Install not found' }, timestamp: new Date().toISOString() };
    }
    install.paiApprovedScopes = body.scopes;
    const saved = await this.installRepo.save(install);
    return { success: true, data: saved, timestamp: new Date().toISOString() };
  }
}
