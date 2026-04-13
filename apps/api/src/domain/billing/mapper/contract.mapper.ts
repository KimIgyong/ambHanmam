import { BilContractResponse, BilContractMilestoneResponse, BilPaymentScheduleResponse } from '@amb/types';
import { ContractEntity } from '../entity/contract.entity';
import { ContractMilestoneEntity } from '../entity/contract-milestone.entity';
import { PaymentScheduleEntity } from '../entity/payment-schedule.entity';

export class ContractMapper {
  static toResponse(entity: ContractEntity): BilContractResponse {
    return {
      contractId: entity.ctrId,
      entityId: entity.entId,
      partnerId: entity.ptnId,
      partnerName: entity.partner?.ptnCompanyName || '',
      partnerCode: entity.partner?.ptnCode || '',
      direction: entity.ctrDirection,
      category: entity.ctrCategory,
      type: entity.ctrType,
      title: entity.ctrTitle,
      description: entity.ctrDescription || null,
      startDate: entity.ctrStartDate,
      endDate: entity.ctrEndDate || null,
      amount: Number(entity.ctrAmount),
      currency: entity.ctrCurrency,
      status: entity.ctrStatus,
      autoRenew: entity.ctrAutoRenew,
      billingDay: entity.ctrBillingDay || null,
      billingPeriod: entity.ctrBillingPeriod || null,
      autoGenerate: entity.ctrAutoGenerate,
      unitPrice: entity.ctrUnitPrice ? Number(entity.ctrUnitPrice) : null,
      unitDesc: entity.ctrUnitDesc || null,
      predecessorId: entity.ctrPredecessorId || null,
      gdriveFolderId: entity.ctrGdriveFolderId || null,
      note: entity.ctrNote || null,
      gsheetUrl: entity.ctrGsheetUrl || null,
      gsheetTabPattern: entity.ctrGsheetTabPattern || null,
      assignedUserId: entity.ctrAssignedUserId || null,
      milestones: entity.milestones?.map(ContractMapper.toMilestoneResponse) || [],
      paymentType: entity.ctrPaymentType || null,
      billingAmount: entity.ctrBillingAmount ? Number(entity.ctrBillingAmount) : null,
      paymentSchedules: entity.paymentSchedules?.map(ContractMapper.toScheduleResponse) || [],
      createdAt: entity.ctrCreatedAt.toISOString(),
      updatedAt: entity.ctrUpdatedAt.toISOString(),
    };
  }

  static toMilestoneResponse(entity: ContractMilestoneEntity): BilContractMilestoneResponse {
    return {
      milestoneId: entity.mstId,
      seq: entity.mstSeq,
      label: entity.mstLabel,
      percentage: Number(entity.mstPercentage),
      amount: Number(entity.mstAmount),
      dueDate: entity.mstDueDate || null,
      status: entity.mstStatus,
    };
  }

  static toScheduleResponse(entity: PaymentScheduleEntity): BilPaymentScheduleResponse {
    return {
      scheduleId: entity.pmsId,
      seq: entity.pmsSeq,
      billingDate: entity.pmsBillingDate,
      billingPeriod: entity.pmsBillingPeriod || null,
      amount: Number(entity.pmsAmount),
      status: entity.pmsStatus,
    };
  }
}
