import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { PortalCustomerEntity } from '../../auth/entity/portal-customer.entity';
import { SvcSubscriptionEntity } from '../../../shared-entities/subscription.entity';
import { SvcUsageRecordEntity } from '../../../shared-entities/usage-record.entity';
import { PortalPaymentEntity } from '../../payment-gateway/entity/portal-payment.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(PortalCustomerEntity)
    private readonly customerRepo: Repository<PortalCustomerEntity>,
    @InjectRepository(SvcSubscriptionEntity)
    private readonly subscriptionRepo: Repository<SvcSubscriptionEntity>,
    @InjectRepository(SvcUsageRecordEntity)
    private readonly usageRepo: Repository<SvcUsageRecordEntity>,
    @InjectRepository(PortalPaymentEntity)
    private readonly paymentRepo: Repository<PortalPaymentEntity>,
  ) {}

  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCustomers,
      newCustomers30d,
      activeSubscriptions,
      trialSubscriptions,
      totalPayments,
      completedPayments,
    ] = await Promise.all([
      this.customerRepo.count(),
      this.customerRepo.count({
        where: { pctCreatedAt: MoreThanOrEqual(thirtyDaysAgo) },
      }),
      this.subscriptionRepo.count({ where: { subStatus: 'ACTIVE' } }),
      this.subscriptionRepo.count({ where: { subStatus: 'TRIAL' } }),
      this.paymentRepo.count(),
      this.paymentRepo.count({ where: { ppmStatus: 'COMPLETED' } }),
    ]);

    // Revenue calculation
    const revenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('SUM(p.ppmAmount)', 'total')
      .addSelect('p.ppmCurrency', 'currency')
      .where('p.ppmStatus = :status', { status: 'COMPLETED' })
      .andWhere('p.ppmCreatedAt >= :since', { since: thirtyDaysAgo })
      .groupBy('p.ppmCurrency')
      .getRawMany();

    return {
      customers: {
        total: totalCustomers,
        new30d: newCustomers30d,
      },
      subscriptions: {
        active: activeSubscriptions,
        trial: trialSubscriptions,
      },
      payments: {
        total: totalPayments,
        completed: completedPayments,
      },
      revenue30d: revenueResult.map((r: { total: string; currency: string }) => ({
        amount: Number(r.total || 0),
        currency: r.currency,
      })),
    };
  }

  async getCustomerList(page = 1, limit = 20, search?: string) {
    const qb = this.customerRepo.createQueryBuilder('c')
      .orderBy('c.pctCreatedAt', 'DESC');

    if (search) {
      qb.where(
        '(c.pctEmail ILIKE :search OR c.pctName ILIKE :search OR c.pctCompanyName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [customers, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      customers: customers.map((c) => ({
        customerId: c.pctId,
        email: c.pctEmail,
        name: c.pctName,
        companyName: c.pctCompanyName,
        country: c.pctCountry,
        emailVerified: c.pctEmailVerified,
        status: c.pctStatus,
        stripeCustomerId: c.pctStripeCustomerId,
        lastLoginAt: c.pctLastLoginAt,
        createdAt: c.pctCreatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getCustomerDetail(customerId: string) {
    const customer = await this.customerRepo.findOne({ where: { pctId: customerId } });
    if (!customer) return null;

    const [subscriptions, payments] = await Promise.all([
      customer.pctCliId
        ? this.subscriptionRepo.find({
            where: { cliId: customer.pctCliId },
            order: { subCreatedAt: 'DESC' },
          })
        : [],
      this.paymentRepo.find({
        where: { ppmCustomerId: customerId },
        order: { ppmCreatedAt: 'DESC' },
        take: 10,
      }),
    ]);

    return {
      customer: {
        customerId: customer.pctId,
        email: customer.pctEmail,
        name: customer.pctName,
        phone: customer.pctPhone,
        companyName: customer.pctCompanyName,
        country: customer.pctCountry,
        emailVerified: customer.pctEmailVerified,
        status: customer.pctStatus,
        clientId: customer.pctCliId,
        stripeCustomerId: customer.pctStripeCustomerId,
        lastLoginAt: customer.pctLastLoginAt,
        createdAt: customer.pctCreatedAt,
      },
      subscriptions: subscriptions.map((s) => ({
        subscriptionId: s.subId,
        status: s.subStatus,
        startDate: s.subStartDate,
        endDate: s.subEndDate,
        billingCycle: s.subBillingCycle,
        price: s.subPrice ? Number(s.subPrice) : null,
        currency: s.subCurrency,
      })),
      recentPayments: payments.map((p) => ({
        paymentId: p.ppmId,
        gateway: p.ppmGateway,
        amount: Number(p.ppmAmount),
        currency: p.ppmCurrency,
        status: p.ppmStatus,
        paidAt: p.ppmPaidAt,
        createdAt: p.ppmCreatedAt,
      })),
    };
  }

  async getPaymentsByGateway(startDate?: Date, endDate?: Date) {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .select('p.ppmGateway', 'gateway')
      .addSelect('p.ppmStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(p.ppmAmount)', 'totalAmount')
      .addSelect('p.ppmCurrency', 'currency')
      .groupBy('p.ppmGateway')
      .addGroupBy('p.ppmStatus')
      .addGroupBy('p.ppmCurrency');

    if (startDate) {
      qb.andWhere('p.ppmCreatedAt >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('p.ppmCreatedAt <= :endDate', { endDate });
    }

    return qb.getRawMany();
  }
}
