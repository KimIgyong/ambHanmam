import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SvcServiceEntity } from '../../../shared-entities/service.entity';
import { SvcPlanEntity } from '../../../shared-entities/service-plan.entity';

@Injectable()
export class PublicCatalogService {
  constructor(
    @InjectRepository(SvcServiceEntity)
    private readonly serviceRepo: Repository<SvcServiceEntity>,
    @InjectRepository(SvcPlanEntity)
    private readonly planRepo: Repository<SvcPlanEntity>,
  ) {}

  async getServices() {
    const services = await this.serviceRepo.find({
      where: { svcStatus: 'ACTIVE' },
      order: { svcSortOrder: 'ASC' },
    });

    return Promise.all(services.map(async (svc) => {
      const plans = await this.planRepo.find({
        where: { svcId: svc.svcId, splIsActive: true },
        order: { splSortOrder: 'ASC' },
      });

      return {
        serviceId: svc.svcId,
        code: svc.svcCode,
        name: svc.svcName,
        nameKo: svc.svcNameKo,
        nameVi: svc.svcNameVi,
        description: svc.svcDescription,
        category: svc.svcCategory,
        icon: svc.svcIcon,
        color: svc.svcColor,
        websiteUrl: svc.svcWebsiteUrl,
        plans: plans.map((p) => ({
          planId: p.splId,
          code: p.splCode,
          name: p.splName,
          description: p.splDescription,
          billingCycle: p.splBillingCycle,
          price: Number(p.splPrice),
          currency: p.splCurrency,
          maxUsers: p.splMaxUsers,
          features: p.splFeaturesJson ? JSON.parse(p.splFeaturesJson) : null,
          trialDays: p.splTrialDays,
        })),
      };
    }));
  }

  async getServiceByCode(code: string) {
    const svc = await this.serviceRepo.findOne({
      where: { svcCode: code, svcStatus: 'ACTIVE' },
    });
    if (!svc) return null;

    const plans = await this.planRepo.find({
      where: { svcId: svc.svcId, splIsActive: true },
      order: { splSortOrder: 'ASC' },
    });

    return {
      serviceId: svc.svcId,
      code: svc.svcCode,
      name: svc.svcName,
      nameKo: svc.svcNameKo,
      nameVi: svc.svcNameVi,
      description: svc.svcDescription,
      category: svc.svcCategory,
      icon: svc.svcIcon,
      color: svc.svcColor,
      websiteUrl: svc.svcWebsiteUrl,
      plans: plans.map((p) => ({
        planId: p.splId,
        code: p.splCode,
        name: p.splName,
        description: p.splDescription,
        billingCycle: p.splBillingCycle,
        price: Number(p.splPrice),
        currency: p.splCurrency,
        maxUsers: p.splMaxUsers,
        features: p.splFeaturesJson ? JSON.parse(p.splFeaturesJson) : null,
        trialDays: p.splTrialDays,
      })),
    };
  }
}
