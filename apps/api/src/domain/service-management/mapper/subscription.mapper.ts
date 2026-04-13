import { SvcSubscriptionResponse, SvcSubscriptionHistoryResponse } from '@amb/types';
import { SvcSubscriptionEntity } from '../entity/subscription.entity';
import { SvcSubscriptionHistoryEntity } from '../entity/subscription-history.entity';

export class SubscriptionMapper {
  static toResponse(entity: SvcSubscriptionEntity): SvcSubscriptionResponse {
    return {
      subscriptionId: entity.subId,
      clientId: entity.cliId,
      clientName: entity.client?.cliCompanyName || '',
      serviceId: entity.svcId,
      serviceName: entity.service?.svcName || '',
      planId: entity.splId || null,
      planName: entity.plan?.splName || null,
      status: entity.subStatus,
      startDate: entity.subStartDate,
      endDate: entity.subEndDate || null,
      trialEndDate: entity.subTrialEndDate || null,
      billingCycle: entity.subBillingCycle || null,
      price: entity.subPrice != null ? Number(entity.subPrice) : null,
      currency: entity.subCurrency,
      discountRate: Number(entity.subDiscountRate),
      maxUsers: entity.subMaxUsers,
      actualUsers: entity.subActualUsers,
      contractId: entity.subContractId || null,
      autoRenew: entity.subAutoRenew,
      cancelledAt: entity.subCancelledAt?.toISOString() || null,
      cancellationReason: entity.subCancellationReason || null,
      note: entity.subNote || null,
      createdAt: entity.subCreatedAt.toISOString(),
      updatedAt: entity.subUpdatedAt.toISOString(),
    };
  }

  static historyToResponse(entity: SvcSubscriptionHistoryEntity): SvcSubscriptionHistoryResponse {
    return {
      historyId: entity.sbhId,
      subscriptionId: entity.subId,
      action: entity.sbhAction,
      field: entity.sbhField || null,
      oldValue: entity.sbhOldValue || null,
      newValue: entity.sbhNewValue || null,
      changedBy: entity.sbhChangedBy || null,
      note: entity.sbhNote || null,
      createdAt: entity.sbhCreatedAt.toISOString(),
    };
  }
}
