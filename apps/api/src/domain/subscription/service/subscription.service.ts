import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';

import { SubPlanEntity } from '../entity/sub-plan.entity';
import { SubSubscriptionEntity } from '../entity/sub-subscription.entity';
import { SubStorageQuotaEntity } from '../entity/sub-storage-quota.entity';
import {
  BillingCycle,
  PlanTier,
  SubscriptionStatus,
  TokenType,
} from '../entity/subscription.enums';
import { TokenWalletService } from './token-wallet.service';
import { StorageQuotaService } from './storage-quota.service';
import { PolarService } from './polar.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(SubPlanEntity)
    private readonly planRepo: Repository<SubPlanEntity>,
    @InjectRepository(SubSubscriptionEntity)
    private readonly subscriptionRepo: Repository<SubSubscriptionEntity>,
    @InjectRepository(SubStorageQuotaEntity)
    private readonly storageRepo: Repository<SubStorageQuotaEntity>,
    private readonly tokenWalletService: TokenWalletService,
    private readonly storageQuotaService: StorageQuotaService,
    private readonly polarService: PolarService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  // ── 플랜 목록 조회 ────────────────────────────────────

  async getPlans(): Promise<SubPlanEntity[]> {
    return this.planRepo.find({
      where: { pln_is_active: true },
      order: { pln_sort_order: 'ASC' },
    });
  }

  // ── 구독 조회 ─────────────────────────────────────────

  async getSubscription(entId: string): Promise<SubSubscriptionEntity | null> {
    return this.subscriptionRepo.findOne({
      where: { ent_id: entId },
      relations: ['plan'],
    });
  }

  // ── FREE 구독 자동 생성 ───────────────────────────────

  async createFreeSubscription(entId: string): Promise<SubSubscriptionEntity> {
    const freePlan = await this.planRepo.findOne({
      where: { pln_code: PlanTier.FREE, pln_is_active: true },
    });
    if (!freePlan) {
      throw new NotFoundException({
        code: 'E29003',
        message: 'Free plan not found.',
      });
    }

    return this.dataSource.transaction(async (tx) => {
      const subscription = await tx.save(
        tx.create(SubSubscriptionEntity, {
          ent_id: entId,
          pln_id: freePlan.pln_id,
          sbn_status: SubscriptionStatus.ACTIVE,
          sbn_billing_cycle: BillingCycle.MONTHLY,
          sbn_user_count: freePlan.pln_free_user_count,
          sbn_paid_user_count: 0,
        }),
      );

      // 스토리지 쿼터 초기화
      await tx.save(
        tx.create(SubStorageQuotaEntity, {
          ent_id: entId,
          sbn_id: subscription.sbn_id,
          sqt_base_gb: freePlan.pln_storage_base_gb,
          sqt_max_gb: freePlan.pln_storage_max_gb,
        }),
      );

      // BASE 토큰 1회 지급
      if (freePlan.pln_token_onetime > 0) {
        await this.tokenWalletService.grantOnetime(
          entId,
          subscription.sbn_id,
          freePlan.pln_token_onetime,
          tx,
        );
      }

      return subscription;
    });
  }

  // ── BASIC 업그레이드 Checkout ─────────────────────────

  async createUpgradeCheckout(params: {
    entId: string;
    planCode: string;
    userCount: number;
    billingCycle: BillingCycle;
    userEmail: string;
    successUrl: string;
  }): Promise<{ checkoutUrl: string }> {
    const plan = await this.planRepo.findOne({
      where: { pln_code: params.planCode, pln_is_active: true },
    });
    if (!plan) {
      throw new NotFoundException({
        code: 'E29003',
        message: `Plan ${params.planCode} not found.`,
      });
    }

    if (params.userCount < plan.pln_min_users) {
      throw new BadRequestException({
        code: 'E29005',
        message: `Minimum ${plan.pln_min_users} users required.`,
      });
    }
    if (params.userCount > plan.pln_max_users) {
      throw new BadRequestException({
        code: 'E29005',
        message: `Maximum ${plan.pln_max_users} users allowed.`,
      });
    }

    // 기존 구독이 없으면 TRIALING 상태로 생성
    let subscription = await this.subscriptionRepo.findOne({
      where: { ent_id: params.entId },
    });

    const paidUserCount = Math.max(
      0,
      params.userCount - plan.pln_free_user_count,
    );

    if (!subscription) {
      subscription = await this.dataSource.transaction(async (tx) => {
        const sub = await tx.save(
          tx.create(SubSubscriptionEntity, {
            ent_id: params.entId,
            pln_id: plan.pln_id,
            sbn_status: SubscriptionStatus.TRIALING,
            sbn_billing_cycle: params.billingCycle,
            sbn_user_count: params.userCount,
            sbn_paid_user_count: paidUserCount,
          }),
        );

        await tx.save(
          tx.create(SubStorageQuotaEntity, {
            ent_id: params.entId,
            sbn_id: sub.sbn_id,
            sqt_base_gb: plan.pln_storage_base_gb,
            sqt_max_gb: plan.pln_storage_max_gb,
          }),
        );

        return sub;
      });
    } else {
      subscription.pln_id = plan.pln_id;
      subscription.sbn_billing_cycle = params.billingCycle;
      subscription.sbn_user_count = params.userCount;
      subscription.sbn_paid_user_count = paidUserCount;
      await this.subscriptionRepo.save(subscription);
    }

    const productId =
      params.billingCycle === BillingCycle.ANNUAL
        ? this.config.get<string>('POLAR_PRODUCT_BASIC_ANNUAL')
        : this.config.get<string>('POLAR_PRODUCT_BASIC_MONTHLY');

    if (!productId) {
      throw new BadRequestException({
        code: 'E29006',
        message: 'Polar product ID not configured.',
      });
    }

    return this.polarService.createCheckout({
      productId,
      entId: params.entId,
      userEmail: params.userEmail,
      successUrl: params.successUrl,
      metadata: {
        plan_code: params.planCode,
        user_count: String(params.userCount),
        billing_cycle: params.billingCycle,
      },
    });
  }

  // ── 토큰 추가 충전 Checkout ───────────────────────────

  async createTokenPurchaseCheckout(params: {
    entId: string;
    tokenAmount: number;
    userEmail: string;
    successUrl: string;
  }): Promise<{ checkoutUrl: string }> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { ent_id: params.entId },
      relations: ['plan'],
    });
    if (!subscription) {
      throw new NotFoundException({
        code: 'E29003',
        message: 'No subscription found.',
      });
    }

    const addonUnit = subscription.plan?.pln_token_addon_unit ?? 10000;
    if (params.tokenAmount % addonUnit !== 0) {
      throw new BadRequestException({
        code: 'E29005',
        message: `Token amount must be a multiple of ${addonUnit}.`,
      });
    }

    const productId = this.config.get<string>('POLAR_PRODUCT_TOKEN_ADDON');
    if (!productId) {
      throw new BadRequestException({
        code: 'E29006',
        message: 'Polar token addon product ID not configured.',
      });
    }

    return this.polarService.createCheckout({
      productId,
      entId: params.entId,
      userEmail: params.userEmail,
      successUrl: params.successUrl,
      metadata: {
        order_type: 'token_addon',
        token_amount: String(params.tokenAmount),
      },
    });
  }

  // ── 스토리지 추가 구매 Checkout ───────────────────────

  async createStoragePurchaseCheckout(params: {
    entId: string;
    storageGb: number;
    userEmail: string;
    successUrl: string;
  }): Promise<{ checkoutUrl: string }> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { ent_id: params.entId },
      relations: ['plan'],
    });
    if (!subscription) {
      throw new NotFoundException({
        code: 'E29003',
        message: 'No subscription found.',
      });
    }

    const addonUnit = subscription.plan?.pln_storage_addon_unit_gb ?? 5;
    if (addonUnit === 0) {
      throw new BadRequestException({
        code: 'E29005',
        message: 'Storage addon not available for this plan.',
      });
    }
    if (params.storageGb % addonUnit !== 0) {
      throw new BadRequestException({
        code: 'E29005',
        message: `Storage must be a multiple of ${addonUnit}GB.`,
      });
    }

    const productId = this.config.get<string>('POLAR_PRODUCT_STORAGE_ADDON');
    if (!productId) {
      throw new BadRequestException({
        code: 'E29006',
        message: 'Polar storage addon product ID not configured.',
      });
    }

    return this.polarService.createCheckout({
      productId,
      entId: params.entId,
      userEmail: params.userEmail,
      successUrl: params.successUrl,
      metadata: {
        order_type: 'storage_addon',
        storage_gb: String(params.storageGb),
      },
    });
  }

  // ── 구독 해지 예약 ────────────────────────────────────

  async cancelSubscription(entId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { ent_id: entId },
    });
    if (!subscription) {
      throw new NotFoundException({
        code: 'E29003',
        message: 'No subscription found.',
      });
    }
    subscription.sbn_is_cancel_scheduled = true;
    await this.subscriptionRepo.save(subscription);
  }

  // ── 스토리지 추가 (webhook 후처리) ────────────────────

  async addStorageAddon(entId: string, addGb: number): Promise<void> {
    await this.storageQuotaService.purchaseAddon(entId, addGb);
  }
}
