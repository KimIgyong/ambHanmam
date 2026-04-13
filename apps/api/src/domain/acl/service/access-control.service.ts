import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { WorkItemEntity } from '../entity/work-item.entity';
import { HierarchyService } from '../../unit/service/hierarchy.service';
import { UserUnitRoleService } from '../../unit/service/user-unit-role.service';
import { CellAccessService } from '../../members/service/cell-access.service';
import { AccessCheckResult } from '@amb/types';

@Injectable()
export class AccessControlService {
  constructor(
    @InjectRepository(WorkItemEntity)
    private readonly workItemRepository: Repository<WorkItemEntity>,
    private readonly hierarchyService: HierarchyService,
    private readonly userUnitRoleService: UserUnitRoleService,
    private readonly cellAccessService: CellAccessService,
  ) {}

  /**
   * 5-step access control check
   * 1. Owner check       → ADMIN permission
   * 2. System role check → CHAIRMAN/SYSTEM_ADMIN → COMMENT permission
   * 3. Hierarchy check   → Department manager → COMMENT permission
   * 4. Sharing check     → Explicit share → shared permission level
   * 5. Visibility check  → UNIT/ENTITY/PUBLIC → VIEW permission
   * 6. Default deny
   */
  async canAccess(userId: string, workItemId: string, userRole?: string): Promise<AccessCheckResult> {
    const workItem = await this.workItemRepository.findOne({
      where: { witId: workItemId },
    });

    if (!workItem) {
      return { allowed: false, permission: null, reason: 'Work item not found' };
    }

    // 1. Owner check
    if (workItem.witOwnerId === userId) {
      return { allowed: true, permission: 'ADMIN', reason: 'Owner' };
    }

    // 2. System role check (ADMIN in the platform sense)
    if (userRole === 'ADMIN') {
      return { allowed: true, permission: 'COMMENT', reason: 'System admin' };
    }

    // 3. Hierarchy check — is the user a manager of the owner?
    const isManager = await this.hierarchyService.isManagerOfUser(userId, workItem.witOwnerId);
    if (isManager) {
      return { allowed: true, permission: 'COMMENT', reason: 'Department manager' };
    }

    // 4. Sharing check — handled in Phase 3, placeholder here
    // Will be enhanced with amb_work_item_shares JOIN

    // 5. Visibility check
    if (workItem.witVisibility === 'PUBLIC') {
      return { allowed: true, permission: 'VIEW', reason: 'Public visibility' };
    }

    if (workItem.witVisibility === 'ENTITY') {
      const userEntityId = await this.hierarchyService.getUserEntityId(userId);
      if (userEntityId && userEntityId === workItem.entId) {
        return { allowed: true, permission: 'VIEW', reason: 'Same entity' };
      }
    }

    if (workItem.witVisibility === 'UNIT') {
      const userUnitIds = await this.hierarchyService.getUserUnitIds(userId);
      const ownerUnitIds = await this.hierarchyService.getUserUnitIds(workItem.witOwnerId);
      const overlap = userUnitIds.some((id) => ownerUnitIds.includes(id));
      if (overlap) {
        return { allowed: true, permission: 'VIEW', reason: 'Same department' };
      }
    }

    // 5.5. CELL visibility check
    if (workItem.witVisibility === 'CELL' && workItem.witCellId) {
      const isMember = await this.cellAccessService.isUserInCell(userId, workItem.witCellId);
      if (isMember) {
        return { allowed: true, permission: 'VIEW', reason: 'Group member' };
      }
    }

    // 6. Default deny
    return { allowed: false, permission: null, reason: 'Access denied' };
  }

  /**
   * Get all visible work items for a user with filters and pagination
   */
  async getVisibleItems(
    userId: string,
    userRole: string,
    filters: {
      type?: string;
      visibility?: string;
      scope?: 'MY' | 'SHARED' | 'TEAM' | 'ALL';
      search?: string;
    },
    page = 1,
    limit = 20,
    entityId?: string,
  ): Promise<{ items: WorkItemEntity[]; total: number }> {
    const qb = this.workItemRepository
      .createQueryBuilder('wi')
      .leftJoinAndSelect('wi.owner', 'owner')
      .where('wi.witDeletedAt IS NULL');

    if (entityId) {
      qb.andWhere('wi.entId = :entityId', { entityId });
    }

    // Scope filter
    if (filters.scope === 'MY' || !filters.scope) {
      qb.andWhere('wi.witOwnerId = :userId', { userId });
    } else if (filters.scope === 'TEAM') {
      const visibleUsers = await this.hierarchyService.getVisibleUsers(userId);
      qb.andWhere('wi.witOwnerId IN (:...visibleUsers)', { visibleUsers });
    } else if (filters.scope === 'ALL') {
      if (userRole === 'ADMIN') {
        // Admin can see everything
      } else {
        // Build visibility-based query
        const visibleUsers = await this.hierarchyService.getVisibleUsers(userId);
        const userEntityId = await this.hierarchyService.getUserEntityId(userId);
        const userCellIds = await this.cellAccessService.getUserCellIds(userId);

        qb.andWhere(
          new Brackets((sub) => {
            sub
              .where('wi.witOwnerId = :userId', { userId })
              .orWhere('wi.witVisibility = :publicVis', { publicVis: 'PUBLIC' })
              .orWhere(
                new Brackets((eSub) => {
                  eSub
                    .where('wi.witVisibility = :entityVis', { entityVis: 'ENTITY' })
                    .andWhere('wi.entId = :userEntityId', { userEntityId: userEntityId || '' });
                }),
              )
              .orWhere(
                new Brackets((dSub) => {
                  dSub
                    .where('wi.witVisibility IN (:...unitVis)', { unitVis: ['UNIT', 'SHARED'] })
                    .andWhere('wi.witOwnerId IN (:...visibleUsers)', { visibleUsers });
                }),
              );
            if (userCellIds.length > 0) {
              sub.orWhere(
                new Brackets((gSub) => {
                  gSub
                    .where('wi.witVisibility = :cellVis', { cellVis: 'CELL' })
                    .andWhere('wi.witCellId IN (:...userCellIds)', { userCellIds });
                }),
              );
            }
          }),
        );
      }
    }

    if (filters.type) {
      qb.andWhere('wi.witType = :type', { type: filters.type });
    }

    if (filters.visibility) {
      qb.andWhere('wi.witVisibility = :visibility', { visibility: filters.visibility });
    }

    if (filters.search) {
      qb.andWhere('wi.witTitle ILIKE :search', { search: `%${filters.search}%` });
    }

    qb.orderBy('wi.witUpdatedAt', 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { items, total };
  }
}
