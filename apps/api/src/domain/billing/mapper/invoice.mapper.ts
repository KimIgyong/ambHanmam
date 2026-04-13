import { InvoiceEntity } from '../entity/invoice.entity';
import { InvoiceItemEntity } from '../entity/invoice-item.entity';

export class InvoiceMapper {
  static toResponse(entity: InvoiceEntity) {
    return {
      invoiceId: entity.invId,
      entityId: entity.entId,
      partnerId: entity.ptnId,
      partnerName: entity.partner?.ptnCompanyName || '',
      partnerCode: entity.partner?.ptnCode || '',
      partnerContactEmail: entity.partner?.ptnContactEmail || null,
      contractId: entity.ctrId || null,
      contractTitle: entity.contract?.ctrTitle || null,
      sowId: entity.sowId || null,
      number: entity.invNumber,
      direction: entity.invDirection,
      date: entity.invDate,
      dueDate: entity.invDueDate || null,
      servicePeriodStart: entity.invServicePeriodStart || null,
      servicePeriodEnd: entity.invServicePeriodEnd || null,
      subtotal: Number(entity.invSubtotal) || 0,
      taxRate: Number(entity.invTaxRate) || 0,
      taxAmount: Number(entity.invTaxAmount) || 0,
      total: Number(entity.invTotal) || 0,
      currency: entity.invCurrency,
      status: entity.invStatus,
      paidAmount: Number(entity.invPaidAmount) || 0,
      paidDate: entity.invPaidDate || null,
      internalCode: entity.invInternalCode || null,
      taxInvoiceType: entity.invTaxInvoiceType || null,
      note: entity.invNote || null,
      approvalStatus: entity.invApprovalStatus || 'NONE',
      reviewerId: entity.invReviewerId || null,
      reviewedAt: entity.invReviewedAt?.toISOString() || null,
      approverManagerId: entity.invApproverManagerId || null,
      approvedManagerAt: entity.invApprovedManagerAt?.toISOString() || null,
      approverAdminId: entity.invApproverAdminId || null,
      approvedAdminAt: entity.invApprovedAdminAt?.toISOString() || null,
      rejectionReason: entity.invRejectionReason || null,
      gsheetUrl: entity.invGsheetUrl || null,
      einvoice: entity.invEinvStatus && entity.invEinvStatus !== 'NONE' ? {
        status: entity.invEinvStatus,
        number: entity.invEinvNumber || null,
        formNumber: entity.invEinvFormNumber || null,
        referenceCode: entity.invEinvReferenceCode || null,
        gdtCode: entity.invEinvGdtCode || null,
        issuedAt: entity.invEinvIssuedAt?.toISOString() || null,
        lookupUrl: entity.invEinvLookupUrl || null,
        error: entity.invEinvError || null,
      } : null,
      ntsInfo: entity.invNtsStatus && entity.invNtsStatus !== 'NONE' ? {
        mgtKey: entity.invNtsMgtKey || null,
        confirmNum: entity.invNtsConfirmNum || null,
        status: entity.invNtsStatus,
        issuedAt: entity.invNtsIssuedAt?.toISOString() ?? null,
        sentAt: entity.invNtsSentAt?.toISOString() ?? null,
        resultCode: entity.invNtsResultCode || null,
        error: entity.invNtsError || null,
        modifyCode: entity.invNtsModifyCode || null,
        originalKey: entity.invNtsOriginalKey || null,
      } : null,
      items: (entity.items || []).map(InvoiceMapper.toItemResponse),
      createdAt: entity.invCreatedAt?.toISOString(),
      updatedAt: entity.invUpdatedAt?.toISOString(),
    };
  }

  static toItemResponse(item: InvoiceItemEntity) {
    return {
      itemId: item.itmId,
      seq: item.itmSeq,
      description: item.itmDescription,
      quantity: Number(item.itmQuantity) || 0,
      unitPrice: Number(item.itmUnitPrice) || 0,
      amount: Number(item.itmAmount) || 0,
    };
  }
}
