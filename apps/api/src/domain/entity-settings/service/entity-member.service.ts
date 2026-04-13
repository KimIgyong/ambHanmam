import {
  Injectable, Logger, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserEntity } from '../../auth/entity/user.entity';
import { InvitationEntity } from '../../invitation/entity/invitation.entity';
import { InvitationService } from '../../invitation/service/invitation.service';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';
import { UnitEntity } from '../../unit/entity/unit.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { UserCellEntity } from '../../members/entity/user-cell.entity';
import { EmployeeEntity } from '../../hr/entity/employee.entity';
import { SvcClientEntity } from '../../service-management/entity/client.entity';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { InviteEntityMemberRequest } from '../dto/invite-entity-member.request';
import { UpdateEntityMemberRequest } from '../dto/update-entity-member.request';
import { MailService } from '../../../infrastructure/external/mail/mail.service';

const MASTER_ASSIGNABLE_ROLES = ['MANAGER', 'MEMBER', 'VIEWER'];
const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class EntityMemberService {
  private readonly logger = new Logger(EntityMemberService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(InvitationEntity)
    private readonly invitationRepo: Repository<InvitationEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepo: Repository<UnitEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly userUnitRoleRepo: Repository<UserUnitRoleEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userCellRepo: Repository<UserCellEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly entityUserRoleRepo: Repository<EntityUserRoleEntity>,
    @InjectRepository(SvcClientEntity)
    private readonly clientRepo: Repository<SvcClientEntity>,
    private readonly invitationService: InvitationService,
    private readonly mailService: MailService,
  ) {}

  /**
   * 법인 멤버 목록 조회
   * EntityUserRoleEntity 기반으로 조회 (usrCompanyId 또는 EntityUserRole ACTIVE)
   */
  async findMembers(entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    // EntityUserRoleEntity에서 ACTIVE 멤버 ID 조회
    const entityRoles = await this.entityUserRoleRepo.find({
      where: { entId: entityId, eurStatus: 'ACTIVE' },
      select: ['usrId'],
    });
    const roleUserIds = entityRoles.map((r) => r.usrId);

    // usrCompanyId 기반 멤버도 포함 (기존 데이터 호환)
    const companyMembers = await this.userRepo.find({
      where: { usrCompanyId: entityId, usrDeletedAt: undefined },
      select: ['usrId'],
    });
    const companyUserIds = companyMembers.map((m) => m.usrId);

    // 고객사(amb_svc_clients.cli_ent_id)로 연결된 CLIENT_LEVEL 멤버 포함
    const clients = await this.clientRepo.find({
      where: { cliEntId: entityId, cliDeletedAt: IsNull() },
      select: ['cliId'],
    });
    const clientIds = clients.map((c) => c.cliId);
    let clientUserIds: string[] = [];
    if (clientIds.length > 0) {
      const clientUsers = await this.userRepo.find({
        where: clientIds.map((cliId) => ({
          usrCliId: cliId,
          usrLevelCode: 'CLIENT_LEVEL',
          usrDeletedAt: undefined,
        })),
        select: ['usrId'],
      });
      clientUserIds = clientUsers.map((u) => u.usrId);
    }

    // 합집합 (중복 제거)
    const allUserIds = [...new Set([...roleUserIds, ...companyUserIds, ...clientUserIds])];

    if (allUserIds.length === 0) {
      return [];
    }

    const members = await this.userRepo.find({
      where: allUserIds.map((id) => ({ usrId: id, usrDeletedAt: undefined })),
      select: [
        'usrId', 'usrEmail', 'usrName', 'usrRole', 'usrUnit',
        'usrLevelCode', 'usrStatus', 'usrJoinMethod', 'usrCreatedAt', 'usrCliId',
      ],
      order: { usrCreatedAt: 'DESC' },
    });

    // Fetch unit roles and cells for all members
    const memberIds = members.map((m) => m.usrId);
    let unitRolesMap = new Map<string, { unitId: string; unitName: string; role: string; isPrimary: boolean }[]>();
    let cellsMap = new Map<string, { cellId: string; cellName: string }[]>();
    const hrEmployeeMap = new Map<string, { employeeId: string; employeeCode: string; fullName: string; department: string; position: string; status: string }>();

    if (memberIds.length > 0) {
      const unitRoles = await this.userUnitRoleRepo
        .createQueryBuilder('uur')
        .innerJoinAndSelect('uur.unit', 'unit')
        .where('uur.usrId IN (:...ids)', { ids: memberIds })
        .andWhere('uur.uurEndedAt IS NULL')
        .andWhere('unit.entId = :entityId', { entityId })
        .getMany();

      for (const ur of unitRoles) {
        const list = unitRolesMap.get(ur.usrId) || [];
        list.push({
          unitId: ur.untId,
          unitName: ur.unit?.untName || '',
          role: ur.uurRole,
          isPrimary: ur.uurIsPrimary,
        });
        unitRolesMap.set(ur.usrId, list);
      }

      const userCells = await this.userCellRepo
        .createQueryBuilder('uc')
        .innerJoin('amb_cells', 'c', 'c.cel_id = uc.celId')
        .addSelect('c.cel_name', 'cellName')
        .where('uc.usrId IN (:...ids)', { ids: memberIds })
        .getRawMany();

      for (const uc of userCells) {
        const list = cellsMap.get(uc.uc_usr_id) || [];
        list.push({ cellId: uc.uc_cel_id, cellName: uc.cellName });
        cellsMap.set(uc.uc_usr_id, list);
      }

      // Fetch HR employee info for all members
      const employees = await this.employeeRepo.find({
        where: memberIds.map((id) => ({ usrId: id, entId: entityId })),
        select: ['empId', 'empCode', 'empFullName', 'empDepartment', 'empPosition', 'empStatus', 'usrId'],
      });

      for (const emp of employees) {
        if (emp.usrId) {
          hrEmployeeMap.set(emp.usrId, {
            employeeId: emp.empId,
            employeeCode: emp.empCode,
            fullName: emp.empFullName,
            department: emp.empDepartment,
            position: emp.empPosition,
            status: emp.empStatus,
          });
        }
      }
    }

    // Fetch client info for CLIENT_LEVEL members
    const clientMembers = members.filter((m) => m.usrLevelCode === 'CLIENT_LEVEL' && m.usrCliId);
    const clientInfoMap = new Map<string, { clientId: string; clientCode: string; clientName: string; clientStatus: string }>();
    if (clientMembers.length > 0) {
      const clientIds = [...new Set(clientMembers.map((m) => m.usrCliId).filter(Boolean))] as string[];
      if (clientIds.length > 0) {
        const clients = await this.clientRepo.find({
          where: clientIds.map((id) => ({ cliId: id })),
          select: ['cliId', 'cliCode', 'cliCompanyName', 'cliStatus'],
        });
        for (const cli of clients) {
          clientInfoMap.set(cli.cliId, {
            clientId: cli.cliId,
            clientCode: cli.cliCode,
            clientName: cli.cliCompanyName,
            clientStatus: cli.cliStatus,
          });
        }
      }
    }

    return members.map((m) => ({
      userId: m.usrId,
      email: m.usrEmail,
      name: m.usrName,
      role: m.usrRole,
      unit: m.usrUnit,
      levelCode: m.usrLevelCode,
      status: m.usrStatus,
      joinMethod: m.usrJoinMethod,
      createdAt: m.usrCreatedAt,
      unitRoles: unitRolesMap.get(m.usrId) || [],
      cells: cellsMap.get(m.usrId) || [],
      hrEmployee: hrEmployeeMap.get(m.usrId) || null,
      clientInfo: m.usrCliId ? clientInfoMap.get(m.usrCliId) || null : null,
    }));
  }

  /**
   * 법인 멤버 초대
   */
  async inviteMember(dto: InviteEntityMemberRequest, user: UserPayload) {
    let companyId = dto.company_id;
    let role = dto.role;
    const isPartnerInvite = dto.level_code === 'PARTNER_LEVEL';

    if (user.level === 'ADMIN_LEVEL') {
      if (isPartnerInvite) {
        // ADMIN의 파트너 초대: partner_id 필수, company_id 불필요
        if (!dto.partner_id) {
          throw new BadRequestException('partner_id is required for partner invitations');
        }
        if (!['PARTNER_ADMIN', 'PARTNER_MEMBER'].includes(role)) {
          throw new BadRequestException('Partner invitations only allow PARTNER_ADMIN or PARTNER_MEMBER roles');
        }
      } else {
        // ADMIN의 일반 USER_LEVEL 초대
        if (!companyId) {
          throw new BadRequestException('company_id is required for admin invitations');
        }
      }
    } else {
      // MASTER: 파트너 초대 불가, 자신의 법인만, 하위 역할만
      if (isPartnerInvite) {
        throw new ForbiddenException('Only ADMIN can create partner-level invitations');
      }
      companyId = user.companyId;
      if (!MASTER_ASSIGNABLE_ROLES.includes(role)) {
        throw new ForbiddenException('MASTER can only assign MANAGER, MEMBER, or VIEWER roles');
      }
    }

    // 기존 InvitationService 재사용
    return this.invitationService.create(
      {
        email: dto.email,
        role,
        department: dto.department,
        group_id: dto.group_id,
        level_code: isPartnerInvite ? 'PARTNER_LEVEL' : 'USER_LEVEL',
        company_id: isPartnerInvite ? undefined : companyId,
        partner_id: isPartnerInvite ? dto.partner_id : undefined,
        auto_approve: dto.auto_approve ?? true,
      },
      user.userId,
    );
  }

  /**
   * 법인 초대 목록 조회
   * 이미 활성 멤버인 사용자의 PENDING 초대는 자동 수락 처리
   */
  async findInvitations(entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const invitations = await this.invitationRepo.find({
      where: { invCompanyId: entityId },
      order: { invCreatedAt: 'DESC' },
    });

    // PENDING 초대 중 이미 활성 멤버인 것들을 자동 ACCEPTED 처리
    const pendingInvitations = invitations.filter((inv) => inv.invStatus === 'PENDING');
    if (pendingInvitations.length > 0) {
      const pendingEmails = pendingInvitations.map((inv) => inv.invEmail);

      // 이미 EntityUserRole에 ACTIVE로 등록된 사용자 이메일 확인
      const activeRoles = await this.entityUserRoleRepo.find({
        where: { entId: entityId, eurStatus: 'ACTIVE' },
        select: ['usrId'],
      });
      if (activeRoles.length > 0) {
        const activeUsers = await this.userRepo.find({
          where: activeRoles.map((r) => ({ usrId: r.usrId })),
          select: ['usrId', 'usrEmail'],
        });
        const activeEmailSet = new Set(activeUsers.map((u) => u.usrEmail.toLowerCase()));

        for (const inv of pendingInvitations) {
          if (activeEmailSet.has(inv.invEmail.toLowerCase())) {
            inv.invStatus = 'ACCEPTED';
            inv.invAcceptedAt = new Date();
            await this.invitationRepo.save(inv);
          }
        }
      }
    }

    return invitations.map((inv) => ({
      id: inv.invId,
      email: inv.invEmail,
      role: inv.invRole,
      unit: inv.invUnit,
      status: inv.invStatus,
      expiresAt: inv.invExpiresAt,
      createdAt: inv.invCreatedAt,
    }));
  }

  /**
   * 초대 취소
   */
  async cancelInvitation(invId: string, entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const invitation = await this.invitationRepo.findOne({
      where: { invId, invCompanyId: entityId, invStatus: 'PENDING' },
    });
    if (!invitation) {
      throw new BadRequestException('Invitation not found or not cancellable');
    }

    invitation.invStatus = 'CANCELLED';
    await this.invitationRepo.save(invitation);

    return { id: invId, status: 'CANCELLED' };
  }

  /**
   * 초대 재발송
   */
  async resendInvitation(invId: string, entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const invitation = await this.invitationRepo.findOne({
      where: { invId, invCompanyId: entityId, invStatus: 'PENDING' },
    });
    if (!invitation) {
      throw new BadRequestException('Invitation not found or not resendable');
    }

    return this.invitationService.resend(invId);
  }

  /**
   * 법인 멤버 정보 수정
   */
  async updateMember(
    memberId: string,
    entityId: string,
    dto: UpdateEntityMemberRequest,
    user: UserPayload,
  ) {
    this.ensureEntityAccess(entityId, user);

    const member = await this.userRepo.findOne({
      where: { usrId: memberId, usrCompanyId: entityId },
    });
    if (!member) {
      throw new BadRequestException('Member not found in this entity');
    }

    // MASTER 권한 제한 (ADMIN_LEVEL은 모든 역할 변경 가능)
    if (user.level !== 'ADMIN_LEVEL') {
      if (member.usrRole === 'MASTER' && dto.role && dto.role !== 'MASTER') {
        throw new ForbiddenException('Cannot change role of another MASTER');
      }
      if (dto.role && !MASTER_ASSIGNABLE_ROLES.includes(dto.role)) {
        throw new ForbiddenException('MASTER can only assign MANAGER, MEMBER, or VIEWER roles');
      }
    }

    if (dto.role !== undefined) member.usrRole = dto.role;
    if (dto.department !== undefined) member.usrUnit = dto.department;
    if (dto.status !== undefined) member.usrStatus = dto.status;

    await this.userRepo.save(member);

    return {
      userId: member.usrId,
      email: member.usrEmail,
      name: member.usrName,
      role: member.usrRole,
      unit: member.usrUnit,
      levelCode: member.usrLevelCode,
      status: member.usrStatus,
      joinMethod: member.usrJoinMethod,
      createdAt: member.usrCreatedAt,
    };
  }

  /**
   * 멤버 Unit 변경
   */
  async changeMemberUnit(
    memberId: string,
    entityId: string,
    unitId: string,
    user: UserPayload,
  ) {
    this.ensureEntityAccess(entityId, user);

    const member = await this.userRepo.findOne({
      where: { usrId: memberId, usrCompanyId: entityId },
    });
    if (!member) {
      throw new BadRequestException('Member not found in this entity');
    }

    // Verify the unit belongs to this entity
    const unit = await this.unitRepo.findOne({
      where: { untId: unitId, entId: entityId },
    });
    if (!unit) {
      throw new BadRequestException('Unit not found in this entity');
    }

    // End all current active unit roles for this entity
    const currentRoles = await this.userUnitRoleRepo
      .createQueryBuilder('uur')
      .innerJoin('uur.unit', 'unit')
      .where('uur.usrId = :usrId', { usrId: memberId })
      .andWhere('uur.uurEndedAt IS NULL')
      .andWhere('unit.entId = :entityId', { entityId })
      .getMany();

    for (const role of currentRoles) {
      role.uurEndedAt = new Date();
      role.uurIsPrimary = false;
      await this.userUnitRoleRepo.save(role);
    }

    // Create new assignment
    const newRole = this.userUnitRoleRepo.create({
      usrId: memberId,
      untId: unitId,
      uurRole: 'MEMBER',
      uurIsPrimary: true,
      uurStartedAt: new Date(),
    });
    await this.userUnitRoleRepo.save(newRole);

    // Sync usrUnit field
    member.usrUnit = unit.untName;
    await this.userRepo.save(member);

    return { success: true, unitId, unitName: unit.untName };
  }

  /**
   * 멤버 Cell 추가
   */
  async addMemberCell(
    memberId: string,
    entityId: string,
    cellId: string,
    user: UserPayload,
  ) {
    this.ensureEntityAccess(entityId, user);

    const member = await this.userRepo.findOne({
      where: { usrId: memberId, usrCompanyId: entityId },
    });
    if (!member) {
      throw new BadRequestException('Member not found in this entity');
    }

    // Check if already assigned
    const existing = await this.userCellRepo.findOne({
      where: { usrId: memberId, celId: cellId },
    });
    if (existing) {
      throw new BadRequestException('Member is already assigned to this cell');
    }

    const userCell = this.userCellRepo.create({
      usrId: memberId,
      celId: cellId,
    });
    await this.userCellRepo.save(userCell);

    return { success: true, cellId };
  }

  /**
   * 멤버 Cell 제거
   */
  async removeMemberCell(
    memberId: string,
    entityId: string,
    cellId: string,
    user: UserPayload,
  ) {
    this.ensureEntityAccess(entityId, user);

    const member = await this.userRepo.findOne({
      where: { usrId: memberId, usrCompanyId: entityId },
    });
    if (!member) {
      throw new BadRequestException('Member not found in this entity');
    }

    const userCell = await this.userCellRepo.findOne({
      where: { usrId: memberId, celId: cellId },
    });
    if (!userCell) {
      throw new BadRequestException('Member is not assigned to this cell');
    }

    await this.userCellRepo.remove(userCell);

    return { success: true };
  }

  /**
   * 연결 가능한 HR 직원 목록 조회 (usrId가 NULL인 직원)
   */
  async findAvailableEmployees(entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const employees = await this.employeeRepo.find({
      where: { entId: entityId, usrId: IsNull() },
      select: ['empId', 'empCode', 'empFullName', 'empDepartment', 'empPosition', 'empStatus'],
      order: { empCode: 'ASC' },
    });

    return employees.map((emp) => ({
      employeeId: emp.empId,
      employeeCode: emp.empCode,
      fullName: emp.empFullName,
      department: emp.empDepartment,
      position: emp.empPosition,
      status: emp.empStatus,
    }));
  }

  /**
   * HR 직원 연결
   */
  async linkEmployee(
    memberId: string,
    entityId: string,
    employeeId: string,
    user: UserPayload,
  ) {
    this.ensureEntityAccess(entityId, user);

    const member = await this.userRepo.findOne({
      where: { usrId: memberId, usrCompanyId: entityId },
    });
    if (!member) {
      throw new BadRequestException('Member not found in this entity');
    }

    const employee = await this.employeeRepo.findOne({
      where: { empId: employeeId, entId: entityId },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found in this entity');
    }

    if (employee.usrId) {
      throw new BadRequestException('Employee is already linked to another user');
    }

    // Check if member already has an employee linked
    const existingLink = await this.employeeRepo.findOne({
      where: { usrId: memberId, entId: entityId },
    });
    if (existingLink) {
      throw new BadRequestException('Member already has an HR employee linked');
    }

    employee.usrId = memberId;
    await this.employeeRepo.save(employee);

    return {
      employeeId: employee.empId,
      employeeCode: employee.empCode,
      fullName: employee.empFullName,
      department: employee.empDepartment,
      position: employee.empPosition,
      status: employee.empStatus,
    };
  }

  /**
   * HR 직원 연결 해제
   */
  async unlinkEmployee(
    memberId: string,
    entityId: string,
    user: UserPayload,
  ) {
    this.ensureEntityAccess(entityId, user);

    const member = await this.userRepo.findOne({
      where: { usrId: memberId, usrCompanyId: entityId },
    });
    if (!member) {
      throw new BadRequestException('Member not found in this entity');
    }

    const employee = await this.employeeRepo.findOne({
      where: { usrId: memberId, entId: entityId },
    });
    if (!employee) {
      throw new BadRequestException('No HR employee linked to this member');
    }

    employee.usrId = null;
    await this.employeeRepo.save(employee);

    return { success: true };
  }

  /**
   * 법인 멤버 삭제 (soft delete)
   */
  async removeMember(memberId: string, entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const member = await this.userRepo.findOne({
      where: { usrId: memberId, usrCompanyId: entityId },
    });
    if (!member) {
      throw new BadRequestException('Member not found in this entity');
    }

    // 자기 자신 삭제 방지
    if (memberId === user.userId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    // MASTER는 다른 MASTER 삭제 불가
    if (user.level !== 'ADMIN_LEVEL' && member.usrRole === 'MASTER') {
      throw new ForbiddenException('Cannot remove a MASTER member');
    }

    // Soft delete
    member.usrDeletedAt = new Date();
    member.usrStatus = 'INACTIVE';
    await this.userRepo.save(member);

    // HR 직원 연결 해제
    const employee = await this.employeeRepo.findOne({
      where: { usrId: memberId, entId: entityId },
    });
    if (employee) {
      employee.usrId = null;
      await this.employeeRepo.save(employee);
    }

    // Unit role 종료
    const activeRoles = await this.userUnitRoleRepo
      .createQueryBuilder('uur')
      .innerJoin('uur.unit', 'unit')
      .where('uur.usrId = :usrId', { usrId: memberId })
      .andWhere('uur.uurEndedAt IS NULL')
      .andWhere('unit.entId = :entityId', { entityId })
      .getMany();

    for (const role of activeRoles) {
      role.uurEndedAt = new Date();
      await this.userUnitRoleRepo.save(role);
    }

    // Cell 연결 해제
    const userCells = await this.userCellRepo.find({
      where: { usrId: memberId },
    });
    if (userCells.length > 0) {
      await this.userCellRepo.remove(userCells);
    }

    return { userId: memberId, deleted: true };
  }

  /**
   * 초대 삭제 (CANCELLED, EXPIRED, ACCEPTED 상태만)
   */
  async deleteInvitation(invId: string, entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const invitation = await this.invitationRepo.findOne({
      where: { invId, invCompanyId: entityId },
    });
    if (!invitation) {
      throw new BadRequestException('Invitation not found');
    }

    if (invitation.invStatus === 'PENDING') {
      throw new BadRequestException('Cannot delete a pending invitation. Cancel it first.');
    }

    await this.invitationRepo.remove(invitation);

    return { id: invId, deleted: true };
  }

  /**
   * 멤버 비밀번호 초기화 (랜덤 비밀번호 생성 후 이메일 발송)
   */
  async resetMemberPassword(memberId: string, entityId: string, user: UserPayload, mode: 'email' | 'generate' = 'email') {
    this.ensureEntityAccess(entityId, user);

    // MASTER 이상만 비밀번호 초기화 가능
    if (user.level !== 'ADMIN_LEVEL' && !['MASTER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Only MASTER or higher can reset passwords');
    }

    // 자기 자신 비밀번호 초기화 방지
    if (memberId === user.userId) {
      throw new BadRequestException('Cannot reset your own password here');
    }

    // USER_LEVEL은 usrCompanyId로, CLIENT_LEVEL은 같은 entity 소속인지 확인
    let member = await this.userRepo.findOne({
      where: { usrId: memberId, usrCompanyId: entityId },
    });
    if (!member) {
      // CLIENT_LEVEL 사용자: usrCompanyId가 entityId인 사용자 재조회
      member = await this.userRepo.findOne({
        where: { usrId: memberId },
      });
      if (member && member.usrCompanyId !== entityId) {
        member = null;
      }
    }
    if (!member) {
      throw new BadRequestException('Member not found in this entity');
    }

    // MASTER는 다른 MASTER의 비밀번호 초기화 불가
    if (user.level !== 'ADMIN_LEVEL' && member.usrRole === 'MASTER') {
      throw new ForbiddenException('Cannot reset password of another MASTER');
    }

    // 랜덤 비밀번호 생성 (12자: 대소문자 + 숫자 + 특수문자)
    const tempPassword = this.generateTempPassword();

    // 비밀번호 해시 저장
    const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_SALT_ROUNDS);
    member.usrPassword = hashedPassword;
    member.usrMustChangePw = true;
    await this.userRepo.save(member);

    if (mode === 'generate') {
      // 관리자 직접 확인 모드: 이메일 발송 없이 임시 비밀번호 응답
      this.logger.log(`Password reset (generate mode) for member ${memberId} by ${user.userId}`);
      return { userId: memberId, emailSent: false, tempPassword };
    }

    // 이메일 발송 모드 (기본)
    const emailSent = await this.mailService.sendTemporaryPasswordEmail(
      member.usrEmail,
      member.usrName || member.usrEmail,
      tempPassword,
    );

    this.logger.log(`Password reset for member ${memberId} by ${user.userId}, email sent: ${emailSent}`);

    return { userId: memberId, emailSent };
  }

  /**
   * 임시 비밀번호 생성 (12자)
   */
  private generateTempPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '!@#$%&*';
    const all = upper + lower + digits + special;

    // 각 카테고리에서 최소 1자 포함
    let password = '';
    password += upper[crypto.randomInt(upper.length)];
    password += lower[crypto.randomInt(lower.length)];
    password += digits[crypto.randomInt(digits.length)];
    password += special[crypto.randomInt(special.length)];

    // 나머지 8자를 전체 풀에서 랜덤 선택
    for (let i = 0; i < 8; i++) {
      password += all[crypto.randomInt(all.length)];
    }

    // 셔플
    return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
  }

  /**
   * 법인 접근 권한 확인
   */
  private ensureEntityAccess(entityId: string, user: UserPayload) {
    if (user.level === 'ADMIN_LEVEL') return;
    if (user.companyId !== entityId) {
      throw new ForbiddenException('Cannot access members of another entity');
    }
  }
}
