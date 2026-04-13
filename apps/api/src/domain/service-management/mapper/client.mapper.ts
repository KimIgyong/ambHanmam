import { SvcClientResponse, SvcClientContactResponse, SvcClientNoteResponse } from '@amb/types';
import { SvcClientEntity } from '../entity/client.entity';
import { SvcClientContactEntity } from '../entity/client-contact.entity';
import { SvcClientNoteEntity } from '../entity/client-note.entity';

export class ClientMapper {
  static toResponse(entity: SvcClientEntity, extra?: { subscriptionCount?: number; activeSubscriptionCount?: number; accountManagerName?: string }): SvcClientResponse {
    return {
      clientId: entity.cliId,
      code: entity.cliCode,
      type: entity.cliType,
      companyName: entity.cliCompanyName,
      companyNameLocal: entity.cliCompanyNameLocal || null,
      country: entity.cliCountry || null,
      industry: entity.cliIndustry || null,
      companySize: entity.cliCompanySize || null,
      taxId: entity.cliTaxId || null,
      address: entity.cliAddress || null,
      website: entity.cliWebsite || null,
      logoUrl: entity.cliLogoUrl || null,
      status: entity.cliStatus,
      source: entity.cliSource || null,
      referredBy: entity.cliReferredBy || null,
      accountManagerId: entity.cliAccountManagerId || null,
      accountManagerName: extra?.accountManagerName || entity.accountManager?.usrName || null,
      bilPartnerId: entity.cliBilPartnerId || null,
      note: entity.cliNote || null,
      originalLang: entity.cliOriginalLang || 'ko',
      subscriptionCount: extra?.subscriptionCount,
      activeSubscriptionCount: extra?.activeSubscriptionCount,
      createdAt: entity.cliCreatedAt.toISOString(),
      updatedAt: entity.cliUpdatedAt.toISOString(),
    };
  }

  static contactToResponse(entity: SvcClientContactEntity): SvcClientContactResponse {
    return {
      contactId: entity.ctcId,
      clientId: entity.cliId,
      name: entity.ctcName,
      email: entity.ctcEmail || null,
      phone: entity.ctcPhone || null,
      position: entity.ctcPosition || null,
      department: entity.ctcDepartment || null,
      isPrimary: entity.ctcIsPrimary,
      note: entity.ctcNote || null,
      createdAt: entity.ctcCreatedAt.toISOString(),
      updatedAt: entity.ctcUpdatedAt.toISOString(),
    };
  }

  static noteToResponse(entity: SvcClientNoteEntity): SvcClientNoteResponse {
    return {
      noteId: entity.cntId,
      clientId: entity.cliId,
      subscriptionId: entity.subId || null,
      type: entity.cntType,
      title: entity.cntTitle || null,
      content: entity.cntContent,
      authorId: entity.cntAuthorId,
      authorName: entity.author?.usrName || '',
      createdAt: entity.cntCreatedAt.toISOString(),
      updatedAt: entity.cntUpdatedAt.toISOString(),
    };
  }
}
