import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SubStorageQuotaEntity } from '../entity/sub-storage-quota.entity';

const GB = 1024 ** 3;

export interface StorageStatus {
  usedBytes: number;
  totalGb: number;
  usedPct: number;
  isOverQuota: boolean;
  isUploadBlocked: boolean;
}

@Injectable()
export class StorageQuotaService {
  private readonly logger = new Logger(StorageQuotaService.name);

  constructor(
    @InjectRepository(SubStorageQuotaEntity)
    private readonly quotaRepo: Repository<SubStorageQuotaEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async checkUpload(
    entId: string,
    fileSizeBytes: number,
    warnPct = 100,
    blockPct = 120,
  ): Promise<{ warn: boolean }> {
    const quota = await this.getOrFail(entId);
    const totalBytes = quota.totalGb * GB;

    const projectedBytes = Number(quota.sqt_used_bytes) + fileSizeBytes;
    const blockThreshold = totalBytes * (blockPct / 100);
    const warnThreshold = totalBytes * (warnPct / 100);

    if (projectedBytes > blockThreshold || quota.sqt_is_upload_blocked) {
      throw new BadRequestException({
        code: 'E29002',
        message:
          'Storage upload blocked. Quota exceeded 120%. Please add storage.',
        data: {
          usedGb: +(Number(quota.sqt_used_bytes) / GB).toFixed(3),
          totalGb: quota.totalGb,
          usedPct: +quota.usedPct.toFixed(1),
        },
      });
    }

    return { warn: projectedBytes > warnThreshold };
  }

  async addUsage(
    entId: string,
    bytes: number,
    manager?: EntityManager,
  ): Promise<void> {
    await this._updateUsage(entId, bytes, manager);
  }

  async removeUsage(
    entId: string,
    bytes: number,
    manager?: EntityManager,
  ): Promise<void> {
    await this._updateUsage(entId, -bytes, manager);
  }

  async purchaseAddon(
    entId: string,
    addGb: number,
    manager?: EntityManager,
  ): Promise<SubStorageQuotaEntity> {
    const em = manager ?? this.dataSource.manager;

    return em.transaction(async (tx) => {
      const quota = await tx.findOne(SubStorageQuotaEntity, {
        where: { ent_id: entId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!quota) {
        throw new NotFoundException({
          code: 'E29004',
          message: 'Storage quota not found.',
        });
      }

      const newTotal = quota.sqt_base_gb + quota.sqt_addon_gb + addGb;
      if (newTotal > quota.sqt_max_gb) {
        throw new BadRequestException({
          code: 'E29002',
          message: `Storage limit exceeded. Max: ${quota.sqt_max_gb}GB`,
        });
      }

      quota.sqt_addon_gb += addGb;
      quota.sqt_is_upload_blocked =
        Number(quota.sqt_used_bytes) > quota.totalGb * GB * 1.2;
      return tx.save(quota);
    });
  }

  async getOrFail(entId: string): Promise<SubStorageQuotaEntity> {
    const quota = await this.quotaRepo.findOne({ where: { ent_id: entId } });
    if (!quota) {
      throw new NotFoundException({
        code: 'E29004',
        message: 'Storage quota not found.',
      });
    }
    return quota;
  }

  async getStatus(entId: string): Promise<StorageStatus> {
    const quota = await this.getOrFail(entId);
    const totalBytes = quota.totalGb * GB;
    return {
      usedBytes: Number(quota.sqt_used_bytes),
      totalGb: quota.totalGb,
      usedPct: quota.usedPct,
      isOverQuota: Number(quota.sqt_used_bytes) > totalBytes,
      isUploadBlocked: quota.sqt_is_upload_blocked,
    };
  }

  private async _updateUsage(
    entId: string,
    deltaBytes: number,
    manager?: EntityManager,
  ): Promise<void> {
    const em = manager ?? this.dataSource.manager;

    await em.transaction(async (tx) => {
      const quota = await tx.findOne(SubStorageQuotaEntity, {
        where: { ent_id: entId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!quota) return;

      quota.sqt_used_bytes = Math.max(
        0,
        Number(quota.sqt_used_bytes) + deltaBytes,
      );
      const totalBytes = quota.totalGb * GB;
      quota.sqt_is_upload_blocked =
        Number(quota.sqt_used_bytes) > totalBytes * 1.2;
      quota.sqt_last_checked_at = new Date();
      await tx.save(quota);
    });
  }
}
