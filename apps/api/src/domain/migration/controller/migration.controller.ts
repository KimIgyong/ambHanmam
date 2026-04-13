import {
  Controller, Post, Get, Delete, Body, Query, Param, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RedmineMigrationService } from '../service/redmine-migration.service';
import { RedmineApiService } from '../service/redmine-api.service';
import { ApiKeyService } from '../../settings/service/api-key.service';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { Roles } from '../../../global/decorator/roles.decorator';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { CurrentUser } from '../../../global/decorator/current-user.decorator';

@ApiTags('Migration')
@ApiBearerAuth()
@UseGuards(EntityGuard, RolesGuard)
@Controller('migration')
export class MigrationController {
  constructor(
    private readonly redmineMigrationService: RedmineMigrationService,
    private readonly redmineApiService: RedmineApiService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  @Post('redmine/preview')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine 마이그레이션 미리보기 (dry-run)' })
  async preview(@Body() data: any) {
    const result = await this.redmineMigrationService.preview(data);
    return { success: true, data: result, timestamp: new Date().toISOString() };
  }

  @Post('redmine/import')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine 데이터 일괄 임포트' })
  async importAll(@Body() data: any, @Query('entity_id') entityId: string) {
    if (!entityId) {
      return { success: false, error: { code: 'E9001', message: 'entity_id is required' }, timestamp: new Date().toISOString() };
    }
    const result = await this.redmineMigrationService.importAll(data, entityId);
    return { success: true, data: result, timestamp: new Date().toISOString() };
  }

  @Get('logs')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: '마이그레이션 로그 조회' })
  async getLogs(@Query('batch_id') batchId?: string, @Query('status') status?: string) {
    const data = await this.redmineMigrationService.getLogs(batchId, status);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('redmine/rollback')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine 마이그레이션 롤백' })
  async rollback(@Body() body: { batch_id: string }) {
    if (!body.batch_id) {
      return { success: false, error: { code: 'E9001', message: 'batch_id is required' }, timestamp: new Date().toISOString() };
    }
    const result = await this.redmineMigrationService.rollback(body.batch_id);
    return { success: true, data: result, timestamp: new Date().toISOString() };
  }

  /* ═══════ Redmine REST API proxy endpoints ═══════ */

  @Get('redmine/connection')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine 연결 상태 확인' })
  async checkConnection() {
    const data = await this.redmineApiService.checkConnection();
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('redmine/projects')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine 프로젝트 목록 조회' })
  async getRedmineProjects(
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.redmineApiService.fetchProjects(
      Number(offset) || 0,
      Math.min(Number(limit) || 100, 100),
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('redmine/issues')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine 이슈 목록 조회' })
  async getRedmineIssues(
    @Query('project_id') projectId?: string,
    @Query('status_id') statusId?: string,
    @Query('tracker_id') trackerId?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const data = await this.redmineApiService.fetchIssues({
      projectId: projectId ? Number(projectId) : undefined,
      statusId: statusId || '*',
      trackerId: trackerId ? Number(trackerId) : undefined,
      offset: Number(offset) || 0,
      limit: Math.min(Number(limit) || 25, 10000),
      sort: sort || 'updated_on:desc',
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('redmine/issues/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine 이슈 상세 조회 (journals 포함)' })
  async getRedmineIssueDetail(@Param('id', ParseIntPipe) id: number) {
    const data = await this.redmineApiService.fetchIssueDetail(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('redmine/ama-projects')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: '지정된 Entity의 AMA 프로젝트 목록 조회' })
  async getAmaProjects(@Query('entity_id') entityId: string) {
    if (!entityId) {
      return { success: false, error: { code: 'E9001', message: 'entity_id is required' }, timestamp: new Date().toISOString() };
    }
    const data = await this.redmineMigrationService.getAmaProjects(entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('redmine/import-selected')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: '선택한 Redmine 이슈 가져오기' })
  async importSelected(
    @Body() body: { issue_ids: number[]; entity_id: string; target_project_id?: string },
  ) {
    if (!body.entity_id || !body.issue_ids?.length) {
      return {
        success: false,
        error: { code: 'E9001', message: 'entity_id and issue_ids are required' },
        timestamp: new Date().toISOString(),
      };
    }
    const data = await this.redmineMigrationService.importSelectedIssues(
      body.issue_ids,
      body.entity_id,
      body.target_project_id,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /* ═══════ Redmine Settings (DB-based) ═══════ */

  @Get('redmine/settings')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine 설정 조회 (URL + API Key 마스킹)' })
  async getRedmineSettings() {
    const [urlKey, apiKeyVal] = await Promise.all([
      this.apiKeyService.getDecryptedKey('REDMINE_URL'),
      this.apiKeyService.getDecryptedKey('REDMINE'),
    ]);
    return {
      success: true,
      data: {
        redmineUrl: urlKey || '',
        hasApiKey: !!apiKeyVal,
        apiKeyLast4: apiKeyVal ? apiKeyVal.slice(-4) : '',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('redmine/settings')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine 설정 저장 (URL + API Key)' })
  async saveRedmineSettings(
    @Body() body: { redmine_url?: string; api_key?: string },
    @CurrentUser('userId') userId: string,
  ) {
    const results: string[] = [];

    if (body.redmine_url !== undefined) {
      await this.upsertApiKey('REDMINE_URL', 'Redmine URL', body.redmine_url, userId);
      results.push('REDMINE_URL saved');
    }

    if (body.api_key !== undefined) {
      await this.upsertApiKey('REDMINE', 'Redmine API Key', body.api_key, userId);
      results.push('REDMINE_API_KEY saved');
    }

    return { success: true, data: { results }, timestamp: new Date().toISOString() };
  }

  /** provider별 기존 키가 있으면 update, 없으면 create */
  private async upsertApiKey(
    provider: string,
    name: string,
    value: string,
    userId: string,
  ) {
    const existing = (await this.apiKeyService.findAll()).find(
      (k) => k.provider === provider,
    );
    if (existing) {
      await this.apiKeyService.update(existing.apiKeyId, {
        name,
        api_key: value,
      } as any);
    } else {
      await this.apiKeyService.create(
        { provider, name, api_key: value } as any,
        userId,
      );
    }
  }

  /* ═══════ Imported Issues Management ═══════ */

  @Get('redmine/imported-issues')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine에서 가져온 이슈 목록 조회' })
  async getImportedIssues(
    @Query('entity_id') entityId?: string,
    @Query('project_id') projectId?: string,
    @Query('status') status?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
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

  @Delete('redmine/imported-issues')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine에서 가져온 이슈 삭제 (관련 코멘트/상태로그 포함)' })
  async deleteImportedIssues(
    @Body() body: { issue_ids: string[] },
  ) {
    if (!body.issue_ids?.length) {
      return {
        success: false,
        error: { code: 'E9001', message: 'issue_ids are required' },
        timestamp: new Date().toISOString(),
      };
    }
    const data = await this.redmineMigrationService.deleteImportedIssues(body.issue_ids);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('redmine/reimport')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Redmine 이슈 다시 가져오기 (기존 삭제 후 재import)' })
  async reimportIssues(
    @Body() body: { issue_ids: string[]; entity_id: string; target_project_id?: string },
  ) {
    if (!body.entity_id || !body.issue_ids?.length) {
      return {
        success: false,
        error: { code: 'E9001', message: 'entity_id and issue_ids are required' },
        timestamp: new Date().toISOString(),
      };
    }
    const data = await this.redmineMigrationService.reimportIssues(
      body.issue_ids,
      body.entity_id,
      body.target_project_id,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
