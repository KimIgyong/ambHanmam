import { BilSowResponse } from '@amb/types';
import { SowEntity } from '../entity/sow.entity';

export class SowMapper {
  static toResponse(entity: SowEntity): BilSowResponse {
    return {
      sowId: entity.sowId,
      contractId: entity.ctrId,
      contractTitle: entity.contract?.ctrTitle || '',
      entityId: entity.entId,
      partnerName: entity.contract?.partner?.ptnCompanyName || '',
      title: entity.sowTitle,
      description: entity.sowDescription || null,
      periodStart: entity.sowPeriodStart,
      periodEnd: entity.sowPeriodEnd,
      amount: Number(entity.sowAmount),
      currency: entity.sowCurrency,
      status: entity.sowStatus,
      note: entity.sowNote || null,
      createdAt: entity.sowCreatedAt.toISOString(),
      updatedAt: entity.sowUpdatedAt.toISOString(),
    };
  }
}
