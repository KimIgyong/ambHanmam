import { Injectable, Logger, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocBaseDataEntity } from '../../entity/doc-base-data.entity';
import { DocBaseDataHistoryEntity } from '../../entity/doc-base-data-history.entity';
import { DocBaseCategoryEntity } from '../../entity/doc-base-category.entity';
import { CreateBaseDataDto } from '../../dto/request/create-base-data.dto';
import { UpdateBaseDataDto } from '../../dto/request/update-base-data.dto';
import { CryptoService } from '../../../settings/service/crypto.service';

// Marker prefix for encrypted values
const ENCRYPTED_PREFIX = 'ENC::';

@Injectable()
export class BaseDataService {
  private readonly logger = new Logger(BaseDataService.name);

  constructor(
    @InjectRepository(DocBaseDataEntity)
    private readonly baseDataRepository: Repository<DocBaseDataEntity>,
    @InjectRepository(DocBaseDataHistoryEntity)
    private readonly historyRepository: Repository<DocBaseDataHistoryEntity>,
    @InjectRepository(DocBaseCategoryEntity)
    private readonly categoryRepository: Repository<DocBaseCategoryEntity>,
    @Optional() private readonly cryptoService?: CryptoService,
  ) {}

  // === Categories ===

  async findAllCategories(entityId: string): Promise<DocBaseCategoryEntity[]> {
    return this.categoryRepository.find({
      where: { entId: entityId, dbcIsActive: true },
      order: { dbcDisplayOrder: 'ASC' },
    });
  }

