import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';

import { SubTokenWalletEntity } from '../entity/sub-token-wallet.entity';
import { SubTokenLedgerEntity } from '../entity/sub-token-ledger.entity';
import { SubSubscriptionEntity } from '../entity/sub-subscription.entity';
import {
  LedgerDirection,
  LedgerReason,
  SubscriptionStatus,
  TokenType,
} from '../entity/subscription.enums';

const DEBIT_ORDER: TokenType[] = [
  TokenType.BASE,
  TokenType.ADDON,
  TokenType.REFERRAL,
];

@Injectable()
export class TokenWalletService {
  private readonly logger = new Logger(TokenWalletService.name);

  constructor(
    @InjectRepository(SubTokenWalletEntity)
    private readonly walletRepo: Repository<SubTokenWalletEntity>,
    @InjectRepository(SubTokenLedgerEntity)
    private readonly ledgerRepo: Repository<SubTokenLedgerEntity>,
    @InjectRepository(SubSubscriptionEntity)
    private readonly subscriptionRepo: Repository<SubSubscriptionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ── 잔액 조회 ─────────────────────────────────────────

  async getTotalBalance(entId: string): Promise<number> {
    const wallets = await this.walletRepo.find({ where: { ent_id: entId } });
    return wallets.reduce((sum, w) => sum + w.tkw_balance, 0);
  }

  async getWallets(entId: string): Promise<SubTokenWalletEntity[]> {
    return this.walletRepo.find({ where: { ent_id: entId } });
  }

  // ── 토큰 지급 (CREDIT) ────────────────────────────────

  async grantOnetime(
    entId: string,
    sbnId: string,
    amount: number,
    manager?: EntityManager,
  ): Promise<void> {
    await this._credit({
      entId,
      sbnId,
      tokenType: TokenType.BASE,
      amount,
      reason: LedgerReason.ONETIME_GRANT,
      manager,
    });
  }

  async grantMonthly(
    entId: string,
    sbnId: string,
    paidUserCount: number,
    tokensPerUser: number,
    manager?: EntityManager,
  ): Promise<void> {
    const amount = paidUserCount * tokensPerUser;
    await this._credit({
      entId,
      sbnId,
      tokenType: TokenType.BASE,
      amount,
      reason: LedgerReason.MONTHLY_GRANT,
      manager,
    });
  }

  async purchaseAddon(
    entId: string,
    sbnId: string,
    amount: number,
    refId?: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this._credit({
      entId,
      sbnId,
      tokenType: TokenType.ADDON,
      amount,
      reason: LedgerReason.ADDON_PURCHASE,
      refId,
      manager,
    });
  }

  async grantReferral(
    entId: string,
    sbnId: string,
    amount: number,
    refId?: string,
    manager?: EntityManager,
  ): Promise<void> {
    await this._credit({
      entId,
      sbnId,
      tokenType: TokenType.REFERRAL,
      amount,
      reason: LedgerReason.REFERRAL_REWARD,
      refId,
      manager,
    });
  }

  // ── 토큰 차감 (DEBIT) — AI 사용 ──────────────────────

  async deductAiUsage(
    entId: string,
    sbnId: string,
    totalTokensUsed: number,
    refId?: string,
    manager?: EntityManager,
  ): Promise<void> {
    const em = manager ?? this.dataSource.manager;

    await em.transaction(async (tx) => {
      let remaining = totalTokensUsed;

      for (const tokenType of DEBIT_ORDER) {
        if (remaining <= 0) break;

        const wallet = await tx.findOne(SubTokenWalletEntity, {
          where: { ent_id: entId, tkw_token_type: tokenType },
          lock: { mode: 'pessimistic_write' },
        });

        if (!wallet || wallet.tkw_balance <= 0) continue;

        const deductAmount = Math.min(wallet.tkw_balance, remaining);
        wallet.tkw_balance -= deductAmount;
        wallet.tkw_lifetime_consumed += deductAmount;
        await tx.save(wallet);

        await tx.save(
          tx.create(SubTokenLedgerEntity, {
            ent_id: entId,
            tkw_id: wallet.tkw_id,
            tkl_token_type: tokenType,
            tkl_direction: LedgerDirection.DEBIT,
            tkl_amount: deductAmount,
            tkl_balance_after: wallet.tkw_balance,
            tkl_reason: LedgerReason.AI_USAGE,
            tkl_ref_id: refId ?? null,
            tkl_meta: { totalRequested: totalTokensUsed },
          }),
        );

        remaining -= deductAmount;
      }

      if (remaining > 0) {
        throw new BadRequestException({
          code: 'E29001',
          message: 'Insufficient token balance. Service suspended.',
        });
      }
    });
  }

  // ── 월 리셋 Cron (매월 1일 00:00 KST) ────────────────

  @Cron('0 0 1 * *', { timeZone: 'Asia/Seoul' })
  async resetMonthlyBaseTokens(): Promise<void> {
    this.logger.log('[Cron] 월 기본 토큰 리셋 시작');

    const activeBasicSubs = await this.subscriptionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.plan', 'p')
      .where('s.sbn_status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('p.pln_is_token_monthly_reset = TRUE')
      .andWhere('s.sbn_deleted_at IS NULL')
      .getMany();

    for (const sub of activeBasicSubs) {
      try {
        await this.dataSource.transaction(async (tx) => {
          const wallet = await tx.findOne(SubTokenWalletEntity, {
            where: { ent_id: sub.ent_id, tkw_token_type: TokenType.BASE },
            lock: { mode: 'pessimistic_write' },
          });
          if (!wallet) return;

          const oldBalance = wallet.tkw_balance;
          const newBalance =
            sub.sbn_paid_user_count * sub.plan.pln_token_per_user_monthly;

          if (oldBalance > 0) {
            await tx.save(
              tx.create(SubTokenLedgerEntity, {
                ent_id: sub.ent_id,
                tkw_id: wallet.tkw_id,
                tkl_token_type: TokenType.BASE,
                tkl_direction: LedgerDirection.DEBIT,
                tkl_amount: oldBalance,
                tkl_balance_after: 0,
                tkl_reason: LedgerReason.RESET,
                tkl_meta: { expiredBalance: oldBalance },
              }),
            );
          }

          wallet.tkw_balance = newBalance;
          wallet.tkw_lifetime_granted += newBalance;
          wallet.tkw_last_reset_at = new Date();
          wallet.tkw_next_reset_at = this._nextMonthFirst();
          await tx.save(wallet);

          await tx.save(
            tx.create(SubTokenLedgerEntity, {
              ent_id: sub.ent_id,
              tkw_id: wallet.tkw_id,
              tkl_token_type: TokenType.BASE,
              tkl_direction: LedgerDirection.CREDIT,
              tkl_amount: newBalance,
              tkl_balance_after: newBalance,
              tkl_reason: LedgerReason.MONTHLY_GRANT,
              tkl_meta: {
                paidUsers: sub.sbn_paid_user_count,
                tokensPerUser: sub.plan.pln_token_per_user_monthly,
              },
            }),
          );
        });
      } catch (err) {
        this.logger.error(
          `[Cron] 월 리셋 실패 ent_id=${sub.ent_id}`,
          (err as Error).stack,
        );
      }
    }

    this.logger.log(
      `[Cron] 월 기본 토큰 리셋 완료 — ${activeBasicSubs.length}개 테넌트`,
    );
  }

  // ── AI 사용량 이벤트 리스너 ────────────────────────────

  @OnEvent('ai-usage.recorded', { async: true })
  async handleAiUsageRecorded(payload: {
    entId: string;
    totalTokens: number;
    sourceType: string;
    model: string;
  }): Promise<void> {
    try {
      const sub = await this.subscriptionRepo.findOne({
        where: {
          ent_id: payload.entId,
          sbn_status: SubscriptionStatus.ACTIVE,
          sbn_deleted_at: null as any,
        },
      });

      if (!sub) return; // 구독 없으면 무시 (기존 쿼터 시스템만 적용)

      await this.deductAiUsage(
        payload.entId,
        sub.sbn_id,
        payload.totalTokens,
        `ai:${payload.sourceType}:${payload.model}`,
      );
    } catch (err) {
      this.logger.warn(
        `[Event] 토큰 차감 실패 ent_id=${payload.entId}: ${(err as Error).message}`,
      );
    }
  }

  // ── Private ────────────────────────────────────────────

  private async _credit(params: {
    entId: string;
    sbnId: string;
    tokenType: TokenType;
    amount: number;
    reason: LedgerReason;
    refId?: string;
    manager?: EntityManager;
  }): Promise<void> {
    const { entId, sbnId, tokenType, amount, reason, refId, manager } = params;
    const em = manager ?? this.dataSource.manager;

    await em.transaction(async (tx) => {
      let wallet = await tx.findOne(SubTokenWalletEntity, {
        where: { ent_id: entId, tkw_token_type: tokenType },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        wallet = tx.create(SubTokenWalletEntity, {
          ent_id: entId,
          sbn_id: sbnId,
          tkw_token_type: tokenType,
          tkw_balance: 0,
          tkw_lifetime_granted: 0,
          tkw_lifetime_consumed: 0,
        });
      }

      wallet.tkw_balance += amount;
      wallet.tkw_lifetime_granted += amount;
      await tx.save(wallet);

      await tx.save(
        tx.create(SubTokenLedgerEntity, {
          ent_id: entId,
          tkw_id: wallet.tkw_id,
          tkl_token_type: tokenType,
          tkl_direction: LedgerDirection.CREDIT,
          tkl_amount: amount,
          tkl_balance_after: wallet.tkw_balance,
          tkl_reason: reason,
          tkl_ref_id: refId ?? null,
        }),
      );
    });
  }

  private _nextMonthFirst(): Date {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
  }
}
