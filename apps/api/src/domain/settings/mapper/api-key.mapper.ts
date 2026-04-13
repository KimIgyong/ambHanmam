import { ApiKeyEntity } from '../entity/api-key.entity';
import { ApiKeyResponse } from '@amb/types';

export class ApiKeyMapper {
  static toResponse(entity: ApiKeyEntity): ApiKeyResponse {
    return {
      apiKeyId: entity.apkId,
      provider: entity.apkProvider as ApiKeyResponse['provider'],
      name: entity.apkName,
      keyLast4: entity.apkKeyLast4,
      isActive: entity.apkIsActive,
      createdBy: entity.apkCreatedBy,
      createdAt: entity.apkCreatedAt.toISOString(),
      updatedAt: entity.apkUpdatedAt.toISOString(),
    };
  }

  static toResponseList(entities: ApiKeyEntity[]): ApiKeyResponse[] {
    return entities.map(this.toResponse);
  }
}
