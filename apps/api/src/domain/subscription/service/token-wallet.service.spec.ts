/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import { TokenWalletService } from './token-wallet.service';
import { SubTokenWalletEntity } from '../entity/sub-token-wallet.entity';
import { SubTokenLedgerEntity } from '../entity/sub-token-ledger.entity';
import { SubSubscriptionEntity } from '../entity/sub-subscription.entity';
import {
  LedgerDirection,
  LedgerReason,
  SubscriptionStatus,
  TokenType,
} from '../entity/subscription.enums';
import { createMockRepository } from '../../../test/mock.helper';

describe('TokenWalletService', () => {
  let service: TokenWalletService;
  let walletRepo: ReturnType<typeof createMockRepository>;
  let ledgerRepo: ReturnType<typeof createMockRepository>;
  let subscriptionRepo: ReturnType<typeof createMockRepository>;

  const mockTxManager = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((entity: any) => Promise.resolve(entity)),
    create: jest.fn().mockImplementation((_cls: any, data: any) => ({ ...data })),
    transaction: jest.fn(),
  };

  const mockDataSource = {
    manager: {
      ...mockTxManager,
      transaction: jest.fn().mockImplementation((cb: any) => cb(mockTxManager)),
    },
  };

  const createWallet = (
    type: TokenType,
    balance: number,
    overrides?: Partial<SubTokenWalletEntity>,
  ): Partial<SubTokenWalletEntity> => ({
    tkw_id: `wallet-${type}`,
    ent_id: 'ent-001',
    sbn_id: 'sub-uuid',
    tkw_token_type: type,
    tkw_balance: balance,
    tkw_lifetime_granted: balance,
    tkw_lifetime_consumed: 0,
    ...overrides,
  });

  beforeEach(async () => {
    walletRepo = createMockRepository();
    ledgerRepo = createMockRepository();
    subscriptionRepo = createMockRepository();

    mockTxManager.findOne.mockReset();
    mockTxManager.save.mockReset().mockImplementation((entity: any) => Promise.resolve(entity));
    mockTxManager.create.mockReset().mockImplementation((_cls: any, data: any) => ({ ...data }));
    mockDataSource.manager.transaction.mockReset().mockImplementation((cb: any) => cb(mockTxManager));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenWalletService,
        { provide: getRepositoryToken(SubTokenWalletEntity), useValue: walletRepo },
        { provide: getRepositoryToken(SubTokenLedgerEntity), useValue: ledgerRepo },
        { provide: getRepositoryToken(SubSubscriptionEntity), useValue: subscriptionRepo },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get(TokenWalletService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── getTotalBalance ─────────────────────────────────

  describe('getTotalBalance', () => {
    it('should sum all wallet balances for the entity', async () => {
      walletRepo.find.mockResolvedValue([
        createWallet(TokenType.BASE, 30000),
        createWallet(TokenType.ADDON, 10000),
        createWallet(TokenType.REFERRAL, 5000),
      ]);

      const balance = await service.getTotalBalance('ent-001');
      expect(balance).toBe(45000);
    });

    it('should return 0 when no wallets exist', async () => {
      walletRepo.find.mockResolvedValue([]);

      const balance = await service.getTotalBalance('ent-001');
      expect(balance).toBe(0);
    });
  });

  // ── grantOnetime ────────────────────────────────────

  describe('grantOnetime', () => {
    it('should create BASE wallet and credit tokens', async () => {
      mockTxManager.findOne.mockResolvedValue(null); // no existing wallet

      await service.grantOnetime('ent-001', 'sub-uuid', 50000);

      expect(mockTxManager.save).toHaveBeenCalled();
      // Verify ledger entry was created with CREDIT direction
      const ledgerArg = mockTxManager.create.mock.calls.find(
        (c: any[]) => c[0] === SubTokenLedgerEntity,
      );
      expect(ledgerArg).toBeDefined();
      expect(ledgerArg[1]).toMatchObject({
        tkl_direction: LedgerDirection.CREDIT,
        tkl_reason: LedgerReason.ONETIME_GRANT,
        tkl_amount: 50000,
      });
    });

    it('should add to existing wallet balance', async () => {
      const existingWallet = createWallet(TokenType.BASE, 10000);
      mockTxManager.findOne.mockResolvedValue(existingWallet);

      await service.grantOnetime('ent-001', 'sub-uuid', 50000);

      expect(existingWallet.tkw_balance).toBe(60000);
      expect(existingWallet.tkw_lifetime_granted).toBe(60000);
    });
  });

  // ── purchaseAddon ───────────────────────────────────

  describe('purchaseAddon', () => {
    it('should credit ADDON wallet', async () => {
      mockTxManager.findOne.mockResolvedValue(null);

      await service.purchaseAddon('ent-001', 'sub-uuid', 20000, 'order-123');

      const ledgerArg = mockTxManager.create.mock.calls.find(
        (c: any[]) => c[0] === SubTokenLedgerEntity,
      );
      expect(ledgerArg[1]).toMatchObject({
        tkl_token_type: TokenType.ADDON,
        tkl_reason: LedgerReason.ADDON_PURCHASE,
        tkl_ref_id: 'order-123',
      });
    });
  });

  // ── deductAiUsage ───────────────────────────────────

  describe('deductAiUsage', () => {
    it('should debit from BASE first, then ADDON, then REFERRAL', async () => {
      const baseWallet = createWallet(TokenType.BASE, 5000);
      const addonWallet = createWallet(TokenType.ADDON, 3000);
      const referralWallet = createWallet(TokenType.REFERRAL, 2000);

      mockTxManager.findOne
        .mockResolvedValueOnce(baseWallet)     // BASE
        .mockResolvedValueOnce(addonWallet)    // ADDON
        .mockResolvedValueOnce(referralWallet); // REFERRAL

      await service.deductAiUsage('ent-001', 'sub-uuid', 7000);

      // BASE: 5000 → 0 (deducted 5000)
      expect(baseWallet.tkw_balance).toBe(0);
      expect(baseWallet.tkw_lifetime_consumed).toBe(5000);

      // ADDON: 3000 → 1000 (deducted 2000)
      expect(addonWallet.tkw_balance).toBe(1000);
      expect(addonWallet.tkw_lifetime_consumed).toBe(2000);

      // REFERRAL: not touched
      expect(referralWallet.tkw_balance).toBe(2000);
    });

    it('should throw E29001 when total balance is insufficient', async () => {
      const baseWallet = createWallet(TokenType.BASE, 100);
      const addonWallet = createWallet(TokenType.ADDON, 0);
      const referralWallet = createWallet(TokenType.REFERRAL, 0);

      mockTxManager.findOne
        .mockResolvedValueOnce(baseWallet)
        .mockResolvedValueOnce(addonWallet)
        .mockResolvedValueOnce(referralWallet);

      await expect(
        service.deductAiUsage('ent-001', 'sub-uuid', 500),
      ).rejects.toThrow(BadRequestException);
    });

    it('should deduct only from BASE when balance is sufficient', async () => {
      const baseWallet = createWallet(TokenType.BASE, 10000);

      mockTxManager.findOne.mockResolvedValueOnce(baseWallet);

      await service.deductAiUsage('ent-001', 'sub-uuid', 3000);

      expect(baseWallet.tkw_balance).toBe(7000);
      expect(mockTxManager.findOne).toHaveBeenCalledTimes(1); // only BASE checked
    });

    it('should create ledger entries for each wallet deducted', async () => {
      const baseWallet = createWallet(TokenType.BASE, 100);
      const addonWallet = createWallet(TokenType.ADDON, 200);

      mockTxManager.findOne
        .mockResolvedValueOnce(baseWallet)
        .mockResolvedValueOnce(addonWallet);

      await service.deductAiUsage('ent-001', 'sub-uuid', 250);

      // 2 wallets & 2 ledger entries saved
      const ledgerCalls = mockTxManager.create.mock.calls.filter(
        (c: any[]) => c[0] === SubTokenLedgerEntity,
      );
      expect(ledgerCalls).toHaveLength(2);
      expect(ledgerCalls[0][1].tkl_amount).toBe(100); // BASE deducted
      expect(ledgerCalls[1][1].tkl_amount).toBe(150); // ADDON deducted
    });
  });

  // ── handleAiUsageRecorded ───────────────────────────

  describe('handleAiUsageRecorded', () => {
    it('should deduct tokens when active subscription exists', async () => {
      const mockSub = {
        sbn_id: 'sub-uuid',
        ent_id: 'ent-001',
        sbn_status: SubscriptionStatus.ACTIVE,
      };
      subscriptionRepo.findOne.mockResolvedValue(mockSub);

      const baseWallet = createWallet(TokenType.BASE, 50000);
      mockTxManager.findOne.mockResolvedValueOnce(baseWallet);

      await service.handleAiUsageRecorded({
        entId: 'ent-001',
        totalTokens: 1000,
        sourceType: 'chat',
        model: 'claude-3.5-sonnet',
      });

      expect(baseWallet.tkw_balance).toBe(49000);
    });

    it('should silently skip when no active subscription', async () => {
      subscriptionRepo.findOne.mockResolvedValue(null);

      // Should not throw
      await service.handleAiUsageRecorded({
        entId: 'ent-no-sub',
        totalTokens: 1000,
        sourceType: 'chat',
        model: 'claude-3.5-sonnet',
      });

      expect(mockDataSource.manager.transaction).not.toHaveBeenCalled();
    });

    it('should catch and log errors without re-throwing', async () => {
      subscriptionRepo.findOne.mockResolvedValue({
        sbn_id: 'sub-uuid',
        ent_id: 'ent-001',
        sbn_status: SubscriptionStatus.ACTIVE,
      });
      // All wallets have 0 balance → will throw E29001 internally
      mockTxManager.findOne
        .mockResolvedValueOnce(createWallet(TokenType.BASE, 0))
        .mockResolvedValueOnce(createWallet(TokenType.ADDON, 0))
        .mockResolvedValueOnce(createWallet(TokenType.REFERRAL, 0));

      // Should NOT throw — event handler catches errors
      await expect(
        service.handleAiUsageRecorded({
          entId: 'ent-001',
          totalTokens: 500,
          sourceType: 'chat',
          model: 'claude-3.5-sonnet',
        }),
      ).resolves.not.toThrow();
    });
  });
});