  async findCategoryById(entityId: string, dbcId: string): Promise<DocBaseCategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { dbcId, entId: entityId, dbcIsActive: true },
    });
    if (!category) {
      throw new NotFoundException(`Category ${dbcId} not found`);
    }
    return category;
  }

  async findCategoryByCode(entityId: string, code: string): Promise<DocBaseCategoryEntity | null> {
    return this.categoryRepository.findOne({
      where: { entId: entityId, dbcCode: code, dbcIsActive: true },
    });
  }

  // === Base Data CRUD ===

  async findAllData(
    entityId: string,
    options?: { categoryCode?: string; language?: string },
  ): Promise<DocBaseDataEntity[]> {
    const qb = this.baseDataRepository
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.category', 'c')
      .where('d.entId = :entityId', { entityId })
      .andWhere('d.dbdIsCurrent = true');

    if (options?.language) {
      qb.andWhere('d.dbdLanguage = :language', { language: options.language });
    }

    if (options?.categoryCode) {
      qb.andWhere('c.dbcCode = :code', { code: options.categoryCode });
    }

    const results = await qb.orderBy('c.dbcDisplayOrder', 'ASC').getMany();

    // Decrypt CONFIDENTIAL data on read
    for (const item of results) {
      if (item.category?.dbcConfidentiality === 'CONFIDENTIAL' && item.dbdData) {
        item.dbdData = this.decryptData(item.dbdData);
      }
    }

    return results;
  }

  async findOneData(entityId: string, dbdId: string): Promise<DocBaseDataEntity> {
    const data = await this.baseDataRepository.findOne({
      where: { dbdId, entId: entityId },
      relations: ['category'],
    });
    if (!data) {
      throw new NotFoundException(`BaseData ${dbdId} not found`);
    }
    // Decrypt CONFIDENTIAL data on read
    if (data.category?.dbcConfidentiality === 'CONFIDENTIAL' && data.dbdData) {
      data.dbdData = this.decryptData(data.dbdData);
    }
    return data;
  }

  async createData(
    entityId: string,
    userId: string,
    dto: CreateBaseDataDto,
  ): Promise<DocBaseDataEntity> {
    // Validate category exists
    const category = await this.categoryRepository.findOne({
      where: { dbcId: dto.category_id, entId: entityId, dbcIsActive: true },
    });
    if (!category) {
      throw new BadRequestException(`Category ${dto.category_id} not found`);
    }

    // Check if data already exists for this category + language
    const existing = await this.baseDataRepository.findOne({
      where: {
        dbcId: dto.category_id,
        entId: entityId,
        dbdLanguage: dto.language || 'en',
        dbdIsCurrent: true,
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Data already exists for category ${category.dbcCode} in language ${dto.language || 'en'}. Use PUT to update.`,
      );
    }

    // Encrypt CONFIDENTIAL data before storing
    const dataToStore = category.dbcConfidentiality === 'CONFIDENTIAL'
      ? this.encryptData(dto.data)
      : dto.data;

    const entity = this.baseDataRepository.create({
      dbcId: dto.category_id,
      entId: entityId,
      dbdLanguage: dto.language || 'en',
      dbdData: dataToStore,
      dbdVersion: 1,
      dbdIsCurrent: true,
      dbdUpdatedBy: userId,
      dbdUpdateSource: dto.update_source || 'MANUAL',
    });
    return this.baseDataRepository.save(entity);
  }

  async updateData(
    entityId: string,
    userId: string,
    dbdId: string,
    dto: UpdateBaseDataDto,
  ): Promise<DocBaseDataEntity> {
    const existing = await this.findOneData(entityId, dbdId);

    // Save current version to history
    const history = this.historyRepository.create({
      dbdId: existing.dbdId,
      dbhVersion: existing.dbdVersion,
      dbhData: existing.dbdData,
      dbhChangeReason: dto.change_reason,
      dbhChangedBy: userId,
    });
    await this.historyRepository.save(history);

    // Encrypt CONFIDENTIAL data if category requires it
    const category = await this.categoryRepository.findOne({
      where: { dbcId: existing.dbcId },
    });
    const dataToStore = category?.dbcConfidentiality === 'CONFIDENTIAL'
      ? this.encryptData(dto.data)
      : dto.data;

    // Update with new data
    existing.dbdData = dataToStore;
    existing.dbdVersion += 1;
    existing.dbdUpdatedBy = userId;
    existing.dbdUpdateSource = dto.update_source || 'MANUAL';
    existing.dbdFreshnessAt = new Date();

    return this.baseDataRepository.save(existing);
  }

  // === Version History ===

  async getHistory(entityId: string, dbdId: string): Promise<DocBaseDataHistoryEntity[]> {
    // Verify data belongs to this entity
    await this.findOneData(entityId, dbdId);

    return this.historyRepository.find({
      where: { dbdId },
      order: { dbhVersion: 'DESC' },
      relations: ['changedByUser'],
    });
  }

  async rollback(
    entityId: string,
    userId: string,
    dbdId: string,
    targetVersion: number,
  ): Promise<DocBaseDataEntity> {
    const current = await this.findOneData(entityId, dbdId);

    const targetHistory = await this.historyRepository.findOne({
      where: { dbdId, dbhVersion: targetVersion },
    });
    if (!targetHistory) {
      throw new NotFoundException(`Version ${targetVersion} not found for data ${dbdId}`);
    }

    // Save current to history before rollback
    const history = this.historyRepository.create({
      dbdId: current.dbdId,
      dbhVersion: current.dbdVersion,
      dbhData: current.dbdData,
      dbhChangeReason: `Rollback to version ${targetVersion}`,
      dbhChangedBy: userId,
    });
    await this.historyRepository.save(history);

    // Rollback
    current.dbdData = targetHistory.dbhData;
    current.dbdVersion += 1;
    current.dbdUpdatedBy = userId;
    current.dbdUpdateSource = 'MANUAL';
    current.dbdFreshnessAt = new Date();

    return this.baseDataRepository.save(current);
  }

  // === Encryption Helpers ===

  private encryptData(data: Record<string, any>): Record<string, any> {
    if (!this.cryptoService) {
      this.logger.warn('CryptoService not available, storing data unencrypted');
      return data;
    }
    try {
      const plainText = JSON.stringify(data);
      const { encrypted, iv, tag } = this.cryptoService.encrypt(plainText);
      return { __encrypted: `${ENCRYPTED_PREFIX}${iv}::${tag}::${encrypted}` } as any;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error}`);
      return data;
    }
  }

  private decryptData(data: Record<string, any>): Record<string, any> {
    if (!this.cryptoService) return data;
    const encValue = (data as any)?.__encrypted;
    if (typeof encValue !== 'string' || !encValue.startsWith(ENCRYPTED_PREFIX)) {
      return data; // Not encrypted, return as-is
    }
    try {
      const payload = encValue.substring(ENCRYPTED_PREFIX.length);
      const [iv, tag, encrypted] = payload.split('::');
      const plainText = this.cryptoService.decrypt(encrypted, iv, tag);
      return JSON.parse(plainText);
    } catch (error) {
      this.logger.error(`Decryption failed: ${error}`);
      return data;
    }
  }

  // === Completeness Check ===

  async getCategoryCompleteness(
    entityId: string,
    language: string = 'en',
  ): Promise<{ categoryCode: string; categoryName: string; hasData: boolean; fieldCount: number; filledCount: number; completeness: number }[]> {
    const categories = await this.findAllCategories(entityId);
    const result = [];

    for (const cat of categories) {
      const data = await this.baseDataRepository.findOne({
        where: { dbcId: cat.dbcId, entId: entityId, dbdLanguage: language, dbdIsCurrent: true },
      });

      const fieldCount = Array.isArray(cat.dbcFieldSchema) ? cat.dbcFieldSchema.length : 0;
      let filledCount = 0;

      if (data?.dbdData && fieldCount > 0) {
        for (const field of cat.dbcFieldSchema) {
          const val = data.dbdData[field.field];
          if (val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
            filledCount++;
          }
        }
      }

      result.push({
        categoryCode: cat.dbcCode,
        categoryName: cat.dbcName,
        hasData: !!data,
        fieldCount,
        filledCount,
        completeness: fieldCount > 0 ? Math.round((filledCount / fieldCount) * 100) : 0,
      });
    }

    return result;
  }
}
