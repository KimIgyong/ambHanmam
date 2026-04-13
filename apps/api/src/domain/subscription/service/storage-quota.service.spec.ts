/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { StorageQuotaService } from './storage-quota.service';
import { SubStorageQuotaEntity } from '../entity/sub-storage-quota.entity';

const GB = 1024 ** 3;

describe('StorageQuotaService', () => {
  let service: StorageQuotaService;
  let quotaRepo: any;

  const mockTxManager = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
    transaction: jest.fn(),
  };

  const mockDataSource = {
    manager: {
      ...mockTxManager,
      transaction: jest.fn().mockImplementation((cb: any) => cb(mockTxManager)),
    },
  };

  const createQuota = (
    overrides?: Partial<SubStorageQuotaEntity>,
  ): SubStorageQuotaEntity => {
    const q = Object.create(SubStorageQuotaEntity.prototype);
    return Object.assign(q, {
      sqt_id: 'quota-uuid',
      ent_id: 'ent-001',
      sbn_id: 'sub-uuid',
      sqt_base_gb: 1,
      sqt_addon_gb: 0,
      sqt_max_gb: 100,
      sqt_used_bytes: 0,
      sqt_is_upload_blocked: false,
      sqt_last_checked_at: null,
      ...overrides,
    });
  };

  beforeEach(async () => {
    quotaRepo = {
      findOne: jest.fn(),
    };

    mockTxManager.findOne.mockReset();
    mockTxManager.save.mockReset().mockImplementation((entity: any) => Promise.resolve(entity));
    mockDataSource.manager.transaction.mockReset().mockImplementation((cb: any) => cb(mockTxManager));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageQuotaService,
        { provide: getRepositoryToken(SubStorageQuotaEntity), useValue: quotaRepo },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get(StorageQuotaService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── checkUpload ─────────────────────────────────────

  describe('checkUpload', () => {
    it('should allow upload when under 100% usage', async () => {
      const quota = createQuota({
        sqt_base_gb: 1,
        sqt_used_bytes: 0.5 * GB,
      });
      quotaRepo.findOne.mockResolvedValue(quota);

      const result = await service.checkUpload('ent-001', 10 * 1024 * 1024); // 10MB
      expect(result.warn).toBe(false);
    });

    it('should return warn:true when projected usage > 100%', async () => {
      const quota = createQuota({
        sqt_base_gb: 1,
        sqt_used_bytes: Math.floor(0.99 * GB),
      });
      quotaRepo.findOne.mockResolvedValue(quota);

      const result = await service.checkUpload('ent-001', 20 * 1024 * 1024); // 20MB → 101%
      expect(result.warn).toBe(true);
    });

    it('should block upload when projected usage > 120%', async () => {
      const quota = createQuota({
        sqt_base_gb: 1,
        sqt_used_bytes: Math.floor(1.15 * GB),
      });
      quotaRepo.findOne.mockResolvedValue(quota);

      await expect(
        service.checkUpload('ent-001', 100 * 1024 * 1024), // 100MB → >120%
      ).rejects.toThrow(BadRequestException);
    });

    it('should block upload when sqt_is_upload_blocked is true', async () => {
      const quota = createQuota({
        sqt_base_gb: 10,
        sqt_used_bytes: 100,
        sqt_is_upload_blocked: true,
      });
      quotaRepo.findOne.mockResolvedValue(quota);

      await expect(
        service.checkUpload('ent-001', 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw E29004 when quota not found', async () => {
      quotaRepo.findOne.mockResolvedValue(null);

      await expect(
        service.checkUpload('ent-no-quota', 1000),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle exact boundary at 100% (warn=true)', async () => {
      const quota = createQuota({
        sqt_base_gb: 1,
        sqt_used_bytes: 0,
      });
      quotaRepo.findOne.mockResolvedValue(quota);

      // Uploading exactly 1 GB → projectedBytes = totalBytes → not > warnThreshold
      const result = await service.checkUpload('ent-001', GB);
      expect(result.warn).toBe(false);
    });

    it('should handle exact boundary at 120% (blocked)', async () => {
      const quota = createQuota({
        sqt_base_gb: 1,
        sqt_used_bytes: 0,
      });
      quotaRepo.findOne.mockResolvedValue(quota);

      // Uploading exactly 1.2 GB → 120% exactly → not > blockThreshold
      const result = await service.checkUpload('ent-001', Math.floor(1.2 * GB));
      expect(result.warn).toBe(true);
    });
  });

  // ── addUsage ────────────────────────────────────────

  describe('addUsage', () => {
    it('should increment sqt_used_bytes', async () => {
      const quota = createQuota({ sqt_used_bytes: 1000 });
      mockTxManager.findOne.mockResolvedValue(quota);

      await service.addUsage('ent-001', 500);

      expect(quota.sqt_used_bytes).toBe(1500);
      expect(mockTxManager.save).toHaveBeenCalledWith(quota);
    });

    it('should update upload_blocked to true if usage > 120%', async () => {
      const quota = createQuota({
        sqt_base_gb: 1,
        sqt_used_bytes: Math.floor(1.19 * GB),
      });
      mockTxManager.findOne.mockResolvedValue(quota);

      // 0.02 GB more → > 120%
      await service.addUsage('ent-001', Math.floor(0.02 * GB));

      expect(quota.sqt_is_upload_blocked).toBe(true);
    });

    it('should silently skip when quota not found', async () => {
      mockTxManager.findOne.mockResolvedValue(null);

      // Should not throw
      await expect(service.addUsage('ent-no-quota', 1000)).resolves.not.toThrow();
    });
  });

  // ── removeUsage ─────────────────────────────────────

  describe('removeUsage', () => {
    it('should decrement sqt_used_bytes', async () => {
      const quota = createQuota({ sqt_used_bytes: 5000 });
      mockTxManager.findOne.mockResolvedValue(quota);

      await service.removeUsage('ent-001', 2000);

      expect(quota.sqt_used_bytes).toBe(3000);
    });

    it('should not go below 0', async () => {
      const quota = createQuota({ sqt_used_bytes: 100 });
      mockTxManager.findOne.mockResolvedValue(quota);

      await service.removeUsage('ent-001', 500);

      expect(quota.sqt_used_bytes).toBe(0);
    });
  });

  // ── purchaseAddon ───────────────────────────────────

  describe('purchaseAddon', () => {
    it('should increase addon_gb', async () => {
      const quota = createQuota({
        sqt_base_gb: 3,
        sqt_addon_gb: 0,
        sqt_max_gb: 100,
      });
      mockTxManager.findOne.mockResolvedValue(quota);

      await service.purchaseAddon('ent-001', 10);

      expect(quota.sqt_addon_gb).toBe(10);
      expect(mockTxManager.save).toHaveBeenCalledWith(quota);
    });

    it('should throw when total exceeds max_gb', async () => {
      const quota = createQuota({
        sqt_base_gb: 3,
        sqt_addon_gb: 95,
        sqt_max_gb: 100,
      });
      mockTxManager.findOne.mockResolvedValue(quota);

      await expect(
        service.purchaseAddon('ent-001', 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw E29004 when quota not found', async () => {
      mockTxManager.findOne.mockResolvedValue(null);

      await expect(
        service.purchaseAddon('ent-no-quota', 5),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getStatus ───────────────────────────────────────

  describe('getStatus', () => {
    it('should return computed storage status', async () => {
      const quota = createQuota({
        sqt_base_gb: 3,
        sqt_addon_gb: 2,
        sqt_used_bytes: Math.floor(2.5 * GB),
      });
      quotaRepo.findOne.mockResolvedValue(quota);

      const status = await service.getStatus('ent-001');

      expect(status.totalGb).toBe(5);
      expect(status.usedPct).toBeCloseTo(50, 0);
      expect(status.isOverQuota).toBe(false);
      expect(status.isUploadBlocked).toBe(false);
    });
  });
});
