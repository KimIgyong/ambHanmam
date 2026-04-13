import { PaymentEntity } from '../entity/payment.entity';

export class PaymentMapper {
  static toResponse(entity: PaymentEntity) {
    return {
      paymentId: entity.payId,
      entityId: entity.entId,
      invoiceId: entity.invId,
      invoiceNumber: entity.invoice?.invNumber || '',
      partnerName: entity.invoice?.partner?.ptnCompanyName || '',
      amount: Number(entity.payAmount) || 0,
      currency: entity.payCurrency,
      date: entity.payDate,
      method: entity.payMethod,
      reference: entity.payReference || null,
      note: entity.payNote || null,
      createdAt: entity.payCreatedAt?.toISOString(),
    };
  }
}
