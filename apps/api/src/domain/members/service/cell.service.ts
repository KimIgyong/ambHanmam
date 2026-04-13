import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CellEntity } from '../entity/cell.entity';
import { UserCellEntity } from '../entity/user-cell.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { CreateCellRequest } from '../dto/request/create-cell.request';
import { UpdateCellRequest } from '../dto/request/update-cell.request';
import { CellMapper } from '../mapper/cell.mapper';
import { MemberMapper } from '../mapper/member.mapper';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class CellService {
  constructor(
    @InjectRepository(CellEntity)
    private readonly cellRepository: Repository<CellEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userCellRepository: Repository<UserCellEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(entityId?: string) {
    const where: any = {};
    if (entityId) where.entId = entityId;

    const groups = await this.cellRepository.find({
      where,
      order: { celCreatedAt: 'DESC' },
      relations: ['hrEntity'],
    });
    const userCells = await this.userCellRepository.find();

    // Collect all user IDs to fetch names
    const allUserIds = [...new Set(userCells.map((ug) => ug.usrId))];
    const users = allUserIds.length > 0
      ? await this.userRepository.findByIds(allUserIds)
      : [];
    const userMap = new Map(users.map((u) => [u.usrId, u.usrName]));

    return groups.map((group) => {
      const groupUserGroups = userCells.filter(
        (ug) => ug.celId === group.celId,
      );
      const memberCount = groupUserGroups.length;
      const members = groupUserGroups.map((ug) => ({
        userId: ug.usrId,
        name: userMap.get(ug.usrId) || 'Unknown',
      }));
      return CellMapper.toResponse(group, memberCount, members);
    });
  }

  async create(dto: CreateCellRequest) {
    const existing = await this.cellRepository.findOne({
      where: { celName: dto.name },
    });
    if (existing) {
      throw new BusinessException(
        ERROR_CODE.GROUP_ALREADY_EXISTS.code,
        ERROR_CODE.GROUP_ALREADY_EXISTS.message,
        HttpStatus.CONFLICT,
      );
    }

    const group = this.cellRepository.create({
      celName: dto.name,
      celDescription: dto.description || null,
      entId: dto.entity_id || null,
    });
    const saved = await this.cellRepository.save(group);
    if (dto.entity_id) {
      const reloaded = await this.cellRepository.findOne({
        where: { celId: saved.celId },
        relations: ['hrEntity'],
      });
      if (reloaded) return CellMapper.toResponse(reloaded, 0);
    }
    return CellMapper.toResponse(saved, 0);
  }

  async update(id: string, dto: UpdateCellRequest) {
    const group = await this.cellRepository.findOne({
      where: { celId: id },
    });
    if (!group) {
      throw new BusinessException(
        ERROR_CODE.GROUP_NOT_FOUND.code,
        ERROR_CODE.GROUP_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.name && dto.name !== group.celName) {
      const duplicate = await this.cellRepository.findOne({
        where: { celName: dto.name },
      });
      if (duplicate) {
        throw new BusinessException(
          ERROR_CODE.GROUP_ALREADY_EXISTS.code,
          ERROR_CODE.GROUP_ALREADY_EXISTS.message,
          HttpStatus.CONFLICT,
        );
      }
      group.celName = dto.name;
    }
    if (dto.description !== undefined) {
      group.celDescription = dto.description || null;
    }
    if (dto.entity_id !== undefined) {
      group.entId = dto.entity_id || null;
    }

    await this.cellRepository.save(group);
    const memberCount = await this.userCellRepository.count({
      where: { celId: id },
    });
    const reloaded = await this.cellRepository.findOne({
      where: { celId: id },
      relations: ['hrEntity'],
    });
    return CellMapper.toResponse(reloaded!, memberCount);
  }

  async remove(id: string) {
    const group = await this.cellRepository.findOne({
      where: { celId: id },
    });
    if (!group) {
      throw new BusinessException(
        ERROR_CODE.GROUP_NOT_FOUND.code,
        ERROR_CODE.GROUP_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    // Remove all user-cell associations
    await this.userCellRepository.delete({ celId: id });
    await this.cellRepository.softRemove(group);
    return { success: true };
  }

  async addMember(cellId: string, userId: string) {
    const group = await this.cellRepository.findOne({
      where: { celId: cellId },
    });
    if (!group) {
      throw new BusinessException(
        ERROR_CODE.GROUP_NOT_FOUND.code,
        ERROR_CODE.GROUP_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const user = await this.userRepository.findOne({
      where: { usrId: userId },
    });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.userCellRepository.findOne({
      where: { usrId: userId, celId: cellId },
    });
    if (existing) {
      throw new BusinessException(
        ERROR_CODE.GROUP_MEMBER_ALREADY_EXISTS.code,
        ERROR_CODE.GROUP_MEMBER_ALREADY_EXISTS.message,
        HttpStatus.CONFLICT,
      );
    }

    const userCell = this.userCellRepository.create({
      usrId: userId,
      celId: cellId,
    });
    await this.userCellRepository.save(userCell);
    return { success: true };
  }

  async removeMember(cellId: string, userId: string) {
    const userCell = await this.userCellRepository.findOne({
      where: { usrId: userId, celId: cellId },
    });
    if (!userCell) {
      throw new BusinessException(
        ERROR_CODE.GROUP_MEMBER_NOT_FOUND.code,
        ERROR_CODE.GROUP_MEMBER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.userCellRepository.remove(userCell);
    return { success: true };
  }

  async getMembers(cellId: string) {
    const group = await this.cellRepository.findOne({
      where: { celId: cellId },
    });
    if (!group) {
      throw new BusinessException(
        ERROR_CODE.GROUP_NOT_FOUND.code,
        ERROR_CODE.GROUP_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const userCells = await this.userCellRepository.find({
      where: { celId: cellId },
    });
    const userIds = userCells.map((ug) => ug.usrId);
    if (userIds.length === 0) return [];

    const users = await this.userRepository.findByIds(userIds);
    return users.map((user) => MemberMapper.toResponse(user, [
      { cellId: group.celId, name: group.celName },
    ]));
  }
}
