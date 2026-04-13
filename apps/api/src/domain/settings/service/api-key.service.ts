import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { ApiKeyEntity } from '../entity/api-key.entity';
import { CryptoService } from './crypto.service';
import { CreateApiKeyRequest } from '../dto/request/create-api-key.request';
import { UpdateApiKeyRequest } from '../dto/request/update-api-key.request';
import { ApiKeyMapper } from '../mapper/api-key.mapper';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { ApiKeyResponse } from '@amb/types';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeyRepository: Repository<ApiKeyEntity>,
    private readonly cryptoService: CryptoService,
  ) {}

  async findAll(): Promise<ApiKeyResponse[]> {
    const entities = await this.apiKeyRepository.find({
      where: { apkDeletedAt: IsNull() },
      order: { apkCreatedAt: 'DESC' },
    });
    return ApiKeyMapper.toResponseList(entities);
  }

  async create(
    dto: CreateApiKeyRequest,
    userId: string,
  ): Promise<ApiKeyResponse> {
    const { encrypted, iv, tag } = this.cryptoService.encrypt(dto.api_key);
    const last4 = dto.api_key.slice(-4);

    const entity = this.apiKeyRepository.create({
      apkProvider: dto.provider,
      apkName: dto.name,
      apkKeyEncrypted: encrypted,
      apkKeyIv: iv,
      apkKeyTag: tag,
      apkKeyLast4: last4,
      apkIsActive: true,
      apkCreatedBy: userId,
    });

    const saved = await this.apiKeyRepository.save(entity);
    return ApiKeyMapper.toResponse(saved);
  }

  async update(
    id: string,
    dto: UpdateApiKeyRequest,
  ): Promise<ApiKeyResponse> {
    const entity = await this.findEntityById(id);

    if (dto.name !== undefined) {
      entity.apkName = dto.name;
    }

    if (dto.is_active !== undefined) {
      entity.apkIsActive = dto.is_active;
    }

    if (dto.api_key) {
      const { encrypted, iv, tag } = this.cryptoService.encrypt(dto.api_key);
      entity.apkKeyEncrypted = encrypted;
      entity.apkKeyIv = iv;
      entity.apkKeyTag = tag;
      entity.apkKeyLast4 = dto.api_key.slice(-4);
    }

    const saved = await this.apiKeyRepository.save(entity);
    return ApiKeyMapper.toResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findEntityById(id);
    await this.apiKeyRepository.softRemove(entity);
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const entity = await this.findEntityById(id);

    let decryptedKey: string;
    try {
      decryptedKey = this.cryptoService.decrypt(
        entity.apkKeyEncrypted,
        entity.apkKeyIv,
        entity.apkKeyTag,
      );
    } catch {
      throw new BusinessException(
        ERROR_CODE.API_KEY_DECRYPT_FAILED.code,
        ERROR_CODE.API_KEY_DECRYPT_FAILED.message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      if (entity.apkProvider === 'ANTHROPIC') {
        const client = new Anthropic({ apiKey: decryptedKey });
        await client.messages.create({
          model: 'claude-opus-4-6',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        });
        return { success: true, message: 'Anthropic API connection successful.' };
      }

      return { success: false, message: 'Unsupported provider.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`API key test failed for ${entity.apkProvider}: ${message}`);
      throw new BusinessException(
        ERROR_CODE.API_KEY_TEST_FAILED.code,
        `Connection test failed: ${message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getDecryptedKey(provider: string, entityId?: string): Promise<string | null> {
    // 1. 법인 전용 키 우선 조회
    if (entityId) {
      const entityKey = await this.apiKeyRepository.findOne({
        where: {
          apkProvider: provider,
          entId: entityId,
          apkIsActive: true,
          apkDeletedAt: IsNull(),
        },
        order: { apkUpdatedAt: 'DESC' },
      });

      if (entityKey) {
        try {
          return this.cryptoService.decrypt(
            entityKey.apkKeyEncrypted,
            entityKey.apkKeyIv,
            entityKey.apkKeyTag,
          );
        } catch {
          this.logger.error(`Failed to decrypt entity API key for provider: ${provider}, entity: ${entityId}`);
        }
      }
    }

    // 2. 시스템 공동 키 (ent_id IS NULL)
    const entity = await this.apiKeyRepository.findOne({
      where: {
        apkProvider: provider,
        entId: IsNull() as any,
        apkIsActive: true,
        apkDeletedAt: IsNull(),
      },
      order: { apkUpdatedAt: 'DESC' },
    });

    if (!entity) return null;

    try {
      return this.cryptoService.decrypt(
        entity.apkKeyEncrypted,
        entity.apkKeyIv,
        entity.apkKeyTag,
      );
    } catch {
      this.logger.error(`Failed to decrypt API key for provider: ${provider}`);
      return null;
    }
  }

  /** 법인별 API Key 목록 조회 */
  async findByEntity(entityId: string): Promise<ApiKeyResponse[]> {
    const entities = await this.apiKeyRepository.find({
      where: { entId: entityId, apkDeletedAt: IsNull() },
      order: { apkCreatedAt: 'DESC' },
    });
    return ApiKeyMapper.toResponseList(entities);
  }

  /** 법인별 API Key 등록 */
  async createForEntity(
    dto: CreateApiKeyRequest,
    userId: string,
    entityId: string,
  ): Promise<ApiKeyResponse> {
    const { encrypted, iv, tag } = this.cryptoService.encrypt(dto.api_key);
    const last4 = dto.api_key.slice(-4);

    const entity = this.apiKeyRepository.create({
      entId: entityId,
      apkProvider: dto.provider,
      apkName: dto.name,
      apkKeyEncrypted: encrypted,
      apkKeyIv: iv,
      apkKeyTag: tag,
      apkKeyLast4: last4,
      apkIsActive: true,
      apkCreatedBy: userId,
    });

    const saved = await this.apiKeyRepository.save(entity);
    return ApiKeyMapper.toResponse(saved);
  }

  private async findEntityById(id: string): Promise<ApiKeyEntity> {
    const entity = await this.apiKeyRepository.findOne({
      where: { apkId: id, apkDeletedAt: IsNull() },
    });

    if (!entity) {
      throw new BusinessException(
        ERROR_CODE.API_KEY_NOT_FOUND.code,
        ERROR_CODE.API_KEY_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    return entity;
  }
}
