import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, IsNull } from 'typeorm';
import { UnitEntity } from '../entity/unit.entity';
import { CreateUnitRequest } from '../dto/request/create-unit.request';
import { UpdateUnitRequest } from '../dto/request/update-unit.request';
import { UnitMapper } from '../mapper/unit.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { BusinessException } from '../../../global/filter/business.exception';
import { UnitResponse } from '@amb/types';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
  ) {}

  async getUnitTree(entityId: string): Promise<UnitResponse[]> {
    const roots = await this.unitRepository.find({
      where: { entId: entityId, untParentId: IsNull() },
      relations: ['children', 'children.children'],
      order: { untSortOrder: 'ASC', untName: 'ASC' },
    });

    return roots.map(UnitMapper.toResponse);
  }

  async getAllUnits(entityId: string): Promise<UnitResponse[]> {
    const units = await this.unitRepository.find({
      where: { entId: entityId },
      order: { untLevel: 'ASC', untSortOrder: 'ASC', untName: 'ASC' },
    });

    return units.map(UnitMapper.toResponse);
  }

  async getUnitById(id: string): Promise<UnitResponse> {
    const entity = await this.unitRepository.findOne({
      where: { untId: id },
      relations: ['children'],
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.DEPARTMENT_NOT_FOUND.message);
    }

    return UnitMapper.toResponse(entity);
  }

  async createUnit(
    dto: CreateUnitRequest,
    entityId: string,
  ): Promise<UnitResponse> {
    // Check duplicate name within entity
    const existing = await this.unitRepository.findOne({
      where: { entId: entityId, untName: dto.name },
    });
    if (existing) {
      throw new BusinessException(ERROR_CODE.DEPARTMENT_DUPLICATE_NAME.code, ERROR_CODE.DEPARTMENT_DUPLICATE_NAME.message);
    }

    // Determine level from parent
    let level = dto.level || 1;
    if (dto.parent_id) {
      const parent = await this.unitRepository.findOne({
        where: { untId: dto.parent_id },
      });
      if (!parent) {
        throw new NotFoundException(ERROR_CODE.DEPARTMENT_NOT_FOUND.message);
      }
      level = parent.untLevel + 1;
    }

    const entity = this.unitRepository.create({
      entId: entityId,
      untName: dto.name,
      untNameLocal: dto.name_local || undefined,
      untParentId: dto.parent_id || undefined,
      untLevel: level,
      untIsActive: dto.is_active !== undefined ? dto.is_active : true,
      untSortOrder: dto.sort_order || 0,
    } as DeepPartial<UnitEntity>);

    const saved: UnitEntity = await this.unitRepository.save(entity as UnitEntity);
    return UnitMapper.toResponse(saved);
  }

  async updateUnit(
    id: string,
    dto: UpdateUnitRequest,
  ): Promise<UnitResponse> {
    const entity = await this.unitRepository.findOne({
      where: { untId: id },
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.DEPARTMENT_NOT_FOUND.message);
    }

    if (dto.name !== undefined) entity.untName = dto.name;
    if (dto.name_local !== undefined) entity.untNameLocal = dto.name_local;
    if (dto.parent_id !== undefined) entity.untParentId = dto.parent_id;
    if (dto.level !== undefined) entity.untLevel = dto.level;
    if (dto.is_active !== undefined) entity.untIsActive = dto.is_active;
    if (dto.sort_order !== undefined) entity.untSortOrder = dto.sort_order;

    const saved = await this.unitRepository.save(entity);
    return UnitMapper.toResponse(saved);
  }

  async deleteUnit(id: string): Promise<void> {
    const entity = await this.unitRepository.findOne({
      where: { untId: id },
      relations: ['children'],
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.DEPARTMENT_NOT_FOUND.message);
    }

    if (entity.untName === 'Holding') {
      throw new BusinessException(
        'E19010',
        'Cannot delete the Holding unit. It is a system-reserved unit.',
      );
    }

    if (entity.children && entity.children.length > 0) {
      throw new BusinessException(ERROR_CODE.DEPARTMENT_HAS_CHILDREN.code, ERROR_CODE.DEPARTMENT_HAS_CHILDREN.message);
    }

    await this.unitRepository.remove(entity);
  }

  async findByEntityId(entityId: string): Promise<UnitEntity[]> {
    return this.unitRepository.find({
      where: { entId: entityId, untIsActive: true },
      order: { untLevel: 'ASC', untSortOrder: 'ASC' },
    });
  }
}
