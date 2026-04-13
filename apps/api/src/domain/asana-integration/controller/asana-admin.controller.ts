import {
  Controller, Get, Post, Delete,
  Param, Body, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ApiKeyService } from '../../settings/service/api-key.service';
import { AsanaApiService } from '../service/asana-api.service';
import { AsanaImportService } from '../service/asana-import.service';
import { AsanaProjectMappingEntity } from '../entity/asana-project-mapping.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateAsanaMappingDto, ImportAsanaTasksDto } from '../dto/create-asana-mapping.dto';

@ApiTags('Asana Integration')
@ApiBearerAuth()
@Controller('entity-settings/asana')
export class AsanaAdminController {
  private readonly logger = new Logger(AsanaAdminController.name);

  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly asanaApi: AsanaApiService,
    private readonly importService: AsanaImportService,
    @InjectRepository(AsanaProjectMappingEntity)
    private readonly mappingRepo: Repository<AsanaProjectMappingEntity>,
  ) {}

  // --- PAT Config ---

  @Get('config')
  @ApiOperation({ summary: 'Asana PAT 설정 조회' })
  async getConfig(@CurrentUser() user: UserPayload) {
    const keys = await this.apiKeyService.findByEntity(user.entityId!);
    const asanaKeys = keys.filter((k) => (k.provider as string) === 'ASANA_PAT');
    return { success: true, data: asanaKeys, timestamp: new Date().toISOString() };
  }

  @Post('config')
  @ApiOperation({ summary: 'Asana PAT 저장' })
  async saveConfig(
    @Body() dto: { provider: string; value: string },
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = user.entityId!;
    const provider = 'ASANA_PAT';

    const existingKeys = await this.apiKeyService.findByEntity(entityId);
    const existing = existingKeys.find((k) => (k.provider as string) === provider);

    if (existing) {
      const data = await this.apiKeyService.update(existing.apiKeyId, { api_key: dto.value });
      return { success: true, data, timestamp: new Date().toISOString() };
    }

    const data = await this.apiKeyService.createForEntity(
      { provider, name: 'Asana Personal Access Token', api_key: dto.value },
      user.userId,
      entityId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('config')
  @ApiOperation({ summary: 'Asana PAT 삭제' })
  async deleteConfig(@CurrentUser() user: UserPayload) {
    const keys = await this.apiKeyService.findByEntity(user.entityId!);
    const target = keys.find((k) => (k.provider as string) === 'ASANA_PAT');
    if (target) await this.apiKeyService.remove(target.apiKeyId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  // --- Connection Test ---

  @Post('test-connection')
  @ApiOperation({ summary: 'Asana 연결 테스트' })
  async testConnection(@CurrentUser() user: UserPayload) {
    const pat = await this.apiKeyService.getDecryptedKey('ASANA_PAT', user.entityId!);
    if (!pat) {
      return { success: false, error: 'Asana PAT not configured', timestamp: new Date().toISOString() };
    }
    const result = await this.asanaApi.authTest(pat);
    return { success: true, data: result, timestamp: new Date().toISOString() };
  }

  // --- Asana Project Info ---

  @Get('projects/:gid')
  @ApiOperation({ summary: 'Asana 프로젝트 정보 조회' })
  async getAsanaProject(
    @Param('gid') gid: string,
    @CurrentUser() user: UserPayload,
  ) {
    const pat = await this.apiKeyService.getDecryptedKey('ASANA_PAT', user.entityId!);
    if (!pat) {
      return { success: false, error: 'Asana PAT not configured', timestamp: new Date().toISOString() };
    }
    const project = await this.asanaApi.getProject(pat, gid);
    if (!project) {
      return { success: false, error: 'Project not found', timestamp: new Date().toISOString() };
    }
    return {
      success: true,
      data: { gid: project.gid, name: project.name, taskCount: project.numTasks || 0 },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('projects/:gid/tasks')
  @ApiOperation({ summary: 'Asana 태스크 미리보기 (최대 10건)' })
  async previewTasks(
    @Param('gid') gid: string,
    @CurrentUser() user: UserPayload,
  ) {
    const pat = await this.apiKeyService.getDecryptedKey('ASANA_PAT', user.entityId!);
    if (!pat) {
      return { success: false, error: 'Asana PAT not configured', timestamp: new Date().toISOString() };
    }
    const tasks = await this.asanaApi.getTasksForProject(pat, gid, { limit: 10 });
    return { success: true, data: tasks, timestamp: new Date().toISOString() };
  }

  // --- Project Mappings ---

  @Get('mappings')
  @ApiOperation({ summary: '프로젝트 매핑 목록 조회' })
  async getMappings(@CurrentUser() user: UserPayload) {
    const mappings = await this.mappingRepo.find({
      where: { entId: user.entityId!, apmDeletedAt: IsNull() },
      order: { apmCreatedAt: 'DESC' },
    });
    const data = mappings.map((m) => ({
      id: m.apmId,
      asanaProjectGid: m.apmAsanaProjectGid,
      asanaProjectName: m.apmAsanaProjectName,
      projectId: m.pjtId,
      status: m.apmStatus,
      lastSyncedAt: m.apmLastSyncedAt,
      createdAt: m.apmCreatedAt,
    }));
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('mappings')
  @ApiOperation({ summary: '프로젝트 매핑 생성' })
  async createMapping(
    @Body() dto: CreateAsanaMappingDto,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = user.entityId!;

    // Duplicate check
    const existing = await this.mappingRepo.findOne({
      where: { entId: entityId, apmAsanaProjectGid: dto.asana_project_gid, apmDeletedAt: IsNull() },
    });
    if (existing) {
      return { success: false, error: 'This Asana project is already mapped', timestamp: new Date().toISOString() };
    }

    const mapping = await this.mappingRepo.save({
      entId: entityId,
      apmAsanaProjectGid: dto.asana_project_gid,
      apmAsanaProjectName: dto.asana_project_name || null,
      pjtId: dto.project_id || null,
    });

    return {
      success: true,
      data: {
        id: mapping.apmId,
        asanaProjectGid: mapping.apmAsanaProjectGid,
        asanaProjectName: mapping.apmAsanaProjectName,
        projectId: mapping.pjtId,
        status: mapping.apmStatus,
        createdAt: mapping.apmCreatedAt,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('mappings/:id')
  @ApiOperation({ summary: '프로젝트 매핑 삭제' })
  async deleteMapping(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.mappingRepo.softDelete({ apmId: id, entId: user.entityId! });
    return { success: true, timestamp: new Date().toISOString() };
  }

  // --- Import ---

  @Post('mappings/:id/import')
  @ApiOperation({ summary: 'Asana 태스크를 AMA 이슈로 임포트' })
  async importTasks(
    @Param('id') id: string,
    @Body() dto: ImportAsanaTasksDto,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.importService.importTasks(
      user.entityId!,
      id,
      user.userId,
      { completedFilter: dto.completed_filter },
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
