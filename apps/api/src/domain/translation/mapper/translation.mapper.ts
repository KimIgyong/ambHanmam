import { ContentTranslationEntity } from '../entity/content-translation.entity';
import { TranslationHistoryEntity } from '../entity/translation-history.entity';
import { TranslationGlossaryEntity } from '../entity/translation-glossary.entity';
import { TranslationResponse, TranslationSummary, GlossaryTermResponse, TranslationHistoryResponse } from '@amb/types';

export class TranslationMapper {
  static toResponse(entity: ContentTranslationEntity): TranslationResponse {
    return {
      id: entity.trnId,
      sourceType: entity.trnSourceType as any,
      sourceId: entity.trnSourceId,
      sourceField: entity.trnSourceField,
      sourceLang: entity.trnSourceLang as any,
      targetLang: entity.trnTargetLang as any,
      content: entity.trnContent,
      method: entity.trnMethod as any,
      confidence: entity.trnConfidence,
      isStale: entity.trnIsStale,
      isLocked: entity.trnIsLocked,
      version: entity.trnVersion,
      translatedBy: {
        id: entity.trnTranslatedBy,
        name: entity.translatedByUser?.usrName || '',
      },
      lastEditedBy: entity.trnLastEditedBy
        ? { id: entity.trnLastEditedBy, name: entity.lastEditedByUser?.usrName || '' }
        : null,
      lastEditedAt: entity.trnLastEditedAt?.toISOString() || null,
      createdAt: entity.trnCreatedAt.toISOString(),
      updatedAt: entity.trnUpdatedAt.toISOString(),
    };
  }

  static toSummary(entity: ContentTranslationEntity): TranslationSummary {
    return {
      lang: entity.trnTargetLang as any,
      status: entity.trnIsStale ? 'STALE' : 'FRESH',
      title: entity.trnSourceField === 'title' ? entity.trnContent : undefined,
      content: entity.trnSourceField === 'content' ? entity.trnContent : undefined,
      method: entity.trnMethod as any,
      translatedAt: entity.trnCreatedAt.toISOString(),
      lastEditedBy: entity.trnLastEditedBy
        ? { id: entity.trnLastEditedBy, name: entity.lastEditedByUser?.usrName || '' }
        : null,
    };
  }

  static toHistoryResponse(entity: TranslationHistoryEntity): TranslationHistoryResponse {
    return {
      id: entity.thiId,
      translationId: entity.trnId,
      content: entity.thiContent,
      method: entity.thiMethod as any,
      version: entity.thiVersion,
      editedBy: {
        id: entity.thiEditedBy,
        name: entity.editedByUser?.usrName || '',
      },
      changeReason: entity.thiChangeReason,
      createdAt: entity.thiCreatedAt.toISOString(),
    };
  }

  static toGlossaryResponse(entity: TranslationGlossaryEntity): GlossaryTermResponse {
    return {
      id: entity.glsId,
      termEn: entity.glsTermEn,
      termKo: entity.glsTermKo,
      termVi: entity.glsTermVi,
      category: entity.glsCategory,
      context: entity.glsContext,
      createdAt: entity.glsCreatedAt.toISOString(),
    };
  }
}
