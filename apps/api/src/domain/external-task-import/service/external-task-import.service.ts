import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  ExternalProviderMeta,
  ExternalProject,
  ExternalGroup,
  ExternalTask,
  PaginatedExternalResult,
  ExternalTaskImportResult,
  ExternalTaskImportResultItem,
} from '@amb/types';
import { ExternalTaskMappingEntity } from '../entity/external-task-mapping.entity';
import { ExternalImportLogEntity } from '../entity/external-import-log.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { EntityCustomAppService } from '../../entity-settings/service/entity-custom-app.service';
import { IssueSequenceService } from '../../issues/service/issue-sequence.service';
import { ProviderRegistry } from '../provider/provider-registry';
import { ProviderConnectionConfig, FetchTasksOptions } from '../interface/external-task-provider.interface';

@Injectable()
export class ExternalTaskImportService {
  private readonly logger = new Logger(ExternalTaskImportService.name);

  constructor(
    @InjectRepository(ExternalTaskMappingEntity)
    private readonly mappingRepo: Repository<ExternalTaskMappingEntity>,
    @InjectRepository(ExternalImportLogEntity)
    private readonly logRepo: Repository<ExternalImportLogEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    private readonly providerRegistry: ProviderRegistry,
    private readonly customAppService: EntityCustomAppService,
    private readonly issueSequenceService: IssueSequenceService,
  ) {}

  /* ── Provider 목록 ── */

  async getAvailableProviders(entityId: string): Promise<ExternalProviderMeta[]> {
    const supportedTypes = this.providerRegistry.getSupportedTypes();
    const apps = await this.customAppService.findAll(entityId);

    // 외부 태스크 도구로 사용되는 Custom App만 필터 (eca_code가 provider type으로 시작하는 것)
    const providerMetas: ExternalProviderMeta[] = supportedTypes.map((type) => {
      const matchedApp = (apps as any[]).find(
        (a) => a.code?.startsWith(type) && a.isActive,
      );
      return {
        type,
        displayName: this.providerRegistry.getProvider(type).displayName,
        icon: type,
        isConnected: !!matchedApp,
        appId: matchedApp?.id || undefined,
        appName: matchedApp?.name || undefined,
      };
    });

    return providerMetas;
  }

  /* ── Connection Test ── */

  async testConnection(providerType: string, appId: string, entityId: string) {
    const config = await this.resolveConfig(appId, entityId);
    const provider = this.providerRegistry.getProvider(providerType);
    return provider.testConnection(config);
  }

  /* ── Fetch ── */

  async fetchProjects(providerType: string, appId: string, entityId: string): Promise<ExternalProject[]> {
    const config = await this.resolveConfig(appId, entityId);
    const provider = this.providerRegistry.getProvider(providerType);
    return provider.fetchProjects(config);
  }

  async fetchGroups(providerType: string, appId: string, entityId: string, projectId: string): Promise<ExternalGroup[]> {
    const config = await this.resolveConfig(appId, entityId);
    const provider = this.providerRegistry.getProvider(providerType);
    return provider.fetchGroups(config, projectId);
  }

  async fetchTasks(
    providerType: string,
    appId: string,
    entityId: string,
    groupId: string,
    options?: FetchTasksOptions,
  ): Promise<PaginatedExternalResult<ExternalTask>> {
    const config = await this.resolveConfig(appId, entityId);
    const provider = this.providerRegistry.getProvider(providerType);
    const result = await provider.fetchTasks(config, groupId, options);

    // Mark already-imported tasks
    if (result.data.length > 0) {
      const externalIds = result.data.map((t) => t.id);
      const existing = await this.mappingRepo
        .createQueryBuilder('m')
        .where('m.entId = :entityId', { entityId })
        .andWhere('m.etmProvider = :providerType', { providerType })
        .andWhere('m.etmExternalId IN (:...externalIds)', { externalIds })
        .getMany();

      const existingMap = new Map(existing.map((e) => [e.etmExternalId, e.issId]));
      for (const task of result.data) {
        if (existingMap.has(task.id)) {
          task.alreadyImported = true;
          task.importedIssueId = existingMap.get(task.id);
        }
      }
    }

    return result;
  }

  /* ── Import ── */

  async importTasks(
    providerType: string,
    appId: string,
    entityId: string,
    userId: string,
    taskIds: string[],
    tasks: ExternalTask[],
    defaults: Record<string, any>,
    projectName?: string,
    groupName?: string,
  ): Promise<ExternalTaskImportResult> {
    const provider = this.providerRegistry.getProvider(providerType);
    const batchId = uuidv4();
    const results: ExternalTaskImportResultItem[] = [];
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const taskId of taskIds) {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        results.push({ external_id: taskId, status: 'failed', error: 'Task not found in fetched list' });
        failed++;
        continue;
      }

