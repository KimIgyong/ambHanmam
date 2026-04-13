import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WorkItemEntity } from '../../acl/entity/work-item.entity';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { NoticeEntity } from '../../notices/entity/notice.entity';
import { ContractEntity } from '../../billing/entity/contract.entity';
import { PartnerEntity } from '../../billing/entity/partner.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { AutoTaggingService } from './auto-tagging.service';

export interface SyncResult {
  module: string;
  created: number;
  skipped: number;
  tagged: number;
  errors: string[];
}

@Injectable()
export class BatchSyncService {
  private readonly logger = new Logger(BatchSyncService.name);

  constructor(
    @InjectRepository(WorkItemEntity)
    private readonly workItemRepo: Repository<WorkItemEntity>,
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    @InjectRepository(NoticeEntity)
    private readonly noticeRepo: Repository<NoticeEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    private readonly autoTaggingService: AutoTaggingService,
  ) {}

  async syncUserData(userId: string): Promise<{
    results: SyncResult[];
    totalCreated: number;
    totalTagged: number;
  }> {
    const defaultEntity = await this.entityRepo.findOne({ where: {}, order: { entCode: 'ASC' } });
    if (!defaultEntity) {
      throw new Error('No entity found in the system');
    }

    const results: SyncResult[] = [];

    // 1. Sync Todos
    results.push(await this.syncTodos(userId, defaultEntity.entId));

    // 2. Sync Notices
    results.push(await this.syncNotices(userId, defaultEntity.entId));

    // 3. Sync Contracts (all entities)
    results.push(await this.syncContracts(userId));

    const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
    const totalTagged = results.reduce((sum, r) => sum + r.tagged, 0);

    this.logger.log(
      `Batch sync complete for user ${userId}: ${totalCreated} created, ${totalTagged} tagged`,
    );

    return { results, totalCreated, totalTagged };
  }

  private async syncTodos(userId: string, entityId: string): Promise<SyncResult> {
    const result: SyncResult = { module: 'todo', created: 0, skipped: 0, tagged: 0, errors: [] };

    const todos = await this.todoRepo.find({
      where: { usrId: userId, tdoDeletedAt: IsNull() },
    });

    if (todos.length === 0) return result;

    // Batch lookup: find all existing work items for these todos in one query
    const todoIds = todos.map((t) => t.tdoId);
    const existingItems = await this.workItemRepo
      .createQueryBuilder('w')
      .select('w.witRefId')
      .where('w.witModule = :module', { module: 'todo' })
      .andWhere('w.witRefId IN (:...refIds)', { refIds: todoIds })
      .getMany();
    const existingRefIds = new Set(existingItems.map((w) => w.witRefId));

    const newTodos = todos.filter((t) => !existingRefIds.has(t.tdoId));
    result.skipped = todos.length - newTodos.length;

    for (const todo of newTodos) {
      try {
        const workItem = await this.workItemRepo.save(
          this.workItemRepo.create({
            entId: entityId,
            witType: 'TODO',
            witTitle: todo.tdoTitle,
            witOwnerId: userId,
            witVisibility: 'PRIVATE',
            witModule: 'todo',
            witRefId: todo.tdoId,
            witContent: [todo.tdoTitle, todo.tdoDescription, todo.tdoTags]
              .filter(Boolean)
              .join(' '),
          } as Partial<WorkItemEntity>),
        );
        result.created++;

        await this.safeAutoTag(workItem.witId, `todo:${todo.tdoId}`);
        result.tagged++;
      } catch (err) {
        result.errors.push(`Todo ${todo.tdoId}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Todos: ${result.created} created, ${result.skipped} skipped, ${result.tagged} tagged`);
    return result;
  }

  private async syncNotices(userId: string, entityId: string): Promise<SyncResult> {
    const result: SyncResult = { module: 'notice', created: 0, skipped: 0, tagged: 0, errors: [] };

    const notices = await this.noticeRepo.find({
      where: { usrId: userId, ntcDeletedAt: IsNull() },
    });

    if (notices.length === 0) return result;

    // Batch lookup: find all existing work items for these notices in one query
    const noticeIds = notices.map((n) => n.ntcId);
    const existingItems = await this.workItemRepo
      .createQueryBuilder('w')
      .select('w.witRefId')
      .where('w.witModule = :module', { module: 'notice' })
      .andWhere('w.witRefId IN (:...refIds)', { refIds: noticeIds })
      .getMany();
    const existingRefIds = new Set(existingItems.map((w) => w.witRefId));

    const newNotices = notices.filter((n) => !existingRefIds.has(n.ntcId));
    result.skipped = notices.length - newNotices.length;

    for (const notice of newNotices) {
      try {
        // Strip HTML tags for content
        const plainContent = notice.ntcContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        const workItem = await this.workItemRepo.save(
          this.workItemRepo.create({
            entId: entityId,
            witType: 'DOC',
            witTitle: notice.ntcTitle,
            witOwnerId: userId,
            witVisibility: notice.ntcVisibility === 'PUBLIC' ? 'ENTITY' : 'PRIVATE',
            witModule: 'notice',
            witRefId: notice.ntcId,
            witContent: [notice.ntcTitle, plainContent].filter(Boolean).join(' '),
          } as Partial<WorkItemEntity>),
        );
        result.created++;

        await this.safeAutoTag(workItem.witId, `notice:${notice.ntcId}`);
        result.tagged++;
      } catch (err) {
        result.errors.push(`Notice ${notice.ntcId}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Notices: ${result.created} created, ${result.skipped} skipped, ${result.tagged} tagged`);
    return result;
  }

  private async syncContracts(userId: string): Promise<SyncResult> {
    const result: SyncResult = { module: 'billing', created: 0, skipped: 0, tagged: 0, errors: [] };

    const contracts = await this.contractRepo.find({
      where: { ctrDeletedAt: IsNull() },
      relations: ['partner'],
    });

    for (const contract of contracts) {
      try {
        const existing = await this.workItemRepo.findOne({
          where: { witModule: 'billing', witRefId: contract.ctrId },
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        const partnerName = contract.partner?.ptnCompanyName || '';
        const content = [
          contract.ctrTitle,
          partnerName,
          contract.ctrDescription,
          contract.ctrCategory,
          contract.ctrType,
          contract.ctrNote,
        ]
          .filter(Boolean)
          .join(' ');

        const workItem = await this.workItemRepo.save(
          this.workItemRepo.create({
            entId: contract.entId,
            witType: 'DOC',
            witTitle: contract.ctrTitle,
            witOwnerId: userId,
            witVisibility: 'ENTITY',
            witModule: 'billing',
            witRefId: contract.ctrId,
            witContent: content,
          } as Partial<WorkItemEntity>),
        );
        result.created++;

        await this.safeAutoTag(workItem.witId, `billing:${contract.ctrId}`);
        result.tagged++;
      } catch (err) {
        result.errors.push(`Contract ${contract.ctrId}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Contracts: ${result.created} created, ${result.skipped} skipped, ${result.tagged} tagged`);
    return result;
  }

  private async safeAutoTag(workItemId: string, label: string): Promise<void> {
    try {
      await this.autoTaggingService.tagWorkItem(workItemId);
    } catch (err) {
      this.logger.warn(`Auto-tagging failed for ${label}: ${(err as Error).message}`);
    }
  }
}
