import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { WorkItemShareEntity } from '../entity/work-item-share.entity';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { WorkItemShareResponse } from '@amb/types';

@Injectable()
export class SharingService {
  constructor(
    @InjectRepository(WorkItemShareEntity)
    private readonly shareRepository: Repository<WorkItemShareEntity>,
  ) {}

  async shareItem(params: {
    workItemId: string;
    targetType: string;
    targetId: string;
    permission: string;
    sharedBy: string;
    expiresAt?: string;
  }): Promise<WorkItemShareResponse> {
    const entity = this.shareRepository.create({
      witId: params.workItemId,
      wisTargetType: params.targetType,
      wisTargetId: params.targetId,
      wisPermission: params.permission,
      wisSharedBy: params.sharedBy,
      wisExpiresAt: params.expiresAt ? new Date(params.expiresAt) : undefined,
      wisIsActive: true,
    } as DeepPartial<WorkItemShareEntity>);

    const saved: WorkItemShareEntity = await this.shareRepository.save(entity as WorkItemShareEntity);
    return this.toResponse(saved);
  }

  async unshareItem(shareId: string): Promise<void> {
    const entity = await this.shareRepository.findOne({ where: { wisId: shareId } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SHARE_NOT_FOUND.message);
    }
    entity.wisIsActive = false;
    await this.shareRepository.save(entity);
  }

  async getSharesForItem(workItemId: string): Promise<WorkItemShareResponse[]> {
    const entities = await this.shareRepository.find({
      where: { witId: workItemId, wisIsActive: true },
      relations: ['sharedByUser'],
      order: { wisCreatedAt: 'DESC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async getSharedWithUser(userId: string): Promise<WorkItemShareEntity[]> {
    return this.shareRepository.find({
      where: { wisTargetType: 'USER', wisTargetId: userId, wisIsActive: true },
      relations: ['workItem', 'workItem.owner'],
    });
  }

  async getUserSharePermission(userId: string, workItemId: string): Promise<string | null> {
    const share = await this.shareRepository.findOne({
      where: { witId: workItemId, wisTargetType: 'USER', wisTargetId: userId, wisIsActive: true },
    });

    if (!share) return null;

    // Check expiry
    if (share.wisExpiresAt && new Date(share.wisExpiresAt) < new Date()) {
      return null;
    }

    return share.wisPermission;
  }

  private toResponse(entity: WorkItemShareEntity): WorkItemShareResponse {
    return {
      shareId: entity.wisId,
      workItemId: entity.witId,
      targetType: entity.wisTargetType as any,
      targetId: entity.wisTargetId,
      targetName: '', // Resolved by caller or frontend
      permission: entity.wisPermission as any,
      sharedBy: entity.wisSharedBy,
      sharedByName: entity.sharedByUser?.usrName || '',
      expiresAt: entity.wisExpiresAt?.toISOString() || null,
      isActive: entity.wisIsActive,
      createdAt: entity.wisCreatedAt?.toISOString(),
    };
  }
}
