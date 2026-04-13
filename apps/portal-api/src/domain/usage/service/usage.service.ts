import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import Stripe from 'stripe';
import { SvcUsageRecordEntity } from '../../../shared-entities/usage-record.entity';
import { SvcSubscriptionEntity } from '../../../shared-entities/subscription.entity';
import { SvcPlanEntity } from '../../../shared-entities/service-plan.entity';
import { PortalCustomerEntity } from '../../auth/entity/portal-customer.entity';

interface RecordUsageDto {
  subscriptionId: string;
  metric: string;
  quantity: number;
  periodStart?: Date;
  periodEnd?: Date;
  metadata?: Record<string, unknown>;
}

export interface UsageSummary {
  metric: string;
  totalQuantity: number;
  totalAmount: number;
  currency: string;
  records: {
    periodStart: Date;
    periodEnd: Date;
    quantity: number;
    amount: number | null;
  }[];
}

@Injectable()
export class UsageService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SvcUsageRecordEntity)
    private readonly usageRepo: Repository<SvcUsageRecordEntity>,
    @InjectRepository(SvcSubscriptionEntity)
    private readonly subscriptionRepo: Repository<SvcSubscriptionEntity>,
    @InjectRepository(SvcPlanEntity)
    private readonly planRepo: Repository<SvcPlanEntity>,
    @InjectRepository(PortalCustomerEntity)
    private readonly customerRepo: Repository<PortalCustomerEntity>,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
      });
    } else {
      this.stripe = null;
      this.logger.warn('STRIPE_SECRET_KEY not configured — Stripe usage reporting disabled');
    }
  }

  /**
   * Record usage for a subscription (called by internal services or API)
   */
  async recordUsage(dto: RecordUsageDto): Promise<SvcUsageRecordEntity> {
    const sub = await this.subscriptionRepo.findOne({ where: { subId: dto.subscriptionId } });
    if (!sub) throw new BadRequestException('Subscription not found');

    // Get plan for pricing
    const plan = sub.splId
      ? await this.planRepo.findOne({ where: { splId: sub.splId } })
      : null;

    const now = new Date();
    const periodStart = dto.periodStart || new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = dto.periodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const record = new SvcUsageRecordEntity();
    record.subId = sub.subId;
    record.cliId = sub.cliId;
    record.svcId = sub.svcId;
    record.usrMetric = dto.metric;
    record.usrQuantity = dto.quantity;
    record.usrCurrency = sub.subCurrency || 'USD';
    record.usrPeriodStart = periodStart;
    record.usrPeriodEnd = periodEnd;
    record.usrSource = 'API';
    record.usrMetadata = dto.metadata;

    // Calculate amount if overage pricing exists
    if (plan?.splOverageUnitPrice && plan?.splOverageMetric === dto.metric) {
      record.usrUnitPrice = Number(plan.splOverageUnitPrice);
      record.usrTotalAmount = Number(plan.splOverageUnitPrice) * dto.quantity;
    }

    const saved = await this.usageRepo.save(record);

    // Report to Stripe if subscription has Stripe ID
    if (sub.subStripeSubscriptionId && sub.subStripePriceId) {
      await this.reportToStripe(saved, sub);
    }

    return saved;
  }

  /**
   * Get usage summary for a customer's subscriptions
   */
  async getUsageSummary(
    customerId: string,
    subscriptionId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UsageSummary[]> {
    const customer = await this.customerRepo.findOne({ where: { pctId: customerId } });
    if (!customer?.pctCliId) return [];

    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const qb = this.usageRepo.createQueryBuilder('u')
      .where('u.cliId = :cliId', { cliId: customer.pctCliId })
      .andWhere('u.usrPeriodStart >= :start', { start })
      .andWhere('u.usrPeriodEnd <= :end', { end });

    if (subscriptionId) {
      qb.andWhere('u.subId = :subId', { subId: subscriptionId });
    }

    qb.orderBy('u.usrMetric', 'ASC').addOrderBy('u.usrPeriodStart', 'ASC');

    const records = await qb.getMany();

    // Group by metric
    const metricsMap = new Map<string, SvcUsageRecordEntity[]>();
    for (const r of records) {
      const group = metricsMap.get(r.usrMetric) || [];
      group.push(r);
      metricsMap.set(r.usrMetric, group);
    }

    const summaries: UsageSummary[] = [];
    for (const [metric, recs] of metricsMap) {
      summaries.push({
        metric,
        totalQuantity: recs.reduce((sum, r) => sum + Number(r.usrQuantity), 0),
        totalAmount: recs.reduce((sum, r) => sum + (r.usrTotalAmount ? Number(r.usrTotalAmount) : 0), 0),
        currency: recs[0]?.usrCurrency || 'USD',
        records: recs.map((r) => ({
          periodStart: r.usrPeriodStart,
          periodEnd: r.usrPeriodEnd,
          quantity: Number(r.usrQuantity),
          amount: r.usrTotalAmount ? Number(r.usrTotalAmount) : null,
        })),
      });
    }

    return summaries;
  }

  /**
   * Get usage for a specific subscription in current billing period
   */
  async getCurrentPeriodUsage(subscriptionId: string): Promise<{
    subscription: { id: string; status: string; plan: string };
    metrics: { metric: string; used: number; limit: number | null; unitPrice: number | null }[];
  }> {
    const sub = await this.subscriptionRepo.findOne({ where: { subId: subscriptionId } });
    if (!sub) throw new BadRequestException('Subscription not found');

    const plan = sub.splId
      ? await this.planRepo.findOne({ where: { splId: sub.splId } })
      : null;

    const periodStart = sub.subCurrentPeriodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const periodEnd = sub.subCurrentPeriodEnd || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const records = await this.usageRepo.find({
      where: {
        subId: subscriptionId,
        usrPeriodStart: Between(periodStart, periodEnd),
      },
    });

    // Aggregate by metric
    const metricTotals = new Map<string, number>();
    for (const r of records) {
      metricTotals.set(r.usrMetric, (metricTotals.get(r.usrMetric) || 0) + Number(r.usrQuantity));
    }

    const metrics = Array.from(metricTotals.entries()).map(([metric, used]) => ({
      metric,
      used,
      limit: null as number | null,
      unitPrice: plan?.splOverageMetric === metric && plan?.splOverageUnitPrice
        ? Number(plan.splOverageUnitPrice)
        : null,
    }));

    // Add user count metric
    if (sub.subMaxUsers) {
      const existingUserMetric = metrics.find((m) => m.metric === 'users');
      if (!existingUserMetric) {
        metrics.unshift({
          metric: 'users',
          used: sub.subActualUsers || 0,
          limit: sub.subMaxUsers,
          unitPrice: null,
        });
      } else {
        existingUserMetric.limit = sub.subMaxUsers;
      }
    }

    return {
      subscription: {
        id: sub.subId,
        status: sub.subStatus,
        plan: plan?.splName || '',
      },
      metrics,
    };
  }

  /**
   * Report usage to Stripe for metered billing
   */
  private async reportToStripe(
    record: SvcUsageRecordEntity,
    sub: SvcSubscriptionEntity,
  ): Promise<void> {
    try {
      if (!this.stripe || !sub.subStripeSubscriptionId) return;

      // Get subscription items from Stripe
      const stripeSub = await this.stripe.subscriptions.retrieve(sub.subStripeSubscriptionId);
      const subItem = stripeSub.items.data[0];
      if (!subItem) return;

      // Create usage record in Stripe (createUsageRecord removed from SDK types but still functional)
      const stripeRecord = await (this.stripe!.subscriptionItems as any).createUsageRecord(
        subItem.id,
        {
          quantity: Math.ceil(record.usrQuantity),
          timestamp: Math.floor(record.usrPeriodStart.getTime() / 1000),
          action: 'increment',
        },
      );

      // Update local record
      record.usrStripeUsageRecordId = stripeRecord.id;
      record.usrReportedToStripe = true;
      await this.usageRepo.save(record);

      this.logger.log(`Reported usage to Stripe: ${stripeRecord.id} for sub ${sub.subId}`);
    } catch (err) {
      this.logger.error(`Failed to report usage to Stripe: ${(err as Error).message}`);
    }
  }
}
