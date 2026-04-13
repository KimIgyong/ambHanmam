import {
  Controller, Post, Get, Delete, Body, Query, UseGuards, Logger,
  BadRequestException, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RedmineMigrationService } from '../service/redmine-migration.service';
import { RedmineApiService } from '../service/redmine-api.service';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityCustomAppService } from '../../entity-settings/service/entity-custom-app.service';
import { ExternalTaskImportService } from '../../external-task-import/service/external-task-import.service';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';

/**
 * Entity별 Redmine 이슈 마이그레이션 컨트롤러
 * - Entity Settings > External Task Tools에 등록된 Redmine 연결 정보 사용
 * - Admin이 아닌 Entity 사용자가 직접 Redmine 이슈를 가져올 수 있음
 */
@ApiTags('Entity Redmine Migration')
@ApiBearerAuth()
@Controller('issues/redmine-migration')
export class EntityRedmineMigrationController {
  private readonly logger = new Logger(EntityRedmineMigrationController.name);

  constructor(
    private readonly redmineMigrationService: RedmineMigrationService,
    private readonly redmineApiService: RedmineApiService,
    private readonly customAppService: EntityCustomAppService,
    private readonly externalTaskImportService: ExternalTaskImportService,
  ) {}

  /**
   * Entity에 등록된 Redmine 연결에서 config(baseUrl, apiKey) 조회
   */
  private async getEntityRedmineConfig(
    entityId: string,
    appId?: string,
  ): Promise<{ baseUrl: string; apiKey: string; appId: string }> {
    const apps = await this.customAppService.findAll(entityId);
    const redmineApps = (apps as any[]).filter(
      (a) => a.code?.startsWith('redmine') && a.isActive !== false,
    );

    if (redmineApps.length === 0) {
      throw new NotFoundException('No Redmine connection found. Please add one in External Task Tools settings.');
    }

    const targetApp = appId
      ? redmineApps.find((a) => a.id === appId)
      : redmineApps[0];

    if (!targetApp) {
      throw new NotFoundException(`Redmine connection ${appId} not found`);
    }

    const config = await this.externalTaskImportService.getProviderConfig(targetApp.id, entityId);

    return {
      baseUrl: (config.baseUrl || '').replace(/\/+$/, ''),
      apiKey: config.apiKey,
      appId: targetApp.id,
    };
  }

  /** Entity의 Redmine 도구 목록 */
  @Get('tools')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: 'Entity에 등록된 Redmine 연결 목록' })
  async getRedmineTools(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const apps = await this.customAppService.findAll(entityId);
    const redmineApps = (apps as any[]).filter(
      (a) => a.code?.startsWith('redmine') && a.isActive !== false,
    );
    return {
      success: true,
      data: redmineApps.map((a) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        hasApiKey: !!a.authMode && a.authMode === 'api_key',
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /** Redmine 연결 상태 확인 */
  @Get('connection')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: 'Entity Redmine 연결 상태 확인' })
  async checkConnection(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('app_id') appId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    try {
      const config = await this.getEntityRedmineConfig(entityId, appId);
      const data = await this.redmineApiService.checkConnection(config);
      return { success: true, data: { ...data, appId: config.appId }, timestamp: new Date().toISOString() };
    } catch (e: any) {
      return {
        success: true,
        data: { connected: false, error: e.message },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /** Redmine 프로젝트 목록 */
  @Get('projects')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: 'Entity Redmine 프로젝트 목록 조회' })
  async getRedmineProjects(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('app_id') appId: string | undefined,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user!);
    const config = await this.getEntityRedmineConfig(entityId, appId);
    const data = await this.redmineApiService.fetchProjects(
      Number(offset) || 0,
      Math.min(Number(limit) || 100, 100),
      config,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** Redmine 이슈 목록 */
  @Get('issues')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: 'Entity Redmine 이슈 목록 조회' })
  async getRedmineIssues(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('app_id') appId: string | undefined,
    @Query('project_id') projectId?: string,
    @Query('status_id') statusId?: string,
    @Query('tracker_id') trackerId?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user!);
    const config = await this.getEntityRedmineConfig(entityId, appId);
    const data = await this.redmineApiService.fetchIssues({
      projectId: projectId ? Number(projectId) : undefined,
      statusId: statusId || '*',
      trackerId: trackerId ? Number(trackerId) : undefined,
      offset: Number(offset) || 0,
      limit: Math.min(Number(limit) || 25, 10000),
      sort: sort || 'updated_on:desc',
    }, config);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** AMA 프로젝트 목록 */
  @Get('ama-projects')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: 'Entity의 AMA 프로젝트 목록 조회' })
  async getAmaProjects(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.redmineMigrationService.getAmaProjects(entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 선택한 Redmine 이슈 가져오기 */
  @Post('import-selected')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: 'Entity: 선택한 Redmine 이슈 가져오기' })
  async importSelected(
    @Body() body: { issue_ids: number[]; target_project_id?: string; app_id?: string },
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    if (!body.issue_ids?.length) {
      throw new BadRequestException('issue_ids are required');
    }
    const config = await this.getEntityRedmineConfig(entityId, body.app_id);
    const data = await this.redmineMigrationService.importSelectedIssues(
      body.issue_ids,
      entityId,
      body.target_project_id,
      config,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 가져온 이슈 목록 (Entity-scoped) */
  @Get('imported-issues')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: 'Entity에서 가져온 Redmine 이슈 목록' })
  async getImportedIssues(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('project_id') projectId?: string,
    @Query('status') status?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user!);
    const data = await this.redmineMigrationService.getImportedIssues({
      entityId,
      projectId,
      status,
      search,
      offset: Number(offset) || 0,
      limit: Math.min(Number(limit) || 50, 200),
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 가져온 이슈 삭제 */
  @Delete('imported-issues')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: 'Entity: 가져온 Redmine 이슈 삭제' })
  async deleteImportedIssues(
    @Body() body: { issue_ids: string[] },
  ) {
    if (!body.issue_ids?.length) {
      throw new BadRequestException('issue_ids are required');
    }
    const data = await this.redmineMigrationService.deleteImportedIssues(body.issue_ids);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 이슈 다시 가져오기 */
  @Post('reimport')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: 'Entity: Redmine 이슈 다시 가져오기' })
  async reimportIssues(
    @Body() body: { issue_ids: string[]; target_project_id?: string; app_id?: string },
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    if (!body.issue_ids?.length) {
      throw new BadRequestException('issue_ids are required');
    }
    const config = await this.getEntityRedmineConfig(entityId, body.app_id);
    const data = await this.redmineMigrationService.reimportIssues(
      body.issue_ids,
      entityId,
      body.target_project_id,
      config,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
