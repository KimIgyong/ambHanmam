import { BilPartnerResponse } from '@amb/types';
import { PartnerEntity } from '../entity/partner.entity';

export class PartnerMapper {
  static toResponse(entity: PartnerEntity): BilPartnerResponse {
    return {
      partnerId: entity.ptnId,
      entityId: entity.entId,
      code: entity.ptnCode,
      type: entity.ptnType,
      companyName: entity.ptnCompanyName,
      companyNameLocal: entity.ptnCompanyNameLocal || null,
      country: entity.ptnCountry || null,
      contactName: entity.ptnContactName || null,
      contactEmail: entity.ptnContactEmail || null,
      contactPhone: entity.ptnContactPhone || null,
      address: entity.ptnAddress || null,
      taxId: entity.ptnTaxId || null,
      bizType: entity.ptnBizType || null,
      bizCategory: entity.ptnBizCategory || null,
      ceoName: entity.ptnCeoName || null,
      defaultCurrency: entity.ptnDefaultCurrency,
      paymentTerms: entity.ptnPaymentTerms,
      status: entity.ptnStatus,
      crossEntityRef: entity.ptnCrossEntityRef || null,
      gdriveFolderId: entity.ptnGdriveFolderId || null,
      note: entity.ptnNote || null,
      originalLang: entity.ptnOriginalLang || 'ko',
      createdAt: entity.ptnCreatedAt.toISOString(),
      updatedAt: entity.ptnUpdatedAt.toISOString(),
    };
  }
}
