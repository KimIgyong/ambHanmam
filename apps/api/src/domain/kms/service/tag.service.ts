import { Injectable, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike } from 'typeorm';
import { KmsTagEntity } from '../entity/kms-tag.entity';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { BusinessException } from '../../../global/filter/business.exception';
import { KmsTagResponse, TagLevel } from '@amb/types';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(KmsTagEntity)
    private readonly tagRepository: Repository<KmsTagEntity>,
  ) {}

  async createTag(params: {
    entityId: string;
    name: string;
    nameLocal?: string;
    level?: number;
    parentId?: string;
    color?: string;
    isSystem?: boolean;
  }): Promise<KmsTagResponse> {
    const normalized = params.name.toLowerCase().trim();

    // Check duplicate
    const existing = await this.tagRepository.findOne({
      where: { entId: params.entityId, tagName: normalized },
    });
    if (existing) {
      throw new BusinessException(
        ERROR_CODE.KMS_TAG_DUPLICATE.code,
        ERROR_CODE.KMS_TAG_DUPLICATE.message,
        HttpStatus.CONFLICT,
      );
    }

    const entity = this.tagRepository.create({
      entId: params.entityId,
      tagName: normalized,
      tagDisplay: params.name.trim(),
      tagNameLocal: params.nameLocal || null,
      tagLevel: params.level || 2,
      tagParentId: params.parentId || null,
      tagColor: params.color || null,
      tagIsSystem: params.isSystem || false,
    } as Partial<KmsTagEntity>);

    const saved = await this.tagRepository.save(entity as KmsTagEntity);
    return this.toResponse(saved as KmsTagEntity);
  }

  async getTag(id: string): Promise<KmsTagResponse> {
    const entity = await this.tagRepository.findOne({
      where: { tagId: id },
      relations: ['children'],
    });
    if (!entity) throw new NotFoundException(ERROR_CODE.KMS_TAG_NOT_FOUND.message);
    return this.toResponse(entity);
  }

  async getTagTree(entityId: string): Promise<KmsTagResponse[]> {
    const roots = await this.tagRepository.find({
      where: { entId: entityId, tagParentId: IsNull() },
      relations: ['children', 'children.children'],
      order: { tagLevel: 'ASC', tagName: 'ASC' },
    });
    return roots.map((r) => this.toResponse(r));
  }

  async searchTags(entityId: string, query: string, limit = 10): Promise<KmsTagResponse[]> {
    const entities = await this.tagRepository.find({
      where: { entId: entityId, tagName: ILike(`%${query.toLowerCase()}%`) },
      take: limit,
      order: { tagUsageCount: 'DESC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async autocomplete(entityId: string, prefix: string, limit = 8): Promise<KmsTagResponse[]> {
    const entities = await this.tagRepository.find({
      where: { entId: entityId, tagName: ILike(`${prefix.toLowerCase()}%`) },
      take: limit,
      order: { tagUsageCount: 'DESC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async updateTag(id: string, data: Partial<{
    name: string;
    nameLocal: string;
    level: number;
    parentId: string;
    color: string;
  }>): Promise<KmsTagResponse> {
    const entity = await this.tagRepository.findOne({ where: { tagId: id } });
    if (!entity) throw new NotFoundException(ERROR_CODE.KMS_TAG_NOT_FOUND.message);

    if (data.name !== undefined) {
      entity.tagName = data.name.toLowerCase().trim();
      entity.tagDisplay = data.name.trim();
    }
    if (data.nameLocal !== undefined) entity.tagNameLocal = data.nameLocal;
    if (data.level !== undefined) entity.tagLevel = data.level;
    if (data.parentId !== undefined) entity.tagParentId = data.parentId;
    if (data.color !== undefined) entity.tagColor = data.color;

    const saved = await this.tagRepository.save(entity);
    return this.toResponse(saved);
  }

  async deleteTag(id: string): Promise<void> {
    const entity = await this.tagRepository.findOne({ where: { tagId: id } });
    if (!entity) throw new NotFoundException(ERROR_CODE.KMS_TAG_NOT_FOUND.message);
    await this.tagRepository.remove(entity);
  }

  async incrementUsageCount(tagId: string): Promise<void> {
    await this.tagRepository.increment({ tagId }, 'tagUsageCount', 1);
  }

  async findOrCreateTag(entityId: string, name: string, level = 2): Promise<KmsTagEntity> {
    const normalized = name.toLowerCase().trim();
    let tag = await this.tagRepository.findOne({
      where: { entId: entityId, tagName: normalized },
    });

    if (!tag) {
      tag = this.tagRepository.create({
        entId: entityId,
        tagName: normalized,
        tagDisplay: name.trim(),
        tagLevel: level,
      } as Partial<KmsTagEntity>) as KmsTagEntity;
      tag = await this.tagRepository.save(tag) as KmsTagEntity;
    }

    return tag;
  }

  private toResponse(entity: KmsTagEntity): KmsTagResponse {
    return {
      tagId: entity.tagId,
      entityId: entity.entId,
      name: entity.tagName,
      display: entity.tagDisplay,
      nameLocal: entity.tagNameLocal || null,
      level: entity.tagLevel as TagLevel,
      parentId: entity.tagParentId || null,
      color: entity.tagColor || null,
      isSystem: entity.tagIsSystem,
      usageCount: entity.tagUsageCount,
      children: entity.children?.map((c) => this.toResponse(c)),
      createdAt: entity.tagCreatedAt?.toISOString(),
      updatedAt: entity.tagUpdatedAt?.toISOString(),
    };
  }
}
