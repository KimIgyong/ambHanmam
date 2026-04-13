import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In, IsNull } from 'typeorm';
import { CalendarEntity } from '../entity/calendar.entity';
import { CalendarRecurrenceEntity } from '../entity/calendar-recurrence.entity';
import { CalendarExceptionEntity } from '../entity/calendar-exception.entity';
import { CalendarParticipantEntity } from '../entity/calendar-participant.entity';
import { CalendarNotificationEntity } from '../entity/calendar-notification.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { UnitEntity } from '../../unit/entity/unit.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { UserCellEntity } from '../../members/entity/user-cell.entity';
import { CreateCalendarRequest } from '../dto/request/create-calendar.request';
import { UpdateCalendarRequest } from '../dto/request/update-calendar.request';
import { CreateCalendarExceptionRequest } from '../dto/request/create-calendar-exception.request';
import { AddParticipantsRequest } from '../dto/request/add-participants.request';
import { RespondCalendarRequest } from '../dto/request/respond-calendar.request';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectRepository(CalendarEntity)
    private readonly calendarRepo: Repository<CalendarEntity>,
    @InjectRepository(CalendarRecurrenceEntity)
    private readonly recurrenceRepo: Repository<CalendarRecurrenceEntity>,
    @InjectRepository(CalendarExceptionEntity)
    private readonly exceptionRepo: Repository<CalendarExceptionEntity>,
    @InjectRepository(CalendarParticipantEntity)
    private readonly participantRepo: Repository<CalendarParticipantEntity>,
    @InjectRepository(CalendarNotificationEntity)
    private readonly notificationRepo: Repository<CalendarNotificationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UnitEntity)
    private readonly departmentRepo: Repository<UnitEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly userDeptRoleRepo: Repository<UserUnitRoleEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userCellRepo: Repository<UserCellEntity>,
  ) {}

  // ──────────────────────────────────────────────
  // Helpers: Role / ACL
  // ──────────────────────────────────────────────

  private isAdmin(role: string): boolean {
    return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SYSTEM_ADMIN';
  }

  private isManager(role: string): boolean {
    return this.isAdmin(role) || role === 'MANAGER';
  }

  /** 사용자의 유닛 ID 배열 (주 유닛 + 겸직) */
  private async getUserDeptIds(userId: string, entityId: string): Promise<string[]> {
    const roles = await this.userDeptRoleRepo.find({
      where: { usrId: userId },
      relations: ['unit'],
    });
    return roles
      .filter((r) => r.unit && r.unit.entId === entityId)
      .map((r) => r.untId);
  }

  /** 유닛 ID 배열 → 해당 유닛 + 하위 유닛 ID 배열 */
  private async getDeptIdsWithChildren(deptIds: string[], entityId: string): Promise<string[]> {
    if (!deptIds.length) return [];
    const allDepts = await this.departmentRepo.find({ where: { entId: entityId, untIsActive: true } });
    const result = new Set<string>(deptIds);
    const addChildren = (parentIds: string[]) => {
      const children = allDepts.filter((d) => parentIds.includes(d.untParentId));
      if (!children.length) return;
      const childIds = children.map((d) => d.untId);
      childIds.forEach((id) => result.add(id));
      addChildren(childIds);
    };
    addChildren(deptIds);
    return Array.from(result);
  }

  /** 매니저가 관리하는 유닛인지 확인 */
  private async isManagerOfDepartment(userId: string, deptId: string): Promise<boolean> {
    const role = await this.userDeptRoleRepo.findOne({
      where: { usrId: userId, untId: deptId, uurRole: In(['UNIT_HEAD', 'TEAM_LEAD']) },
    });
    return !!role;
  }

  /**
   * 일정에 접근 가능한지 ACL 체크 (FR-SCH-070~077)
   * Returns true if the user can view the calendar event
   */
  private async canAccessCalendar(
    calendar: CalendarEntity,
    userId: string,
    role: string,
    entityId: string,
  ): Promise<boolean> {
    // Owner always has access
    if (calendar.usrId === userId) return true;

    // Check if participant (FR-SCH-077)
    const isParticipant = calendar.participants?.some((p) => p.usrId === userId);
    if (isParticipant) return true;

    // PRIVATE: only owner + participants (already checked above) + manager
    // Admin does NOT bypass PRIVATE visibility
    if (calendar.calVisibility === 'PRIVATE') {
      return await this.hasManagerAccess(userId, calendar.usrId, entityId);
    }

    // Admin can access all non-PRIVATE events
    if (this.isAdmin(role)) return true;

    // Visibility-based access
    switch (calendar.calVisibility) {

      case 'SHARED':
        // Only owner + explicit shares + manager
        return await this.hasManagerAccess(userId, calendar.usrId, entityId);

      case 'UNIT': {
        // Same department or sub-department
        const ownerDepts = await this.getUserDeptIds(calendar.usrId, entityId);
        const ownerDeptTree = await this.getDeptIdsWithChildren(ownerDepts, entityId);
        const viewerDepts = await this.getUserDeptIds(userId, entityId);
        const overlap = viewerDepts.some((d) => ownerDeptTree.includes(d));
        if (overlap) return true;
        return await this.hasManagerAccess(userId, calendar.usrId, entityId);
      }

      case 'ENTITY':
        // Same entity — always accessible
        return calendar.entId === entityId;

      default:
        return false;
    }
  }

  /** Manager hierarchical access check (ACL-012) */
  private async hasManagerAccess(
    viewerUserId: string,
    ownerUserId: string,
    entityId: string,
  ): Promise<boolean> {
    const ownerDepts = await this.getUserDeptIds(ownerUserId, entityId);
    for (const deptId of ownerDepts) {
      if (await this.isManagerOfDepartment(viewerUserId, deptId)) return true;
    }
    // Check parent depts too
    const ownerDeptTree = await this.getDeptIdsWithChildren(ownerDepts, entityId);
    const viewerManagedDepts = await this.userDeptRoleRepo.find({
      where: { usrId: viewerUserId, uurRole: In(['UNIT_HEAD', 'TEAM_LEAD']) },
    });
    const managedIdsWithChildren = await this.getDeptIdsWithChildren(
      viewerManagedDepts.map((r) => r.untId),
      entityId,
    );
    return ownerDepts.some((d) => managedIdsWithChildren.includes(d));
  }

  // ──────────────────────────────────────────────
  // 1. CRUD (FR-SCH-001~007)
  // ──────────────────────────────────────────────

  /** 일정 생성 (FR-SCH-001~003) */
  async create(
    dto: CreateCalendarRequest,
    userId: string,
    entityId: string,
  ) {
    const calendar = this.calendarRepo.create({
      entId: entityId,
      usrId: userId,
      projectId: dto.project_id || null,
      calTitle: dto.cal_title,
      calDescription: dto.cal_description || null,
      calStartAt: new Date(dto.cal_start_at),
      calEndAt: new Date(dto.cal_end_at),
      calIsAllDay: dto.cal_is_all_day ?? false,
      calLocation: dto.cal_location || null,
      calCategory: dto.cal_category || 'WORK',
      calVisibility: dto.cal_visibility || 'PRIVATE',
      calColor: dto.cal_color || null,
      calRecurrenceType: dto.recurrence ? 'RECURRING' : 'NONE',
    });

    const saved = await this.calendarRepo.save(calendar);

    // Recurrence
    if (dto.recurrence) {
      const rec = this.recurrenceRepo.create({
        calId: saved.calId,
        clrFreq: dto.recurrence.clr_freq,
        clrInterval: dto.recurrence.clr_interval ?? 1,
        clrWeekdays: dto.recurrence.clr_weekdays ?? null,
        clrMonthDay: dto.recurrence.clr_month_day ?? null,
        clrEndType: dto.recurrence.clr_end_type,
        clrEndDate: dto.recurrence.clr_end_date ? new Date(dto.recurrence.clr_end_date) : null,
        clrCount: dto.recurrence.clr_count ?? null,
      });
      await this.recurrenceRepo.save(rec);
    }

    // Notification
    if (dto.notification && dto.notification.cln_reminder_type !== 'NONE') {
      const notif = this.notificationRepo.create({
        calId: saved.calId,
        clnReminderType: dto.notification.cln_reminder_type,
        clnCustomMinutes: dto.notification.cln_custom_minutes ?? null,
        clnChannels: dto.notification.cln_channels || ['TALK'],
      });
      await this.notificationRepo.save(notif);
    }

    // Participants
    if (dto.participant_ids?.length) {
      const participants = dto.participant_ids.map((uid) =>
        this.participantRepo.create({
          calId: saved.calId,
          usrId: uid,
          clpResponseStatus: 'NONE',
          clpInvitedBy: userId,
        }),
      );
      await this.participantRepo.save(participants);
    }

    return this.findById(saved.calId, userId, entityId);
  }

  /** 일정 목록 조회 (FR-SCH-007) with visibility ACL */
  async findAll(
    userId: string,
    role: string,
    entityId: string,
    filters: {
      start_date?: string;
      end_date?: string;
      category?: string;
      visibility?: string;
      filter_mode?: string; // MY_ONLY | PARTICIPANT | ACCESSIBLE
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 500);

    // Validate 90-day range
    if (filters.start_date && filters.end_date) {
      const start = new Date(filters.start_date);
      const end = new Date(filters.end_date);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 90) {
        throw new BadRequestException('Date range cannot exceed 90 days (NFR-SCH-003)');
      }
    }

    const qb = this.calendarRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.participants', 'p')
      .leftJoinAndSelect('s.recurrence', 'r')
      .leftJoinAndSelect('s.notifications', 'n')
      .leftJoinAndSelect('s.owner', 'owner')
      .leftJoinAndSelect('p.user', 'puser')
      .where('s.entId = :entityId', { entityId })
      .andWhere('s.calDeletedAt IS NULL');

    // Date range
    if (filters.start_date) {
      qb.andWhere('s.calEndAt >= :startDate', { startDate: filters.start_date });
    }
    if (filters.end_date) {
      // Date-only string (e.g. "2026-03-15") → extend to end of day so events starting during the day are included
      const endDate = filters.end_date.includes('T')
        ? filters.end_date
        : `${filters.end_date}T23:59:59.999`;
      qb.andWhere('s.calStartAt <= :endDate', { endDate });
    }

    // Category filter
    if (filters.category) {
      qb.andWhere('s.calCategory = :category', { category: filters.category });
    }

    // Filter mode (FR-SCH-041)
    const filterMode = filters.filter_mode || 'ACCESSIBLE';

    if (filterMode === 'MY_ONLY') {
      qb.andWhere('s.usrId = :userId', { userId });
    } else if (filterMode === 'PARTICIPANT') {
      qb.andWhere(
        new Brackets((sub) => {
          sub.where('s.usrId = :userId', { userId }).orWhere('p.usrId = :userId', { userId });
        }),
      );
    } else if (filterMode === 'UNIT') {
      const userUnitIds = await this.getUserDeptIds(userId, entityId);
      const deptTreeIds = await this.getDeptIdsWithChildren(userUnitIds, entityId);
      let deptUserIds: string[] = [];
      if (deptTreeIds.length) {
        const deptUsers = await this.userDeptRoleRepo.find({
          where: { untId: In(deptTreeIds) },
        });
        deptUserIds = [...new Set(deptUsers.map((u) => u.usrId))];
      }
      if (deptUserIds.length > 0) {
        qb.andWhere(
          new Brackets((sub) => {
            sub.where('s.usrId IN (:...deptUserIds)', { deptUserIds });
            sub.orWhere('p.usrId = :userId', { userId });
          }),
        );
      } else {
        qb.andWhere('s.usrId = :userId', { userId });
      }
    } else if (filterMode === 'CELL') {
      const userCells = await this.userCellRepo.find({ where: { usrId: userId } });
      const cellIds = userCells.map((uc) => uc.celId);
      if (cellIds.length > 0) {
        const cellMembers = await this.userCellRepo.find({
          where: { celId: In(cellIds) },
          select: ['usrId'],
        });
        const cellUserIds = [...new Set(cellMembers.map((m) => m.usrId))];
        if (cellUserIds.length > 0) {
          qb.andWhere(
            new Brackets((sub) => {
              sub.where('s.usrId IN (:...cellUserIds)', { cellUserIds });
              sub.orWhere('p.usrId = :userId', { userId });
            }),
          );
        } else {
          qb.andWhere('s.usrId = :userId', { userId });
        }
      } else {
        qb.andWhere('s.usrId = :userId', { userId });
      }
    } else {
      // ACCESSIBLE — apply visibility ACL
      if (this.isAdmin(role)) {
        // Admin sees all EXCEPT PRIVATE events that don't belong to them
        qb.andWhere(
          new Brackets((outer) => {
            // Non-PRIVATE events: admin sees all
            outer.where("s.calVisibility != 'PRIVATE'");
            // PRIVATE events: only if owner or participant
            outer.orWhere(
              new Brackets((privateBracket) => {
                privateBracket
                  .where("s.calVisibility = 'PRIVATE'")
                  .andWhere(
                    new Brackets((access) => {
                      access.where('s.usrId = :userId', { userId });
                      access.orWhere('p.usrId = :userId', { userId });
                    }),
                  );
              }),
            );
          }),
        );
      } else {
        const userUnitIds = await this.getUserDeptIds(userId, entityId);
        const deptTreeIds = await this.getDeptIdsWithChildren(userUnitIds, entityId);

        // Get user IDs in department tree for DEPARTMENT visibility
        let deptUserIds: string[] = [];
        if (deptTreeIds.length) {
          const deptUsers = await this.userDeptRoleRepo.find({
            where: { untId: In(deptTreeIds) },
          });
          deptUserIds = [...new Set(deptUsers.map((u) => u.usrId))];
        }

        qb.andWhere(
          new Brackets((outer) => {
            // Owner
            outer.where('s.usrId = :userId', { userId });
            // Participant
            outer.orWhere('p.usrId = :userId', { userId });
            // ENTITY visibility
            outer.orWhere("s.calVisibility = 'ENTITY'");
            // UNIT visibility — owner in same unit tree
            if (deptUserIds.length) {
              outer.orWhere(
                new Brackets((deptBracket) => {
                  deptBracket
                    .where("s.calVisibility = 'UNIT'")
                    .andWhere('s.usrId IN (:...deptUserIds)', { deptUserIds });
                }),
              );
            }
          }),
        );
      }
    }

    qb.orderBy('s.calStartAt', 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((s) => this.mapCalendarResponse(s)),
      total,
      page,
      limit,
    };
  }

  /** 일정 상세 조회 (FR-SCH-006) */
  async findById(calId: string, userId: string, entityId: string, role?: string) {
    const calendar = await this.calendarRepo.findOne({
      where: { calId, entId: entityId },
      relations: ['recurrence', 'exceptions', 'participants', 'participants.user', 'notifications', 'owner'],
    });

    if (!calendar) {
      throw new NotFoundException(ERROR_CODE.CALENDAR_NOT_FOUND?.message || 'Calendar event not found');
    }

    // ACL check
    const userRole = role || 'MEMBER';
    const canAccess = await this.canAccessCalendar(calendar, userId, userRole, entityId);
    if (!canAccess) {
      throw new ForbiddenException('Access denied to this calendar event');
    }

    return this.mapCalendarDetailResponse(calendar);
  }

  /** 일정 수정 (FR-SCH-004) + 낙관적 락 (FR-SCH-008) */
  async update(
    calId: string,
    dto: UpdateCalendarRequest,
    userId: string,
    entityId: string,
    role: string,
  ) {
    const calendar = await this.calendarRepo.findOne({
      where: { calId, entId: entityId },
      relations: ['recurrence', 'participants', 'notifications'],
    });

    if (!calendar) {
      throw new NotFoundException('Calendar event not found');
    }

    // Only owner or admin can edit
    if (calendar.usrId !== userId && !this.isAdmin(role)) {
      throw new ForbiddenException('Only calendar event owner or admin can edit');
    }

    // Optimistic lock check (FR-SCH-008)
    if (dto.current_updated_at) {
      const clientTs = new Date(dto.current_updated_at).getTime();
      const serverTs = calendar.calUpdatedAt.getTime();
      if (clientTs < serverTs) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'E9001',
            message: 'Calendar event was modified by another user. Please refresh and try again.',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update fields
    if (dto.cal_title !== undefined) calendar.calTitle = dto.cal_title;
    if (dto.cal_description !== undefined) calendar.calDescription = dto.cal_description;
    if (dto.cal_start_at !== undefined) calendar.calStartAt = new Date(dto.cal_start_at);
    if (dto.cal_end_at !== undefined) calendar.calEndAt = new Date(dto.cal_end_at);
    if (dto.cal_is_all_day !== undefined) calendar.calIsAllDay = dto.cal_is_all_day;
    if (dto.cal_location !== undefined) calendar.calLocation = dto.cal_location;
    if (dto.cal_category !== undefined) calendar.calCategory = dto.cal_category;
    if (dto.cal_visibility !== undefined) calendar.calVisibility = dto.cal_visibility;
    if (dto.cal_color !== undefined) calendar.calColor = dto.cal_color;
    if (dto.project_id !== undefined) calendar.projectId = dto.project_id;

    // Update recurrence
    if (dto.recurrence) {
      calendar.calRecurrenceType = 'RECURRING';
      if (calendar.recurrence) {
        Object.assign(calendar.recurrence, {
          clrFreq: dto.recurrence.clr_freq,
          clrInterval: dto.recurrence.clr_interval ?? calendar.recurrence.clrInterval,
          clrWeekdays: dto.recurrence.clr_weekdays ?? calendar.recurrence.clrWeekdays,
          clrMonthDay: dto.recurrence.clr_month_day ?? calendar.recurrence.clrMonthDay,
          clrEndType: dto.recurrence.clr_end_type,
          clrEndDate: dto.recurrence.clr_end_date ? new Date(dto.recurrence.clr_end_date) : calendar.recurrence.clrEndDate,
          clrCount: dto.recurrence.clr_count ?? calendar.recurrence.clrCount,
        });
        await this.recurrenceRepo.save(calendar.recurrence);
      } else {
        const rec = this.recurrenceRepo.create({
          calId: calendar.calId,
          clrFreq: dto.recurrence.clr_freq,
          clrInterval: dto.recurrence.clr_interval ?? 1,
          clrWeekdays: dto.recurrence.clr_weekdays ?? null,
          clrMonthDay: dto.recurrence.clr_month_day ?? null,
          clrEndType: dto.recurrence.clr_end_type,
          clrEndDate: dto.recurrence.clr_end_date ? new Date(dto.recurrence.clr_end_date) : null,
          clrCount: dto.recurrence.clr_count ?? null,
        });
        await this.recurrenceRepo.save(rec);
      }
    } else if (dto.recurrence === null) {
      // Remove recurrence
      calendar.calRecurrenceType = 'NONE';
      if (calendar.recurrence) {
        await this.recurrenceRepo.remove(calendar.recurrence);
      }
    }

    // Update notification
    if (dto.notification) {
      // Remove old, insert new
      if (calendar.notifications?.length) {
        await this.notificationRepo.remove(calendar.notifications);
      }
      if (dto.notification.cln_reminder_type !== 'NONE') {
        const notif = this.notificationRepo.create({
          calId: calendar.calId,
          clnReminderType: dto.notification.cln_reminder_type,
          clnCustomMinutes: dto.notification.cln_custom_minutes ?? null,
          clnChannels: dto.notification.cln_channels || ['TALK'],
        });
        await this.notificationRepo.save(notif);
      }
    }

    // Update participants
    if (dto.participant_ids !== undefined) {
      // Remove old, insert new
      if (calendar.participants?.length) {
        await this.participantRepo.remove(calendar.participants);
      }
      if (dto.participant_ids.length) {
        const participants = dto.participant_ids.map((uid) =>
          this.participantRepo.create({
            calId: calendar.calId,
            usrId: uid,
            clpResponseStatus: 'NONE',
            clpInvitedBy: userId,
          }),
        );
        await this.participantRepo.save(participants);
      }
    }

    // If Google connected and synced, mark as NOT_SYNCED for re-sync
    if (calendar.calGoogleEventId && calendar.calSyncStatus === 'SYNCED') {
      calendar.calSyncStatus = 'NOT_SYNCED';
    }

    await this.calendarRepo.save(calendar);

    return this.findById(calendar.calId, userId, entityId, role);
  }

  /** 일정 삭제 — soft delete (FR-SCH-005) */
  async remove(calId: string, userId: string, entityId: string, role: string) {
    const calendar = await this.calendarRepo.findOne({
      where: { calId, entId: entityId },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar event not found');
    }

    if (calendar.usrId !== userId && !this.isAdmin(role)) {
      throw new ForbiddenException('Only calendar event owner or admin can delete');
    }

    await this.calendarRepo.softRemove(calendar);

    return { deleted: true };
  }

  // ──────────────────────────────────────────────
  // 2. Recurrence Exceptions (FR-SCH-010~013)
  // ──────────────────────────────────────────────

  /** 반복 예외 생성 (FR-SCH-012/013) */
  async createException(
    calId: string,
    dto: CreateCalendarExceptionRequest,
    userId: string,
    entityId: string,
    role: string,
  ) {
    const calendar = await this.calendarRepo.findOne({
      where: { calId, entId: entityId },
    });

    if (!calendar) throw new NotFoundException('Calendar event not found');
    if (calendar.calRecurrenceType !== 'RECURRING') {
      throw new BadRequestException('Only recurring calendar events can have exceptions');
    }
    if (calendar.usrId !== userId && !this.isAdmin(role)) {
      throw new ForbiddenException('Only calendar event owner or admin can modify exceptions');
    }

    // Validate RESCHEDULED needs new times
    if (dto.cle_exception_type === 'RESCHEDULED') {
      if (!dto.cle_new_start_at || !dto.cle_new_end_at) {
        throw new BadRequestException('RESCHEDULED exception requires new start/end times');
      }
    }

    const exception = this.exceptionRepo.create({
      calId,
      cleOriginalDate: new Date(dto.cle_original_date),
      cleExceptionType: dto.cle_exception_type,
      cleNewStartAt: dto.cle_new_start_at ? new Date(dto.cle_new_start_at) : null,
      cleNewEndAt: dto.cle_new_end_at ? new Date(dto.cle_new_end_at) : null,
    });

    const saved = await this.exceptionRepo.save(exception);
    return this.mapExceptionResponse(saved);
  }

  /** 반복 예외 목록 조회 */
  async getExceptions(calId: string, userId: string, entityId: string) {
    const calendar = await this.calendarRepo.findOne({
      where: { calId, entId: entityId },
      relations: ['participants'],
    });
    if (!calendar) throw new NotFoundException('Calendar event not found');

    const exceptions = await this.exceptionRepo.find({
      where: { calId },
      order: { cleOriginalDate: 'ASC' },
    });

    return exceptions.map((e) => this.mapExceptionResponse(e));
  }

  // ──────────────────────────────────────────────
  // 3. Participants (FR-SCH-020~025)
  // ──────────────────────────────────────────────

  /** 참여자 추가 (FR-SCH-020) */
  async addParticipants(
    calId: string,
    dto: AddParticipantsRequest,
    userId: string,
    entityId: string,
    role: string,
  ) {
    const calendar = await this.calendarRepo.findOne({
      where: { calId, entId: entityId },
    });
    if (!calendar) throw new NotFoundException('Calendar event not found');
    if (calendar.usrId !== userId && !this.isAdmin(role)) {
      throw new ForbiddenException('Only calendar event owner or admin can add participants');
    }

    const existing = await this.participantRepo.find({ where: { calId } });
    const existingUserIds = new Set(existing.map((p) => p.usrId));

    const newParticipants = dto.participant_ids
      .filter((uid) => !existingUserIds.has(uid) && uid !== calendar.usrId)
      .map((uid) =>
        this.participantRepo.create({
          calId,
          usrId: uid,
          clpResponseStatus: 'NONE',
          clpInvitedBy: userId,
        }),
      );

    if (newParticipants.length) {
      await this.participantRepo.save(newParticipants);
    }

    return { added: newParticipants.length };
  }

  /** 내 참여 응답 변경 (FR-SCH-022) */
  async respondToCalendar(
    calId: string,
    dto: RespondCalendarRequest,
    userId: string,
    entityId: string,
  ) {
    const participant = await this.participantRepo.findOne({
      where: { calId, usrId: userId },
    });

    if (!participant) {
      throw new NotFoundException('You are not a participant of this calendar event');
    }

    participant.clpResponseStatus = dto.clp_response_status;
    participant.clpRespondedAt = new Date();
    await this.participantRepo.save(participant);

    return {
      clpId: participant.clpId,
      clpResponseStatus: participant.clpResponseStatus,
      clpRespondedAt: participant.clpRespondedAt,
    };
  }

  /** 참여자 제거 (FR-SCH-024) */
  async removeParticipant(
    calId: string,
    clpId: string,
    userId: string,
    entityId: string,
    role: string,
  ) {
    const calendar = await this.calendarRepo.findOne({
      where: { calId, entId: entityId },
    });
    if (!calendar) throw new NotFoundException('Calendar event not found');
    if (calendar.usrId !== userId && !this.isAdmin(role)) {
      throw new ForbiddenException('Only calendar event owner or admin can remove participants');
    }

    const participant = await this.participantRepo.findOne({
      where: { clpId, calId },
    });
    if (!participant) throw new NotFoundException('Participant not found');

    await this.participantRepo.remove(participant);
    return { removed: true };
  }

  // ──────────────────────────────────────────────
  // 4. Google Calendar Sync (FR-SCH-050~054)
  // ──────────────────────────────────────────────

  /** Google 수동 동기화 트리거 */
  async triggerGoogleSync(calId: string, userId: string, entityId: string) {
    const calendar = await this.calendarRepo.findOne({
      where: { calId, entId: entityId },
    });
    if (!calendar) throw new NotFoundException('Calendar event not found');

    // Placeholder: actual Google Calendar API call would go here
    // For now, update sync status
    calendar.calSyncStatus = 'NOT_SYNCED';
    await this.calendarRepo.save(calendar);

    return {
      calId: calendar.calId,
      calSyncStatus: calendar.calSyncStatus,
      message: 'Google Calendar sync queued',
    };
  }

  // ──────────────────────────────────────────────
  // Response Mappers
  // ──────────────────────────────────────────────

  private mapCalendarResponse(s: CalendarEntity) {
    return {
      calId: s.calId,
      calTitle: s.calTitle,
      calStartAt: s.calStartAt,
      calEndAt: s.calEndAt,
      calIsAllDay: s.calIsAllDay,
      calCategory: s.calCategory,
      calVisibility: s.calVisibility,
      calColor: s.calColor,
      calRecurrenceType: s.calRecurrenceType,
      calSyncStatus: s.calSyncStatus,
      owner: s.owner
        ? {
            usrId: s.owner.usrId,
            usrName: s.owner.usrName,
            usrEmail: s.owner.usrEmail,
          }
        : null,
      participantCount: s.participants?.length ?? 0,
      hasRecurrence: s.calRecurrenceType === 'RECURRING',
    };
  }

  private mapCalendarDetailResponse(s: CalendarEntity) {
    return {
      calId: s.calId,
      entId: s.entId,
      calTitle: s.calTitle,
      calDescription: s.calDescription,
      calStartAt: s.calStartAt,
      calEndAt: s.calEndAt,
      calIsAllDay: s.calIsAllDay,
      calLocation: s.calLocation,
      calCategory: s.calCategory,
      calVisibility: s.calVisibility,
      calColor: s.calColor,
      calRecurrenceType: s.calRecurrenceType,
      calGoogleEventId: s.calGoogleEventId,
      calSyncStatus: s.calSyncStatus,
      calSyncAt: s.calSyncAt,
      calUpdatedAt: s.calUpdatedAt,
      calCreatedAt: s.calCreatedAt,
      projectId: s.projectId,
      owner: s.owner
        ? {
            usrId: s.owner.usrId,
            usrName: s.owner.usrName,
            usrEmail: s.owner.usrEmail,
          }
        : null,
      recurrence: s.recurrence
        ? {
            clrId: s.recurrence.clrId,
            clrFreq: s.recurrence.clrFreq,
            clrInterval: s.recurrence.clrInterval,
            clrWeekdays: s.recurrence.clrWeekdays,
            clrMonthDay: s.recurrence.clrMonthDay,
            clrEndType: s.recurrence.clrEndType,
            clrEndDate: s.recurrence.clrEndDate,
            clrCount: s.recurrence.clrCount,
          }
        : null,
      exceptions: (s.exceptions || []).map((e) => this.mapExceptionResponse(e)),
      participants: (s.participants || []).map((p) => ({
        clpId: p.clpId,
        usrId: p.usrId,
        clpResponseStatus: p.clpResponseStatus,
        clpRespondedAt: p.clpRespondedAt,
        user: p.user
          ? {
              usrId: p.user.usrId,
              usrName: p.user.usrName,
              usrEmail: p.user.usrEmail,
            }
          : null,
      })),
      notifications: (s.notifications || []).map((n) => ({
        clnId: n.clnId,
        clnReminderType: n.clnReminderType,
        clnCustomMinutes: n.clnCustomMinutes,
        clnChannels: n.clnChannels,
      })),
    };
  }

  private mapExceptionResponse(e: CalendarExceptionEntity) {
    return {
      cleId: e.cleId,
      calId: e.calId,
      cleOriginalDate: e.cleOriginalDate,
      cleExceptionType: e.cleExceptionType,
      cleNewStartAt: e.cleNewStartAt,
      cleNewEndAt: e.cleNewEndAt,
      cleCreatedAt: e.cleCreatedAt,
    };
  }
}
