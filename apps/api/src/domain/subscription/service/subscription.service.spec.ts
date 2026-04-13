/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { SubscriptionService } from './subscription.service';
import { TokenWalletService } from './token-wallet.service';
import { StorageQuotaService } from './storage-quota.service';
import { PolarService } from './polar.service';
import { SubPlanEntity } from '../entity/sub-plan.entity';
import { SubSubscriptionEntity } from '../entity/sub-subscription.entity';
import { SubStorageQuotaEntity } from '../entity/sub-storage-quota.entity';
import {
  BillingCycle,
  PlanTier,
  SubscriptionStatus,
} from '../entity/subscription.enums';
import { createMockRepository } from '../../../test/mock.helper';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let planRepo: ReturnType<typeof createMockRepository>;
  let subscriptionRepo: ReturnType<typeof createMockRepository>;
  let storageRepo: ReturnType<typeof createMockRepository>;
  let tokenWalletService: { grantOnetime: jest.Mock };
  let storageQuotaService: { purchaseAddon: jest.Mock };
  let polarService: { createCheckout: jest.Mock };
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };

  const mockFreePlan: Partial<SubPlanEntity> = {
    pln_id: 'plan-free-uuid',
    pln_code: PlanTier.FREE,
    pln_tier: PlanTier.FREE,
    pln_is_active: true,
    pln_token_onetime: 50000,
    pln_storage_base_gb: 1,
    pln_storage_max_gb: 1,
    pln_free_user_count: 5,
    pln_min_users: 1,
    pln_max_users: 5,
  };

  const mockBasicPlan: Partial<SubPlanEntity> = {
    pln_id: 'plan-basic-uuid',
    pln_code: PlanTier.BASIC,
    pln_tier: PlanTier.BASIC,
    pln_is_active: true,
    pln_token_onetime: 0,
    pln_token_per_user_monthly: 20000,
    pln_storage_base_gb: 3,
    pln_storage_max_gb: 100,
    pln_free_user_count: 5,
    pln_min_users: 6,
    pln_max_users: 49,
    pln_token_addon_unit: 10000,
    pln_storage_addon_unit_gb: 5,
  };

  const mockSubscription: Partial<SubSubscriptionEntity> = {
    sbn_id: 'sub-uuid',
    ent_id: 'ent-001',
    pln_id: 'plan-basic-uuid',
    sbn_status: SubscriptionStatus.ACTIVE,
    sbn_billing_cycle: BillingCycle.MONTHLY,
    sbn_user_count: 10,
    sbn_paid_user_count: 5,
    plan: mockBasicPlan as SubPlanEntity,
  };

  const mockTxManager = {
    save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
    create: jest.fn().mockImplementation((_cls: any, data: any) => ({
      sbn_id: 'new-sub-uuid',
      ...data,
    })),
    findOne: jest.fn(),
  };

  const mockDataSource = {
    manager: mockTxManager,
    transaction: jest.fn().mockImplementation((cb: any) => cb(mockTxManager)),
  };

  beforeEach(async () => {
    planRepo = createMockRepository();
    subscriptionRepo = createMockRepository();
    storageRepo = createMockRepository();
    tokenWalletService = { grantOnetime: jest.fn().mockResolvedValue(undefined) };
    storageQuotaService = { purchaseAddon: jest.fn().mockResolvedValue(undefined) };
    polarService = {
      createCheckout: jest.fn().mockResolvedValue({ checkoutUrl: 'https://polar.sh/checkout/test' }),
    };
    configService = {
      get: jest.fn().mockReturnValue('product-id-xxx'),
      getOrThrow: jest.fn().mockReturnValue('product-id-xxx'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: getRepositoryToken(SubPlanEntity), useValue: planRepo },
        { provide: getRepositoryToken(SubSubscriptionEntity), useValue: subscriptionRepo },
        { provide: getRepositoryToken(SubStorageQuotaEntity), useValue: storageRepo },
        { provide: TokenWalletService, useValue: tokenWalletService },
        { provide: StorageQuotaService, useValue: storageQuotaService },
        { provide: PolarService, useValue: polarService },
        { provide: ConfigService, useValue: configService },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get(SubscriptionService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getSubscription ─────────────────────────────────

  describe('getSubscription', () => {
    it('should return subscription with plan relation', async () => {
      subscriptionRepo.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getSubscription('ent-001');

      expect(result).toEqual(mockSubscription);
      expect(subscriptionRepo.findOne).toHaveBeenCalledWith({
        where: { ent_id: 'ent-001' },
        relations: ['plan'],
      });
    });

    it('should return null when no subscription exists', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      const result = await service.getSubscription('ent-no-sub');
      expect(result).toBeNull();
    });
  });

  // ── createFreeSubscription ──────────────────────────

  describe('createFreeSubscription', () => {
    it('should create FREE subscription with token wallet and storage', async () => {
      planRepo.findOne.mockResolvedValue(mockFreePlan);

      const result = await service.createFreeSubscription('ent-new');

      expect(result.sbn_id).toBeDefined();
      expect(mockTxManager.save).toHaveBeenCalled();
      expect(tokenWalletService.grantOnetime).toHaveBeenCalledWith(
        'ent-new',
        expect.any(String),
        50000,
        mockTxManager,
      );
    });

    it('should throw E29003 when FREE plan not found', async () => {
      planRepo.findOne.mockResolvedValue(null);

      await expect(service.createFreeSubscription('ent-x'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── createUpgradeCheckout ───────────────────────────

  describe('createUpgradeCheckout', () => {
    const baseParams = {
      entId: 'ent-001',
      planCode: 'BASIC',
      userCount: 10,
      billingCycle: BillingCycle.MONTHLY,
      userEmail: 'test@example.com',
      successUrl: 'https://example.com/success',
    };

    it('should create checkout URL for upgrade (existing subscription)', async () => {
      planRepo.findOne.mockResolvedValue(mockBasicPlan);
      subscriptionRepo.findOne.mockResolvedValue(mockSubscription);
      subscriptionRepo.save.mockResolvedValue(mockSubscription);

      const result = await service.createUpgradeCheckout(baseParams);

      expect(result.checkoutUrl).toBe('https://polar.sh/checkout/test');
      expect(polarService.createCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'product-id-xxx',
          entId: 'ent-001',
        }),
      );
    });

    it('should create new TRIALING subscription if none exists', async () => {
      planRepo.findOne.mockResolvedValue(mockBasicPlan);
      subscriptionRepo.findOne.mockResolvedValue(null);

      await service.createUpgradeCheckout(baseParams);

      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('should throw when plan not found', async () => {
      planRepo.findOne.mockResolvedValue(null);

      await expect(service.createUpgradeCheckout(baseParams))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw when user_count < min_users', async () => {
      planRepo.findOne.mockResolvedValue(mockBasicPlan);

      await expect(
        service.createUpgradeCheckout({ ...baseParams, userCount: 3 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when user_count > max_users', async () => {
      planRepo.findOne.mockResolvedValue(mockBasicPlan);

      await expect(
        service.createUpgradeCheckout({ ...baseParams, userCount: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use ANNUAL product when billing_cycle is ANNUAL', async () => {
      planRepo.findOne.mockResolvedValue(mockBasicPlan);
      subscriptionRepo.findOne.mockResolvedValue(mockSubscription);
      subscriptionRepo.save.mockResolvedValue(mockSubscription);
      configService.get.mockImplementation((key: string) => {
        if (key === 'POLAR_PRODUCT_BASIC_ANNUAL') return 'annual-product-id';
        return 'monthly-product-id';
      });

      await service.createUpgradeCheckout({
        ...baseParams,
        billingCycle: BillingCycle.ANNUAL,
      });

      expect(polarService.createCheckout).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'annual-product-id' }),
      );
    });

    it('should throw E29006 when Polar product ID not configured', async () => {
      planRepo.findOne.mockResolvedValue(mockBasicPlan);
      subscriptionRepo.findOne.mockResolvedValue(mockSubscription);
      subscriptionRepo.save.mockResolvedValue(mockSubscription);
      configService.get.mockReturnValue(undefined);

      await expect(service.createUpgradeCheckout(baseParams))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ── createTokenPurchaseCheckout ─────────────────────

  describe('createTokenPurchaseCheckout', () => {
    const baseParams = {
      entId: 'ent-001',
      tokenAmount: 20000,
      userEmail: 'test@example.com',
      successUrl: 'https://example.com/success',
    };

    it('should create token purchase checkout', async () => {
      subscriptionRepo.findOne.mockResolvedValue(mockSubscription);

      const result = await service.createTokenPurchaseCheckout(baseParams);

      expect(result.checkoutUrl).toBe('https://polar.sh/checkout/test');
      expect(polarService.createCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            order_type: 'token_addon',
            token_amount: '20000',
          }),
        }),
      );
    });

    it('should throw when no subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      await expect(service.createTokenPurchaseCheckout(baseParams))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw when token amount not multiple of addon unit', async () => {
      subscriptionRepo.findOne.mockResolvedValue(mockSubscription);

      await expect(
        service.createTokenPurchaseCheckout({ ...baseParams, tokenAmount: 15000 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── createStoragePurchaseCheckout ────────────────────

  describe('createStoragePurchaseCheckout', () => {
    const baseParams = {
      entId: 'ent-001',
      storageGb: 5,
      userEmail: 'test@example.com',
      successUrl: 'https://example.com/success',
    };

    it('should create storage purchase checkout', async () => {
      subscriptionRepo.findOne.mockResolvedValue(mockSubscription);

      const result = await service.createStoragePurchaseCheckout(baseParams);

      expect(result.checkoutUrl).toBe('https://polar.sh/checkout/test');
    });

    it('should throw when no subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      await expect(service.createStoragePurchaseCheckout(baseParams))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw when storage_gb not multiple of addon unit', async () => {
      subscriptionRepo.findOne.mockResolvedValue(mockSubscription);

      await expect(
        service.createStoragePurchaseCheckout({ ...baseParams, storageGb: 3 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when storage addon not available (unit=0)', async () => {
      subscriptionRepo.findOne.mockResolvedValue({
        ...mockSubscription,
        plan: { ...mockBasicPlan, pln_storage_addon_unit_gb: 0 },
      });

      await expect(service.createStoragePurchaseCheckout(baseParams))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ── cancelSubscription ──────────────────────────────

  describe('cancelSubscription', () => {
    it('should set cancel scheduled flag', async () => {
      subscriptionRepo.findOne.mockResolvedValue({ ...mockSubscription });
      subscriptionRepo.save.mockImplementation((ent: any) => Promise.resolve(ent));

      await service.cancelSubscription('ent-001');

      expect(subscriptionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ sbn_is_cancel_scheduled: true }),
      );
    });

    it('should throw when no subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelSubscription('ent-no-sub'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── addStorageAddon ─────────────────────────────────

  describe('addStorageAddon', () => {
    it('should delegate to storageQuotaService.purchaseAddon', async () => {
      await service.addStorageAddon('ent-001', 10);
      expect(storageQuotaService.purchaseAddon).toHaveBeenCalledWith('ent-001', 10);
    });
  });
});
