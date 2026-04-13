import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../auth/entity/user.entity';
import { UserCellEntity } from '../entity/user-cell.entity';
import { CellEntity } from '../entity/cell.entity';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { UnitEntity } from '../../unit/entity/unit.entity';
import { EmployeeEntity } from '../../hr/entity/employee.entity';
import { SvcClientEntity } from '../../service-management/entity/client.entity';
import { MemberMapper } from '../mapper/member.mapper';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { BCRYPT_SALT_ROUNDS } from '@amb/common';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userCellRepository: Repository<UserCellEntity>,
    @InjectRepository(CellEntity)
    private readonly cellRepository: Repository<CellEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly entityUserRoleRepository: Repository<EntityUserRoleEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly hrEntityRepository: Repository<HrEntityEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly userDeptRoleRepository: Repository<UserUnitRoleEntity>,
    @InjectRepository(UnitEntity)
    private readonly departmentRepository: Repository<UnitEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(SvcClientEntity)
    private readonly clientRepository: Repository<SvcClientEntity>,
  ) {}

  async findAll(entityId?: string) {
    let userIds: string[] | null = null;

    // 법인 필터링: 해당 법인에 소속된 사용자만 조회
    if (entityId) {
      const entityUserRoles = await this.entityUserRoleRepository.find({
        where: { entId: entityId, eurStatus: 'ACTIVE' },
        select: ['usrId'],
      });

      const companyUsers = await this.userRepository.find({
        where: { usrCompanyId: entityId, usrDeletedAt: IsNull() },
        select: ['usrId'],
      });

      const clients = await this.clientRepository.find({
        where: { cliEntId: entityId, cliDeletedAt: IsNull() },
        select: ['cliId'],
      });

      let clientUsers: Pick<UserEntity, 'usrId'>[] = [];
      if (clients.length > 0) {
        const clientIds = clients.map((c) => c.cliId);
        clientUsers = await this.userRepository.find({
          where: clientIds.map((cliId) => ({
            usrCliId: cliId,
            usrLevelCode: 'CLIENT_LEVEL',
            usrDeletedAt: IsNull(),
          })),
          select: ['usrId'],
        });
      }

      userIds = [
        ...new Set([
          ...entityUserRoles.map((eur) => eur.usrId),
          ...companyUsers.map((user) => user.usrId),
          ...clientUsers.map((user) => user.usrId),
        ]),
      ];

      if (userIds.length === 0) return [];
    }

    const users = await this.userRepository.find({
      where: { usrStatus: 'ACTIVE' },
      order: { usrCreatedAt: 'DESC' },
    });

    const filteredUsers = userIds ? users.filter((u) => userIds!.includes(u.usrId)) : users;

    const userCells = await this.userCellRepository.find();
    const groups = await this.cellRepository.find();
    const groupMap = new Map(groups.map((g) => [g.celId, g.celName]));

    return filteredUsers.map((user) => {
      const userCellEntries = userCells
        .filter((ug) => ug.usrId === user.usrId)
        .map((ug) => ({
          cellId: ug.celId,
          name: groupMap.get(ug.celId) || 'Unknown',
        }));
      return MemberMapper.toResponse(user, userCellEntries);
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({ where: { usrId: id } });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const userCells = await this.userCellRepository.find({
      where: { usrId: id },
    });
    const cellIds = userCells.map((ug) => ug.celId);
    let cellEntries: { cellId: string; name: string }[] = [];
    let memberCells: { cellId: string; name: string; entityCode: string | null; entityName: string | null }[] = [];
    if (cellIds.length > 0) {
      const groups = await this.cellRepository.find({
        where: cellIds.map((cid) => ({ celId: cid })),
        relations: ['hrEntity'],
      });
      cellEntries = groups.map((g) => ({ cellId: g.celId, name: g.celName }));
      memberCells = groups.map((g) => ({
        cellId: g.celId,
        name: g.celName,
        entityCode: g.hrEntity?.entCode || null,
        entityName: g.hrEntity?.entName || null,
      }));
    }

    // 법인 역할 조회
    const entityUserRoles = await this.entityUserRoleRepository.find({
      where: { usrId: id },
      relations: ['hrEntity'],
    });
    const entityRoles = entityUserRoles.map((eur) => ({
      eurId: eur.eurId,
      entityId: eur.entId,
      entityCode: eur.hrEntity?.entCode || '',
      entityName: eur.hrEntity?.entName || '',
      role: eur.eurRole,
      status: eur.eurStatus,
    }));

    // 유닛 역할 조회
    const userDeptRoles = await this.userDeptRoleRepository.find({
      where: { usrId: id },
      relations: ['unit', 'unit.hrEntity'],
    });
    const unitRoles = userDeptRoles.map((udr) => ({
      uurId: udr.uurId,
      unitId: udr.untId,
      unitName: udr.unit?.untName || '',
      role: udr.uurRole,
      isPrimary: udr.uurIsPrimary,
      entityCode: udr.unit?.hrEntity?.entCode || '',
      entityName: udr.unit?.hrEntity?.entName || '',
    }));

    // HR 직원 연결 조회 (usr_id 기반)
    const employees = await this.employeeRepository.find({
      where: { usrId: id },
      relations: ['hrEntity'],
    });
    const hrEmployees = employees.map((emp) => ({
      employeeId: emp.empId,
      entityCode: emp.hrEntity?.entCode || '',
      employeeCode: emp.empCode,
      fullName: emp.empFullName,
      department: emp.empDepartment,
      position: emp.empPosition,
      status: emp.empStatus,
    }));

    return MemberMapper.toDetailResponse(user, cellEntries, entityRoles, unitRoles, hrEmployees, memberCells);
  }

  async updateRole(id: string, role: string) {
    const user = await this.userRepository.findOne({ where: { usrId: id } });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }
    user.usrRole = role;
    const saved = await this.userRepository.save(user);

    const userCells = await this.userCellRepository.find({
      where: { usrId: id },
    });
    const cellIds = userCells.map((ug) => ug.celId);
    let cellEntries: { cellId: string; name: string }[] = [];
    if (cellIds.length > 0) {
      const groups = await this.cellRepository.findByIds(cellIds);
      cellEntries = groups.map((g) => ({ cellId: g.celId, name: g.celName }));
    }

    return MemberMapper.toResponse(saved, cellEntries);
  }

  async updateCompanyEmail(id: string, companyEmail: string | null) {
    const user = await this.userRepository.findOne({ where: { usrId: id } });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    if (companyEmail) {
      const existing = await this.userRepository.findOne({
        where: { usrCompanyEmail: companyEmail },
      });
      if (existing && existing.usrId !== id) {
        throw new BusinessException(
          'E2013',
          'Company email already in use by another user',
          HttpStatus.CONFLICT,
        );
      }
    }

    user.usrCompanyEmail = companyEmail || (null as any);
    const saved = await this.userRepository.save(user);

    return {
      userId: saved.usrId,
      companyEmail: saved.usrCompanyEmail,
    };
  }

  async updateName(id: string, name: string) {
    const user = await this.userRepository.findOne({ where: { usrId: id } });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    user.usrName = name;
    const saved = await this.userRepository.save(user);

    const userCells = await this.userCellRepository.find({ where: { usrId: id } });
    const cellIds = userCells.map((ug) => ug.celId);
    let cellEntries: { cellId: string; name: string }[] = [];
    if (cellIds.length > 0) {
      const groups = await this.cellRepository.findByIds(cellIds);
      cellEntries = groups.map((g) => ({ cellId: g.celId, name: g.celName }));
    }

    return MemberMapper.toResponse(saved, cellEntries);
  }

  async updateJobTitle(id: string, jobTitle: string) {
    const user = await this.userRepository.findOne({ where: { usrId: id } });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    user.usrJobTitle = jobTitle;
    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async assignEntityRole(userId: string, entityId: string, role: string) {
    const user = await this.userRepository.findOne({ where: { usrId: userId } });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const entity = await this.hrEntityRepository.findOne({ where: { entId: entityId } });
    if (!entity) {
      throw new BusinessException('E2010', 'Entity not found', HttpStatus.NOT_FOUND);
    }

    // 중복 체크
    const existing = await this.entityUserRoleRepository.findOne({
      where: { entId: entityId, usrId: userId },
    });
    if (existing) {
      throw new BusinessException('E2011', 'Entity role already assigned', HttpStatus.CONFLICT);
    }

    const eur = this.entityUserRoleRepository.create({
      entId: entityId,
      usrId: userId,
      eurRole: role,
      eurStatus: 'ACTIVE',
    });
    const saved = await this.entityUserRoleRepository.save(eur);

    return {
      eurId: saved.eurId,
      entityId: saved.entId,
      entityCode: entity.entCode,
      entityName: entity.entName,
      role: saved.eurRole,
      status: saved.eurStatus,
    };
  }

  async removeEntityRole(userId: string, eurId: string) {
    const eur = await this.entityUserRoleRepository.findOne({
      where: { eurId, usrId: userId },
    });
    if (!eur) {
      throw new BusinessException('E2012', 'Entity role not found', HttpStatus.NOT_FOUND);
    }

    await this.entityUserRoleRepository.remove(eur);
  }

  // ── 승인/거부/상태 관리 ──

  /** 승인 대기 중인 사용자 목록 */
  async findPending() {
    const users = await this.userRepository.find({
      where: { usrStatus: 'PENDING' },
      relations: ['company'],
      order: { usrCreatedAt: 'DESC' },
    });

    return users.map((user) => ({
      userId: user.usrId,
      email: user.usrEmail,
      name: user.usrName,
      role: user.usrRole,
      levelCode: user.usrLevelCode,
      department: user.usrUnit,
      companyId: user.usrCompanyId,
      companyName: user.company?.entName || null,
      joinMethod: user.usrJoinMethod,
      createdAt: user.usrCreatedAt.toISOString(),
    }));
  }

  /** 사용자 승인 */
  async approve(memberId: string, approvedBy: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: memberId, usrStatus: 'PENDING' },
    });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        'Pending user not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    user.usrStatus = 'ACTIVE';
    user.usrApprovedBy = approvedBy;
    user.usrApprovedAt = new Date();
    await this.userRepository.save(user);

    return { success: true, message: 'User approved.' };
  }

  /** 사용자 가입 거부 */
  async reject(memberId: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: memberId, usrStatus: 'PENDING' },
    });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        'Pending user not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    user.usrStatus = 'WITHDRAWN';
    await this.userRepository.save(user);

    return { success: true, message: 'User rejected.' };
  }

  /** 사용자 레벨 코드 변경 (ADMIN_LEVEL | USER_LEVEL) */
  async updateLevelCode(memberId: string, levelCode: string, currentUser: { role: string; level: string }) {
    // ADMIN_LEVEL 또는 SUPER_ADMIN만 변경 가능
    if (currentUser.level !== 'ADMIN_LEVEL' && currentUser.role !== 'SUPER_ADMIN') {
      throw new BusinessException('E1003', 'Only ADMIN_LEVEL or SUPER_ADMIN can change user level', HttpStatus.FORBIDDEN);
    }

    const validLevels = ['ADMIN_LEVEL', 'USER_LEVEL'];
    if (!validLevels.includes(levelCode)) {
      throw new BusinessException('E2014', `Invalid level code: ${levelCode}. Must be one of: ${validLevels.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepository.findOne({ where: { usrId: memberId } });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    user.usrLevelCode = levelCode;
    await this.userRepository.save(user);

    return { success: true, message: `User level changed to ${levelCode}.` };
  }

  /** 사용자 삭제 (soft delete) */
  async deleteMember(memberId: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: memberId },
    });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.userRepository.softRemove(user);

    return { success: true, message: 'User deleted successfully.' };
  }

  /** 관리자 비밀번호 초기화 */
  async resetPassword(memberId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BusinessException('E2015', 'Password must be at least 8 characters', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepository.findOne({ where: { usrId: memberId } });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    user.usrPassword = hashedPassword;
    user.usrMustChangePw = true;
    await this.userRepository.save(user);

    return { success: true, message: 'Password has been reset.' };
  }

  /** 사용자 상태 변경 (ACTIVE, INACTIVE, SUSPENDED 등) */
  async updateStatus(memberId: string, status: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: memberId },
    });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    user.usrStatus = status;
    await this.userRepository.save(user);

    return { success: true, message: `User status changed to ${status}.` };
  }

  /** 계정 잠금 해제 (관리자) */
  async unlockAccount(memberId: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: memberId },
    });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    user.usrFailedLoginCount = 0;
    user.usrLockedUntil = null;
    await this.userRepository.save(user);

    return { success: true, message: 'Account has been unlocked.' };
  }
}