      try {
        // Check duplicate
        const existingMapping = await this.mappingRepo.findOne({
          where: { entId: entityId, etmProvider: providerType, etmExternalId: taskId },
        });
        if (existingMapping) {
          results.push({ external_id: taskId, status: 'skipped', issue_id: existingMapping.issId });
          skipped++;
          continue;
        }

        // Convert to issue data (inject group name for status mapping)
        const enrichedDefaults = { ...defaults, _groupName: groupName };
        const issueData = provider.convertToIssueData(task, enrichedDefaults);

        // Generate ref number
        const refNumber = await this.issueSequenceService.generateRefNumber(entityId);

        // Create issue
        const issue = this.issueRepo.create({
          ...issueData,
          entId: entityId,
          issReporterId: userId,
          issRefNumber: refNumber,
          issOriginalLang: 'en',
        });
        const saved = await this.issueRepo.save(issue);

        // Create mapping
        const mapping = this.mappingRepo.create({
          entId: entityId,
          ecaId: appId,
          etmProvider: providerType,
          etmExternalId: taskId,
          etmExternalUrl: task.url || null,
          etmExternalProject: projectName || null,
          etmExternalGroup: groupName || null,
          issId: saved.issId,
          etmImportedBy: userId,
        });
        await this.mappingRepo.save(mapping);

        results.push({
          external_id: taskId,
          status: 'imported',
          issue_id: saved.issId,
          ref_number: refNumber,
        });
        imported++;
      } catch (e: any) {
        this.logger.error(`Failed to import task ${taskId}: ${e.message}`, e.stack);
        results.push({ external_id: taskId, status: 'failed', error: e.message });
        failed++;
      }
    }

    // Save import log
    const log = this.logRepo.create({
      entId: entityId,
      ecaId: appId,
      eilProvider: providerType,
      eilBatchId: batchId,
      eilProjectName: projectName || null,
      eilGroupName: groupName || null,
      eilTotalCount: taskIds.length,
      eilImportedCount: imported,
      eilSkippedCount: skipped,
      eilFailedCount: failed,
      eilExecutedBy: userId,
    });
    await this.logRepo.save(log);

    return { batch_id: batchId, total: taskIds.length, imported, skipped, failed, results };
  }

  /* ── Import History ── */

  async getImportLogs(entityId: string, page = 1, size = 20) {
    const [data, total] = await this.logRepo.findAndCount({
      where: { entId: entityId },
      order: { eilCreatedAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
      relations: ['executedBy'],
    });
    return {
      data: data.map((d) => ({
        id: d.eilId,
        provider: d.eilProvider,
        batchId: d.eilBatchId,
        projectName: d.eilProjectName,
        groupName: d.eilGroupName,
        totalCount: d.eilTotalCount,
        importedCount: d.eilImportedCount,
        skippedCount: d.eilSkippedCount,
        failedCount: d.eilFailedCount,
        executedBy: d.executedBy ? { id: d.executedBy.usrId, name: d.executedBy.usrName, email: d.executedBy.usrEmail } : null,
        createdAt: d.eilCreatedAt,
      })),
      totalCount: total,
      hasMore: page * size < total,
    };
  }

  async getImportedTasks(entityId: string, providerType?: string, page = 1, size = 20) {
    const qb = this.mappingRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.issue', 'issue')
      .where('m.entId = :entityId', { entityId })
      .orderBy('m.etmImportedAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);

    if (providerType) {
      qb.andWhere('m.etmProvider = :providerType', { providerType });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((d) => ({
        mappingId: d.etmId,
        provider: d.etmProvider,
        externalId: d.etmExternalId,
        externalUrl: d.etmExternalUrl,
        externalProject: d.etmExternalProject,
        externalGroup: d.etmExternalGroup,
        issueId: d.issId,
        issueTitle: d.issue?.issTitle,
        issueRefNumber: d.issue?.issRefNumber,
        issueStatus: d.issue?.issStatus,
        importedAt: d.etmImportedAt,
      })),
      totalCount: total,
      hasMore: page * size < total,
    };
  }

  /* ── Tools (Entity Settings 영역) ── */

  async getExternalTools(entityId: string) {
    const apps = await this.customAppService.findAll(entityId);
    const supportedTypes = this.providerRegistry.getSupportedTypes();

    // Filter Custom Apps that match external task provider types
    return (apps as any[]).filter((a) =>
      supportedTypes.some((type) => a.code?.startsWith(type)),
    );
  }

  /**
   * Entity의 특정 Custom App에서 Provider 연결 설정 조회 (public)
   */
  async getProviderConfig(appId: string, entityId: string): Promise<ProviderConnectionConfig> {
    return this.resolveConfig(appId, entityId);
  }

  /* ── Private ── */

  private async resolveConfig(appId: string, entityId: string): Promise<ProviderConnectionConfig> {
    // Use EntityCustomAppService to get the app and decrypt the API key
    const apps = await this.customAppService.findAll(entityId);
    const app = (apps as any[]).find((a: any) => a.id === appId);
    if (!app) {
      throw new NotFoundException(`Custom app ${appId} not found in entity ${entityId}`);
    }

    // The app.apiKeyDecrypted is not exposed; we need to access the raw entity
    // Use the internal method via repository
    const rawApp = await this.mappingRepo.manager
      .getRepository('EntityCustomAppEntity')
      .findOne({ where: { ecaId: appId, entId: entityId } });

    if (!rawApp) {
      throw new NotFoundException(`Custom app ${appId} not found`);
    }

    // Decrypt the API key using the same method as EntityCustomAppService
    const apiKey = this.decryptApiKey((rawApp as any).ecaApiKeyEnc);

    return {
      apiKey,
      baseUrl: app.url || undefined,
    };
  }

  private decryptApiKey(encoded: string | null): string {
    if (!encoded) throw new BadRequestException('API key not configured for this app');

    const crypto = require('crypto');
    const key = process.env.ENCRYPTION_KEY;
    if (!key) throw new Error('ENCRYPTION_KEY not configured');

    const buf = Buffer.from(encoded, 'base64');
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const data = buf.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(data, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
