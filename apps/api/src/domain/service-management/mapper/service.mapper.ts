import { SvcServiceResponse, SvcPlanResponse } from '@amb/types';
import { SvcServiceEntity } from '../entity/service.entity';
import { SvcPlanEntity } from '../entity/service-plan.entity';

export class ServiceMapper {
  static toResponse(entity: SvcServiceEntity, extra?: { planCount?: number; activeSubscriptionCount?: number }): SvcServiceResponse {
    return {
      serviceId: entity.svcId,
      code: entity.svcCode,
      name: entity.svcName,
      nameKo: entity.svcNameKo || null,
      nameVi: entity.svcNameVi || null,
      description: entity.svcDescription || null,
      category: entity.svcCategory,
      icon: entity.svcIcon || null,
      color: entity.svcColor || null,
      websiteUrl: entity.svcWebsiteUrl || null,
      status: entity.svcStatus,
      launchDate: entity.svcLaunchDate || null,
      sortOrder: entity.svcSortOrder,
      planCount: extra?.planCount,
      activeSubscriptionCount: extra?.activeSubscriptionCount,
      createdAt: entity.svcCreatedAt.toISOString(),
      updatedAt: entity.svcUpdatedAt.toISOString(),
    };
  }

  static planToResponse(entity: SvcPlanEntity): SvcPlanResponse {
    return {
      planId: entity.splId,
      serviceId: entity.svcId,
      code: entity.splCode,
      name: entity.splName,
      description: entity.splDescription || null,
      billingCycle: entity.splBillingCycle,
      price: Number(entity.splPrice),
      currency: entity.splCurrency,
      maxUsers: entity.splMaxUsers,
      featuresJson: entity.splFeaturesJson || null,
      isActive: entity.splIsActive,
      sortOrder: entity.splSortOrder,
      createdAt: entity.splCreatedAt.toISOString(),
      updatedAt: entity.splUpdatedAt.toISOString(),
    };
  }
}
