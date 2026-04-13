import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SvcSubscriptionEntity } from '../../../shared-entities/subscription.entity';
import { SvcPlanEntity } from '../../../shared-entities/service-plan.entity';
import { SvcServiceEntity } from '../../../shared-entities/service.entity';
import { PortalCustomerEntity } from '../../auth/entity/portal-customer.entity';

@Injectable()
export class PortalSubscriptionService {
  constructor(
    @InjectRepository(SvcSubscriptionEntity)
    private readonly subscriptionRepo: Repository<SvcSubscriptionEntity>,
    @InjectRepository(SvcPlanEntity)
    private readonly planRepo: Repository<SvcPlanEntity>,
    @InjectRepository(SvcServiceEntity)
    private readonly serviceRepo: Repository<SvcServiceEntity>,
    @InjectRepository(PortalCustomerEntity)
    private readonly customerRepo: Repository<PortalCustomerEntity>,
  ) {}

  async getSubscriptions(customerId: string) {
    const customer = await this.customerRepo.findOne({ where: { pctId: customerId } });
    if (!customer?.pctCliId) return [];

    const subscriptions = await this.subscriptionRepo.find({
      where: { cliId: customer.pctCliId },
      order: { subCreatedAt: 'DESC' },
    });

    return Promise.all(subscriptions.map(async (sub) => {
      const plan = sub.splId
        ? await this.planRepo.findOne({ where: { splId: sub.splId } })
        : null;
      const service = sub.svcId
        ? await this.serviceRepo.findOne({ where: { svcId: sub.svcId } })
        : null;

      return {
        subscriptionId: sub.subId,
        status: sub.subStatus,
        startDate: sub.subStartDate,
        endDate: sub.subEndDate,
        trialEndDate: sub.subTrialEndDate,
        billingCycle: sub.subBillingCycle,
        price: sub.subPrice ? Number(sub.subPrice) : null,
        currency: sub.subCurrency,
        cancelAtPeriodEnd: sub.subCancelAtPeriodEnd,
        currentPeriodEnd: sub.subCurrentPeriodEnd,
        service: service ? {
          serviceId: service.svcId,
          code: service.svcCode,
          name: service.svcName,
          icon: service.svcIcon,
          color: service.svcColor,
        } : null,
        plan: plan ? {
          planId: plan.splId,
          code: plan.splCode,
          name: plan.splName,
        } : null,
      };
    }));
  }

  async getSubscriptionDetail(customerId: string, subscriptionId: string) {
    const customer = await this.customerRepo.findOne({ where: { pctId: customerId } });
    if (!customer?.pctCliId) throw new NotFoundException('Subscription not found');

    const sub = await this.subscriptionRepo.findOne({
      where: { subId: subscriptionId, cliId: customer.pctCliId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const plan = sub.splId
      ? await this.planRepo.findOne({ where: { splId: sub.splId } })
      : null;
    const service = sub.svcId
      ? await this.serviceRepo.findOne({ where: { svcId: sub.svcId } })
      : null;

    return {
      subscriptionId: sub.subId,
      status: sub.subStatus,
      startDate: sub.subStartDate,
      endDate: sub.subEndDate,
      trialEndDate: sub.subTrialEndDate,
      billingCycle: sub.subBillingCycle,
      price: sub.subPrice ? Number(sub.subPrice) : null,
      currency: sub.subCurrency,
      maxUsers: sub.subMaxUsers,
      actualUsers: sub.subActualUsers,
      autoRenew: sub.subAutoRenew,
      cancelAtPeriodEnd: sub.subCancelAtPeriodEnd,
      currentPeriodStart: sub.subCurrentPeriodStart,
      currentPeriodEnd: sub.subCurrentPeriodEnd,
      stripeSubscriptionId: sub.subStripeSubscriptionId,
      service: service ? {
        serviceId: service.svcId,
        code: service.svcCode,
        name: service.svcName,
        nameKo: service.svcNameKo,
        nameVi: service.svcNameVi,
        icon: service.svcIcon,
        color: service.svcColor,
      } : null,
      plan: plan ? {
        planId: plan.splId,
        code: plan.splCode,
        name: plan.splName,
        description: plan.splDescription,
        features: plan.splFeaturesJson ? JSON.parse(plan.splFeaturesJson) : null,
      } : null,
    };
  }
}
