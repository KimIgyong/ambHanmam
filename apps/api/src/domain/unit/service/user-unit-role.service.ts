import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, IsNull } from 'typeorm';
import { UserUnitRoleEntity } from '../entity/user-unit-role.entity';
import { AssignUserUnitRoleRequest } from '../dto/request/assign-user-unit-role.request';
import { UserUnitRoleMapper } from '../mapper/user-unit-role.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { BusinessException } from '../../../global/filter/business.exception';
import { UserUnitRoleResponse } from '@amb/types';

@Injectable()
export class UserUnitRoleService {
  constructor(
    @InjectRepository(UserUnitRoleEntity)
    private readonly udrRepository: Repository<UserUnitRoleEntity>,
  ) {}

  async assignRole(dto: AssignUserUnitRoleRequest): Promise<UserUnitRoleResponse> {
    // Check duplicate active assignment
    const existing = await this.udrRepository.findOne({
      where: {
        usrId: dto.user_id,
        untId: dto.department_id,
        uurEndedAt: IsNull(),
      },
    });

    if (existing) {
      throw new BusinessException(ERROR_CODE.USER_DEPT_ROLE_DUPLICATE.code, ERROR_CODE.USER_DEPT_ROLE_DUPLICATE.message);
    }

    // If setting as primary, unset other primaries
    if (dto.is_primary) {
      await this.udrRepository.update(
        { usrId: dto.user_id, uurIsPrimary: true },
        { uurIsPrimary: false },
      );
    }

    const entity = this.udrRepository.create({
      usrId: dto.user_id,
      untId: dto.department_id,
      uurRole: dto.role || 'MEMBER',
      uurIsPrimary: dto.is_primary || false,
      uurStartedAt: dto.started_at ? new Date(dto.started_at) : new Date(),
      uurEndedAt: dto.ended_at ? new Date(dto.ended_at) : undefined,
    } as DeepPartial<UserUnitRoleEntity>);

    const saved: UserUnitRoleEntity = await this.udrRepository.save(entity as UserUnitRoleEntity);
    return this.getById(saved.uurId);
  }

  async updateRole(id: string, role: string): Promise<UserUnitRoleResponse> {
    const entity = await this.udrRepository.findOne({ where: { uurId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.USER_DEPT_ROLE_NOT_FOUND.message);
    }

    entity.uurRole = role;
    await this.udrRepository.save(entity);
    return this.getById(id);
  }

  async removeRole(id: string): Promise<void> {
    const entity = await this.udrRepository.findOne({ where: { uurId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.USER_DEPT_ROLE_NOT_FOUND.message);
    }

    entity.uurEndedAt = new Date();
    await this.udrRepository.save(entity);
  }

  async getByUnit(unitId: string): Promise<UserUnitRoleResponse[]> {
    const entities = await this.udrRepository.find({
      where: { untId: unitId, uurEndedAt: IsNull() },
      relations: ['user', 'unit'],
      order: { uurRole: 'ASC', uurCreatedAt: 'ASC' },
    });

    return entities.map(UserUnitRoleMapper.toResponse);
  }

  async getByUser(userId: string): Promise<UserUnitRoleResponse[]> {
    const entities = await this.udrRepository.find({
      where: { usrId: userId, uurEndedAt: IsNull() },
      relations: ['user', 'unit'],
    });

    return entities.map(UserUnitRoleMapper.toResponse);
  }

  async getPrimaryUnit(userId: string): Promise<UserUnitRoleEntity | null> {
    // First try primary
    let entity = await this.udrRepository.findOne({
      where: { usrId: userId, uurIsPrimary: true, uurEndedAt: IsNull() },
      relations: ['unit'],
    });

    // Fallback to first active assignment
    if (!entity) {
      entity = await this.udrRepository.findOne({
        where: { usrId: userId, uurEndedAt: IsNull() },
        relations: ['unit'],
        order: { uurCreatedAt: 'ASC' },
      });
    }

    return entity || null;
  }

  private async getById(id: string): Promise<UserUnitRoleResponse> {
    const entity = await this.udrRepository.findOne({
      where: { uurId: id },
      relations: ['user', 'unit'],
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.USER_DEPT_ROLE_NOT_FOUND.message);
    }

    return UserUnitRoleMapper.toResponse(entity);
  }
}
