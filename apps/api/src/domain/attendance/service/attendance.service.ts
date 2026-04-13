import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AttendanceEntity } from '../entity/attendance.entity';
import { AttendanceAmendmentEntity } from '../entity/attendance-amendment.entity';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';
import { CreateAttendanceRequest } from '../dto/request/create-attendance.request';
import { UpdateAttendanceRequest } from '../dto/request/update-attendance.request';
import { AmendAttendanceRequest } from '../dto/request/amend-attendance.request';
import { AttendanceMapper } from '../mapper/attendance.mapper';
import { AttendancePolicyService } from './attendance-policy.service';
import { AttendanceResponse } from '@amb/types';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(AttendanceAmendmentEntity)
    private readonly amendmentRepository: Repository<AttendanceAmendmentEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly eurRepository: Repository<EntityUserRoleEntity>,
    private readonly dataSource: DataSource,
    private readonly policyService: AttendancePolicyService,
  ) {}

  private calculateTimes(
    type: string,
    startTime?: string,
  ): { start: string | null; end: string | null } {
    switch (type) {
      case 'OFFICE':
      case 'REMOTE':
      case 'OUTSIDE_WORK':
      case 'BUSINESS_TRIP':
      case 'EXTERNAL_SITE': {
        const st = startTime || '09:00';
        const [h, m] = st.split(':');
        const hour = parseInt(h) + 9;
        return {
          start: st,
          end: `${hour.toString().padStart(2, '0')}:${m}`,
        };
      }
      case 'DAY_OFF':
        return { start: null, end: null };
      case 'AM_HALF':
        return { start: '13:00', end: '17:00' };
      case 'PM_HALF': {
        const st = startTime || '09:00';
        return { start: st, end: '12:00' };
      }
      default:
        return { start: null, end: null };
    }
  }

  private getNextMonday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);
    return nextMonday;
  }

  private validateDateRange(dateStr: string, allowCurrentWeek = false): void {
    const date = new Date(dateStr + 'T00:00:00');
    const nextMonday = this.getNextMonday();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    if (allowCurrentWeek) {
      if (date < today || date > oneMonthLater) {
        throw new BadRequestException(
          ERROR_CODE.ATTENDANCE_INVALID_DATE_RANGE.message,
        );
      }
    } else {
      if (date < nextMonday || date > oneMonthLater) {
        throw new BadRequestException(
          ERROR_CODE.ATTENDANCE_INVALID_DATE_RANGE.message,
        );
      }
    }
  }

  private isCurrentWeekDate(dateStr: string): boolean {
    const date = new Date(dateStr + 'T00:00:00');
    const nextMonday = this.getNextMonday();
    return date < nextMonday;
  }

  // Weekend registration is now allowed (removed validateWeekday restriction)
  // private validateWeekday(dateStr: string): void { ... }

  private async validateRemoteLimit(
    userId: string,
    dateStr: string,
    entityId?: string,
    excludeId?: string,
    pendingRemoteCount = 0,
  ): Promise<void> {
    const policy = await this.policyService.getPolicyEntity(entityId || '');
    const maxRemote = policy.remoteDefaultCount + policy.remoteExtraCount;

    if (!policy.remoteBlockOnExceed) return;

    const date = new Date(dateStr + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.getMonth();
    const startOfMonth = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
    const endOfMonth = new Date(year, month + 1, 0);
    const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

    const qb = this.attendanceRepository
      .createQueryBuilder('att')
      .where('att.usrId = :userId', { userId })
      .andWhere('att.attType = :type', { type: 'REMOTE' })
      .andWhere('att.attDate >= :start', { start: startOfMonth })
      .andWhere('att.attDate <= :end', { end: endOfMonthStr });

    if (excludeId) {
      qb.andWhere('att.attId != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    if (count + pendingRemoteCount >= maxRemote) {
      throw new BadRequestException(
        ERROR_CODE.ATTENDANCE_REMOTE_LIMIT_EXCEEDED.message,
      );
    }
  }

  async getAttendances(
    userId: string,
    dateFrom: string,
    dateTo: string,
    entityId?: string,
  ): Promise<AttendanceResponse[]> {
    const qb = this.attendanceRepository
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.user', 'user')
      .where('att.usrId = :userId', { userId })
      .andWhere('att.attDate >= :dateFrom', { dateFrom })
      .andWhere('att.attDate <= :dateTo', { dateTo });

    if (entityId) {
      qb.andWhere('att.entId = :entityId', { entityId });
    }

    qb.orderBy('att.attDate', 'ASC');

    const entities = await qb.getMany();
    return entities.map(AttendanceMapper.toResponse);
  }

  async getTeamAttendances(
    dateFrom: string,
    dateTo: string,
    entityId?: string,
  ): Promise<AttendanceResponse[]> {
    const qb = this.attendanceRepository
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.user', 'user')
      .leftJoinAndSelect('att.amendments', 'amendments')
      .leftJoinAndSelect('amendments.amendedByUser', 'amendedByUser')
      .where('att.attDate >= :dateFrom', { dateFrom })
      .andWhere('att.attDate <= :dateTo', { dateTo });

    if (entityId) {
      qb.andWhere('att.entId = :entityId', { entityId });
    }

    qb.orderBy('user.usrName', 'ASC')
      .addOrderBy('att.attDate', 'ASC');

    const entities = await qb.getMany();
    return entities.map(AttendanceMapper.toResponse);
  }

  async createAttendances(
    dto: CreateAttendanceRequest,
    userId: string,
    entityId?: string,
  ): Promise<AttendanceResponse[]> {
    return this.dataSource.transaction(async (manager) => {
      const attRepo = manager.getRepository(AttendanceEntity);
      const results: AttendanceEntity[] = [];
      const pendingRemoteByMonth: Record<string, number> = {};

      for (const item of dto.schedules) {
        // 모든 타입 당일/이번 주 등록 허용
        this.validateDateRange(item.date, true);

        if (item.type === 'REMOTE') {
          const date = new Date(item.date + 'T00:00:00');
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          const pendingCount = pendingRemoteByMonth[monthKey] || 0;
          await this.validateRemoteLimit(userId, item.date, entityId, undefined, pendingCount);
          pendingRemoteByMonth[monthKey] = pendingCount + 1;
        }

        const existing = await attRepo
          .createQueryBuilder('att')
          .withDeleted()
          .where('att.usrId = :userId', { userId })
          .andWhere('att.attDate = :date', { date: item.date })
          .getOne();

        const times = this.calculateTimes(item.type, item.start_time);

        // 비예정 REMOTE (이번 주) → PENDING, 예정 REMOTE (다음 주+) → APPROVED
        const approvalStatus =
          item.type === 'REMOTE' && this.isCurrentWeekDate(item.date)
            ? 'PENDING'
            : 'APPROVED';

        if (existing && !existing.attDeletedAt) {
          throw new ConflictException(
            ERROR_CODE.ATTENDANCE_DUPLICATE_DATE.message,
          );
        }

        if (existing && existing.attDeletedAt) {
          existing.attDeletedAt = null as any;
          existing.attType = item.type;
          existing.attStartTime = times.start;
          existing.attEndTime = times.end;
          existing.attApprovalStatus = approvalStatus;
          existing.attApprovedBy = null;
          existing.attApprovedAt = null;
          existing.entId = entityId || null;
          results.push(existing);
        } else {
          const entity = attRepo.create({
            entId: entityId || null,
            usrId: userId,
            attDate: new Date(item.date + 'T00:00:00'),
            attType: item.type,
            attStartTime: times.start,
            attEndTime: times.end,
            attApprovalStatus: approvalStatus,
          });
          results.push(entity);
        }
      }

      const saved = await attRepo.save(results);
      return saved.map(AttendanceMapper.toResponse);
    });
  }

  async updateAttendance(
    id: string,
    dto: UpdateAttendanceRequest,
    userId: string,
  ): Promise<AttendanceResponse> {
    const entity = await this.attendanceRepository.findOne({
      where: { attId: id },
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.ATTENDANCE_NOT_FOUND.message);
    }
    if (entity.usrId !== userId) {
      throw new ForbiddenException(ERROR_CODE.ATTENDANCE_ACCESS_DENIED.message);
    }

    const newType = dto.type || entity.attType;

    if (newType === 'REMOTE' && entity.attType !== 'REMOTE') {
      const dateStr =
        entity.attDate instanceof Date
          ? entity.attDate.toISOString().split('T')[0]
          : String(entity.attDate);
      await this.validateRemoteLimit(userId, dateStr, entity.entId || undefined, id);
    }

    entity.attType = newType;
    const times = this.calculateTimes(
      newType,
      dto.start_time || entity.attStartTime || undefined,
    );
    entity.attStartTime = times.start;
    entity.attEndTime = times.end;

    const saved = await this.attendanceRepository.save(entity);
    return AttendanceMapper.toResponse(saved);
  }

  async deleteAttendance(id: string, userId: string): Promise<void> {
    const entity = await this.attendanceRepository.findOne({
      where: { attId: id },
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.ATTENDANCE_NOT_FOUND.message);
    }
    if (entity.usrId !== userId) {
      throw new ForbiddenException(ERROR_CODE.ATTENDANCE_ACCESS_DENIED.message);
    }
    await this.attendanceRepository.softRemove(entity);
  }

  async approveAttendance(
    id: string,
    approvedBy: string,
    status: 'APPROVED' | 'REJECTED',
  ): Promise<AttendanceResponse> {
    const entity = await this.attendanceRepository.findOne({
      where: { attId: id },
      relations: ['user'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.ATTENDANCE_NOT_FOUND.message);
    }
    if (entity.attApprovalStatus !== 'PENDING') {
      throw new BadRequestException('Only PENDING attendance can be approved or rejected.');
    }

    entity.attApprovalStatus = status;
    entity.attApprovedBy = approvedBy;
    entity.attApprovedAt = new Date();

    const saved = await this.attendanceRepository.save(entity);
    return AttendanceMapper.toResponse(saved);
  }

  async getPendingAttendances(entityId: string): Promise<AttendanceResponse[]> {
    const entities = await this.attendanceRepository
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.user', 'user')
      .where('att.ent_id = :entityId', { entityId })
      .andWhere('att.att_approval_status = :status', { status: 'PENDING' })
      .andWhere('att.att_deleted_at IS NULL')
      .orderBy('att.att_date', 'ASC')
      .getMany();
    return entities.map(AttendanceMapper.toResponse);
  }

  // ─── Attendance Member Visibility / Order ─────────────

  async getAttendanceMembers(entityId: string) {
    // EntityUserRole 기반 (USER_LEVEL + EntityUserRole이 있는 CLIENT_LEVEL)
    const eurRows = await this.eurRepository
      .createQueryBuilder('eur')
      .innerJoin('amb_users', 'u', 'u.usr_id = eur.usr_id AND u.usr_deleted_at IS NULL')
      .select([
        'eur.usr_id AS "userId"',
        'u.usr_name AS "userName"',
        'u.usr_level_code AS "levelCode"',
        'eur.eur_hidden_from_attendance AS "hidden"',
        'eur.eur_attendance_order AS "order"',
      ])
      .where('eur.ent_id = :entityId', { entityId })
      .andWhere('eur.eur_status = :status', { status: 'ACTIVE' })
      .orderBy('eur.eur_attendance_order', 'ASC', 'NULLS LAST')
      .addOrderBy('u.usr_name', 'ASC')
      .getRawMany();

    // CLIENT_LEVEL 사용자 (EntityUserRole이 없는 경우도 포함)
    const eurUserIds = eurRows.map((r) => r.userId);
    const clientRows = await this.dataSource.query(
      `SELECT u.usr_id AS "userId", u.usr_name AS "userName", 'CLIENT_LEVEL' AS "levelCode",
              false AS "hidden", NULL AS "order"
       FROM amb_users u
       JOIN amb_svc_clients c ON c.cli_id = u.usr_cli_id AND c.cli_deleted_at IS NULL
       WHERE c.cli_ent_id = $1
         AND u.usr_level_code = 'CLIENT_LEVEL'
         AND u.usr_deleted_at IS NULL
         AND u.usr_status = 'ACTIVE'
         ${eurUserIds.length > 0 ? `AND u.usr_id NOT IN (${eurUserIds.map((_, i) => `$${i + 2}`).join(',')})` : ''}
       ORDER BY u.usr_name ASC`,
      [entityId, ...eurUserIds],
    );

    return [...eurRows, ...clientRows];
  }

  async updateAttendanceMembers(
    entityId: string,
    items: Array<{ user_id: string; hidden: boolean; order: number | null }>,
  ) {
    for (const item of items) {
      // EntityUserRole이 있는 사용자만 업데이트 (CLIENT_LEVEL 등 EntityUserRole 없는 사용자는 무시)
      const eur = await this.eurRepository.findOne({
        where: { entId: entityId, usrId: item.user_id },
      });
      if (eur) {
        await this.eurRepository.update(
          { entId: entityId, usrId: item.user_id },
          {
            eurHiddenFromAttendance: item.hidden,
            eurAttendanceOrder: item.order,
          },
        );
      }
    }
    return this.getAttendanceMembers(entityId);
  }

  // ─── Amendment (수정 이력) ─────────────────────────

  async amendAttendance(
    attendanceId: string,
    dto: AmendAttendanceRequest,
    amendedByUserId: string,
  ) {
    const entity = await this.attendanceRepository.findOne({
      where: { attId: attendanceId },
      relations: ['user'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.ATTENDANCE_NOT_FOUND.message);
    }

    const times = this.calculateTimes(dto.type, dto.start_time);

    const amendment = this.amendmentRepository.create({
      attId: attendanceId,
      aamType: dto.type,
      aamStartTime: times.start,
      aamEndTime: times.end,
      aamNote: dto.note,
      aamAmendedBy: amendedByUserId,
    });

    const saved = await this.amendmentRepository.save(amendment);

    // Reload with user relation for response
    const full = await this.amendmentRepository.findOne({
      where: { aamId: saved.aamId },
      relations: ['amendedByUser'],
    });

    return AttendanceMapper.toAmendmentResponse(full!);
  }

  async getAmendments(attendanceId: string) {
    const entity = await this.attendanceRepository.findOne({
      where: { attId: attendanceId },
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.ATTENDANCE_NOT_FOUND.message);
    }

    const amendments = await this.amendmentRepository.find({
      where: { attId: attendanceId },
      relations: ['amendedByUser'],
      order: { aamCreatedAt: 'ASC' },
    });

    return amendments.map(AttendanceMapper.toAmendmentResponse);
  }
}
