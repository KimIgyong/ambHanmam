import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AsanaProjectMappingEntity } from '../entity/asana-project-mapping.entity';
import { AsanaTaskMappingEntity } from '../entity/asana-task-mapping.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { AsanaApiService, AsanaTask } from './asana-api.service';
import { ApiKeyService } from '../../settings/service/api-key.service';

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
}

@Injectable()
export class AsanaImportService {
  private readonly logger = new Logger(AsanaImportService.name);

  constructor(
    @InjectRepository(AsanaProjectMappingEntity)
    private readonly mappingRepo: Repository<AsanaProjectMappingEntity>,
    @InjectRepository(AsanaTaskMappingEntity)
    private readonly taskMappingRepo: Repository<AsanaTaskMappingEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    private readonly asanaApi: AsanaApiService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  async importTasks(
    entityId: string,
    mappingId: string,
    userId: string,
    opts?: { completedFilter?: 'all' | 'active' | 'completed' },
  ): Promise<ImportResult> {
    const mapping = await this.mappingRepo.findOne({
      where: { apmId: mappingId, entId: entityId, apmDeletedAt: IsNull() },
    });
    if (!mapping) throw new NotFoundException('Project mapping not found');

    const pat = await this.apiKeyService.getDecryptedKey('ASANA_PAT', entityId);
    if (!pat) throw new Error('Asana PAT not configured');

    const tasks = await this.asanaApi.getTasksForProject(pat, mapping.apmAsanaProjectGid, {
      completedFilter: opts?.completedFilter || 'all',
    });

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        // Duplicate check
        const existing = await this.taskMappingRepo.findOne({
          where: { apmId: mapping.apmId, atmAsanaTaskGid: task.gid },
        });
        if (existing) {
          skipped++;
          continue;
        }

        // Create issue
        const issue = this.issueRepo.create({
          entId: entityId,
          issType: 'TASK',
          issTitle: (task.name || 'Untitled').substring(0, 200),
          issDescription: this.buildDescription(task),
          issSeverity: 'MINOR',
          issStatus: task.completed ? 'CLOSED' : 'OPEN',
          issPriority: this.mapPriority(task.priority),
          issReporterId: userId,
          pjtId: mapping.pjtId,
          issStartDate: task.startOn,
          issDueDate: task.dueOn,
          issRefNumber: task.permalinkUrl?.substring(0, 50) || null,
          issAsanaGid: task.gid,
          issVisibility: 'ENTITY',
          issDoneRatio: task.completed ? 100 : 0,
        });

        const saved = await this.issueRepo.save(issue);

        // Save task mapping
        await this.taskMappingRepo.save({
          apmId: mapping.apmId,
          atmAsanaTaskGid: task.gid,
          issId: saved.issId,
        });

        imported++;
      } catch (e) {
        this.logger.error(`Failed to import task ${task.gid}: ${e.message}`);
        failed++;
      }
    }

    // Update last synced
    mapping.apmLastSyncedAt = new Date();
    await this.mappingRepo.save(mapping);

    this.logger.log(`Asana import complete for mapping ${mappingId}: total=${tasks.length}, imported=${imported}, skipped=${skipped}, failed=${failed}`);
    return { total: tasks.length, imported, skipped, failed };
  }

  private buildDescription(task: AsanaTask): string {
    const parts: string[] = [];

    if (task.sectionName) parts.push(`[Section] ${task.sectionName}`);
    if (task.assigneeName) parts.push(`[Assignee] ${task.assigneeName}`);
    if (task.permalinkUrl) parts.push(`[Asana] ${task.permalinkUrl}`);
    if (parts.length) parts.push('---');
    parts.push(task.notes || '');

    return parts.join('\n');
  }

  private mapPriority(priority: string | null): number {
    if (!priority) return 3;
    const lower = priority.toLowerCase();
    if (lower === 'high') return 1;
    if (lower === 'medium') return 3;
    if (lower === 'low') return 5;
    return 3;
  }
}
