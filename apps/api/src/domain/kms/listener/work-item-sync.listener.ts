import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkItemEntity } from '../../acl/entity/work-item.entity';
import { AutoTaggingService } from '../service/auto-tagging.service';
import { ModuleIntegrationService } from '../service/module-integration.service';
import { ModuleDataEvent, MODULE_DATA_EVENTS } from '../event/module-data.event';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';

@Injectable()
export class WorkItemSyncListener {
  private readonly logger = new Logger(WorkItemSyncListener.name);

  constructor(
    @InjectRepository(WorkItemEntity)
    private readonly workItemRepo: Repository<WorkItemEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly entityUserRoleRepo: Repository<EntityUserRoleEntity>,
    private readonly autoTaggingService: AutoTaggingService,
    private readonly moduleIntegrationService: ModuleIntegrationService,
  ) {}

  @OnEvent(MODULE_DATA_EVENTS.CREATED, { async: true })
  async handleModuleDataCreated(event: ModuleDataEvent) {
    try {
      const entityId = await this.resolveEntityId(event);
      if (!entityId) {
        this.logger.warn(`No entity found for user ${event.ownerId}, skipping WorkItem sync`);
        return;
      }

      // Create or find WorkItem
      let workItem = await this.workItemRepo.findOne({
        where: { witModule: event.module, witRefId: event.refId },
      });

      if (!workItem) {
        const newItem = this.workItemRepo.create({
          entId: entityId,
          witType: event.type,
          witTitle: event.title,
          witOwnerId: event.ownerId,
          witVisibility: event.visibility || 'PRIVATE',
          witCellId: event.cellId || null,
          witModule: event.module,
          witRefId: event.refId,
          witContent: event.content || '',
        } as Partial<WorkItemEntity>);
        workItem = await this.workItemRepo.save(newItem);
        this.logger.log(`Created WorkItem for ${event.module}:${event.refId}`);
      }

      // Trigger auto-tagging (non-blocking)
      this.triggerAutoTagging(workItem!, event, entityId).catch((err) => {
        this.logger.warn(`Auto-tagging failed for ${event.module}:${event.refId}: ${err.message}`);
      });
    } catch (error) {
      this.logger.error(`WorkItem sync failed for ${event.module}:${event.refId}: ${error}`);
    }
  }

  @OnEvent(MODULE_DATA_EVENTS.UPDATED, { async: true })
  async handleModuleDataUpdated(event: ModuleDataEvent) {
    try {
      const workItem = await this.workItemRepo.findOne({
        where: { witModule: event.module, witRefId: event.refId },
      });

      if (!workItem) {
        // If no WorkItem exists yet, treat as create
        await this.handleModuleDataCreated(event);
        return;
      }

      // Update WorkItem content
      workItem.witTitle = event.title;
      workItem.witContent = event.content || '';
      if (event.visibility) {
        workItem.witVisibility = event.visibility;
      }
      if (event.cellId !== undefined) {
        workItem.witCellId = (event.cellId || null) as any;
      }
      await this.workItemRepo.save(workItem);

      this.logger.log(`Updated WorkItem for ${event.module}:${event.refId}`);
    } catch (error) {
      this.logger.error(`WorkItem update failed for ${event.module}:${event.refId}: ${error}`);
    }
  }

  private async triggerAutoTagging(
    workItem: WorkItemEntity,
    event: ModuleDataEvent,
    entityId: string,
  ): Promise<void> {
    const contentLength = (event.content || '').split(/\s+/).filter(Boolean).length;
    if (contentLength < 3) {
      this.logger.debug(`Content too short for ${event.module}:${event.refId}, skipping auto-tag`);
      return;
    }

    // Use module-specific tagging for billing
    if (event.module === 'billing') {
      await this.moduleIntegrationService.tagFromBilling({
        entityId,
        workItemId: workItem.witId,
        partnerName: undefined,
        serviceCategory: undefined,
        contractType: undefined,
      });
    }

    // General AI auto-tagging
    await this.autoTaggingService.tagWorkItem(workItem.witId);
  }

  private async resolveEntityId(event: ModuleDataEvent): Promise<string | null> {
    if (event.entityId) return event.entityId;

    // Find user's default entity
    const role = await this.entityUserRoleRepo.findOne({
      where: { usrId: event.ownerId },
      order: { eurCreatedAt: 'ASC' },
    });

    if (role) return role.entId;

    // Fallback: use first entity
    const entity = await this.entityRepo.findOne({ where: {}, order: { entCode: 'ASC' } });
    return entity?.entId || null;
  }
}
