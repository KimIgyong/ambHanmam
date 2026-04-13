import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { AccessAuditLogEntity } from '../entity/access-audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AccessAuditLogEntity)
    private readonly auditRepository: Repository<AccessAuditLogEntity>,
  ) {}

  async logAccess(params: {
    userId: string;
    action: string;
    targetType: string;
    targetId: string;
    accessPath?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    const entity = this.auditRepository.create({
      aalUserId: params.userId,
      aalAction: params.action,
      aalTargetType: params.targetType,
      aalTargetId: params.targetId,
      aalAccessPath: params.accessPath || undefined,
      aalDetails: params.details || undefined,
    } as DeepPartial<AccessAuditLogEntity>);

    await this.auditRepository.save(entity as AccessAuditLogEntity);
  }

  async logShare(params: {
    userId: string;
    workItemId: string;
    targetId: string;
    permission: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: 'SHARE',
      targetType: 'WORK_ITEM',
      targetId: params.workItemId,
      details: {
        sharedWith: params.targetId,
        permission: params.permission,
      },
    });
  }

  async logVisibilityChange(params: {
    userId: string;
    workItemId: string;
    oldVisibility: string;
    newVisibility: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: 'EDIT',
      targetType: 'WORK_ITEM',
      targetId: params.workItemId,
      details: {
        change: 'visibility',
        from: params.oldVisibility,
        to: params.newVisibility,
      },
    });
  }

  async getAuditLog(filters: {
    userId?: string;
    targetType?: string;
    targetId?: string;
    action?: string;
    limit?: number;
  }) {
    const qb = this.auditRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user');

    if (filters.userId) {
      qb.andWhere('log.aalUserId = :userId', { userId: filters.userId });
    }
    if (filters.targetType) {
      qb.andWhere('log.aalTargetType = :targetType', { targetType: filters.targetType });
    }
    if (filters.targetId) {
      qb.andWhere('log.aalTargetId = :targetId', { targetId: filters.targetId });
    }
    if (filters.action) {
      qb.andWhere('log.aalAction = :action', { action: filters.action });
    }

    qb.orderBy('log.aalCreatedAt', 'DESC');
    qb.take(filters.limit || 50);

    return qb.getMany();
  }
}
