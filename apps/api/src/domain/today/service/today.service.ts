import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, LessThan, Not } from 'typeorm';
import { Observable } from 'rxjs';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { AttendanceEntity } from '../../attendance/entity/attendance.entity';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { UnitEntity } from '../../unit/entity/unit.entity';
import { UserCellEntity } from '../../members/entity/user-cell.entity';
import { CellEntity } from '../../members/entity/cell.entity';
import { EmployeeEntity } from '../../hr/entity/employee.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { TodayReportEntity } from '../entity/today-report.entity';
import { DailyMissionEntity } from '../entity/daily-mission.entity';
import { ClaudeService, ClaudeStreamEvent } from '../../../infrastructure/external/claude/claude.service';
import { getLocalToday } from '../../../global/util/date.util';
import {
  MyTodayResponse,
  AllTodayResponse,
  TeamTodayResponse,
  TodoSummaryItem,
  MemberTodaySummary,
  MemberTodoItem,
  MemberIssueItem,
} from '../dto/today-response.dto';

@Injectable()
export class TodayService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly eurRepo: Repository<EntityUserRoleEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly userUnitRoleRepo: Repository<UserUnitRoleEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userCellRepo: Repository<UserCellEntity>,
    @InjectRepository(CellEntity)
    private readonly cellRepo: Repository<CellEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(TodayReportEntity)
    private readonly reportRepo: Repository<TodayReportEntity>,
    @InjectRepository(DailyMissionEntity)
    private readonly missionRepo: Repository<DailyMissionEntity>,
    private readonly claudeService: ClaudeService,
  ) {}

  async getMyToday(userId: string, entityId: string, timezone?: string): Promise<MyTodayResponse> {
    const today = getLocalToday(timezone);

    const baseWhere = { usrId: userId, entId: entityId };

    // 오늘 마감 할일
    const todayDueTodos = await this.todoRepo.find({
      where: { ...baseWhere, tdoDueDate: today as any, tdoStatus: Not('COMPLETED') },
      relations: ['user'],
      order: { tdoCreatedAt: 'DESC' },
    });

    // 지연 할일 (마감일 < 오늘 & 미완료)
    const overdueTodos = await this.todoRepo.find({
      where: {
        ...baseWhere,
        tdoDueDate: LessThan(today) as any,
        tdoStatus: Not('COMPLETED'),
      },
      relations: ['user'],
      order: { tdoDueDate: 'ASC' },
    });

    // 진행중 할일
    const inProgressTodos = await this.todoRepo.find({
      where: { ...baseWhere, tdoStatus: 'IN_PROGRESS' },
      relations: ['user'],
      order: { tdoDueDate: 'ASC' },
    });

    // 오늘 완료한 할일 수
    const completedTodayCount = await this.todoRepo
      .createQueryBuilder('t')
      .where('t.usr_id = :userId', { userId })
      .andWhere('t.ent_id = :entityId', { entityId })
      .andWhere('t.tdo_status = :status', { status: 'COMPLETED' })
      .andWhere('t.tdo_completed_at::date = CURRENT_DATE')
      .andWhere('t.tdo_deleted_at IS NULL')
      .getCount();

    // 미종료 이슈 카운트
    const issueCount = await this.issueRepo
      .createQueryBuilder('i')
      .where('(i.iss_reporter_id = :userId OR i.iss_assignee_id = :userId)', { userId })
      .andWhere('i.ent_id = :entityId', { entityId })
      .andWhere('i.iss_status NOT IN (:...closedStatuses)', { closedStatuses: ['RESOLVED', 'CLOSED'] })
      .andWhere('i.iss_deleted_at IS NULL')
      .getCount();

    return {
      todayDue: todayDueTodos.map(this.toTodoSummary),
      overdue: overdueTodos.map(this.toTodoSummary),
      inProgress: inProgressTodos.map(this.toTodoSummary),
      summary: {
        todayDueCount: todayDueTodos.length,
        overdueCount: overdueTodos.length,
        inProgressCount: inProgressTodos.length,
        completedTodayCount,
        issueCount,
      },
    };
  }

  async getAllToday(entityId: string, timezone?: string, callerRole?: string): Promise<AllTodayResponse> {
    const members = await this.eurRepo.find({
      where: { entId: entityId, eurStatus: 'ACTIVE' },
    });

    if (members.length === 0) {
      return { members: [], summary: { totalMembers: 0, totalTodayDue: 0, totalOverdue: 0, totalInProgress: 0, totalIssues: 0 } };
    }

    const userIds = members.map((m) => m.usrId);
    const today = getLocalToday(timezone);

    // User 정보 조회 (ACTIVE 사용자만)
    const users = await this.userRepo.find({ where: { usrId: In(userIds), usrStatus: 'ACTIVE' } });
    const userMap = new Map(users.map((u) => [u.usrId, u]));

    // ACTIVE 사용자만 필터링
    const activeUserIds = users.map((u) => u.usrId);
    const activeMembers = members.filter((m) => activeUserIds.includes(m.usrId));

    // MASTER가 아닌 경우 hidden 사용자 제외
    const isMaster = callerRole === 'MASTER';
    const visibleMembers = isMaster
      ? activeMembers
      : activeMembers.filter((m) => !m.eurHiddenFromToday);

    if (visibleMembers.length === 0) {
      return { members: [], summary: { totalMembers: 0, totalTodayDue: 0, totalOverdue: 0, totalInProgress: 0, totalIssues: 0 } };
    }

    const visibleUserIds = visibleMembers.map((m) => m.usrId);
    const hiddenMap = new Map(activeMembers.map((m) => [m.usrId, m.eurHiddenFromToday]));

    const [todoCounts, issueData, todosByUser, missionsByUser, attendanceByUser] = await Promise.all([
      this.getTodoCountsByUsers(visibleUserIds, entityId),
      this.getIssueDataByUsers(visibleUserIds, entityId),
      this.getTodoItemsByUsers(visibleUserIds, entityId),
      this.getMissionsByUsers(visibleUserIds, today),
      this.getAttendanceByUsers(visibleUserIds, today, entityId),
    ]);

    // Employee 정보
    const employees = await this.employeeRepo.find({
      where: { entId: entityId, usrId: In(visibleUserIds) },
    });
    const empMap = new Map(employees.map((e) => [e.usrId, e]));

    // Unit 정보 조회
    const unitNameMap = await this.getUnitNamesByUsers(visibleUserIds, entityId);

    // Cell 정보 조회
    const cellInfoMap = await this.getCellInfoByUsers(visibleUserIds);

    const memberSummaries: MemberTodaySummary[] = visibleMembers.map((m) => {
      const tc = todoCounts.get(m.usrId) || { todayDue: 0, overdue: 0, inProgress: 0 };
      const id = issueData.get(m.usrId);
      const emp = empMap.get(m.usrId);
      const user = userMap.get(m.usrId);
      const userTodos = todosByUser.get(m.usrId) || { todayDue: [], overdue: [], inProgress: [] };
      const attendance = attendanceByUser.get(m.usrId);
      const cellInfo = cellInfoMap.get(m.usrId);
      return {
        userId: m.usrId,
        userName: user?.usrName || '',
        email: user?.usrEmail || '',
        role: m.eurRole,
        department: emp?.empDepartment || undefined,
        position: emp?.empPosition || undefined,
        unitName: unitNameMap.get(m.usrId) || undefined,
        cellIds: cellInfo?.cellIds || [],
        cellNames: cellInfo?.cellNames || [],
        todayDueCount: tc.todayDue,
        overdueCount: tc.overdue,
        inProgressCount: tc.inProgress,
        issueCount: id?.issueCount || 0,
        todayDueTodos: userTodos.todayDue,
        overdueTodos: userTodos.overdue,
        inProgressTodos: userTodos.inProgress,
        recentIssues: (id?.recentIssues || []).slice(0, 10),
        issueTotal4w: id?.issueTotal4w || 0,
        issueResolved4w: id?.issueResolved4w || 0,
        toReviewCount: id?.toReviewCount || 0,
        issueInProgressCount: id?.inProgressCount || 0,
        toReviewIssues: id?.toReviewIssues || [],
        inProgressIssues: id?.inProgressIssues || [],
        missionContent: missionsByUser.get(m.usrId) ?? null,
        todayAttendanceType: attendance?.type ?? null,
        todayAttendanceId: attendance?.id ?? null,
        todayAttendanceApproval: attendance?.type === 'REMOTE' ? (attendance?.approvalStatus ?? null) : null,
        ...(isMaster ? { isHidden: hiddenMap.get(m.usrId) || false } : {}),
      };
    });

    const summary = {
      totalMembers: memberSummaries.length,
      totalTodayDue: memberSummaries.reduce((s, m) => s + m.todayDueCount, 0),
      totalOverdue: memberSummaries.reduce((s, m) => s + m.overdueCount, 0),
      totalInProgress: memberSummaries.reduce((s, m) => s + m.inProgressCount, 0),
      totalIssues: memberSummaries.reduce((s, m) => s + m.issueCount, 0),
    };

    return { members: memberSummaries, summary };
  }

  async getTeamToday(userId: string, entityId: string, timezone?: string, callerRole?: string): Promise<TeamTodayResponse> {
    // 사용자의 활성 Unit 소속 조회 (현재 Entity 기준)
    const userRoles = await this.userUnitRoleRepo
      .createQueryBuilder('uur')
      .innerJoin(UnitEntity, 'u', 'u.unt_id = uur.unt_id')
      .where('uur.usr_id = :userId', { userId })
      .andWhere('uur.uur_ended_at IS NULL')
      .andWhere('u.ent_id = :entityId', { entityId })
      .andWhere('u.unt_is_active = true')
      .select('uur.unt_id', 'untId')
      .getRawMany<{ untId: string }>();

    const unitIds = [...new Set(userRoles.map((r) => r.untId))];

    if (unitIds.length === 0) {
      return { members: [], summary: { totalMembers: 0, totalTodayDue: 0, totalOverdue: 0, totalInProgress: 0, totalIssues: 0 } };
    }

    // 같은 Unit(들)의 활성 소속 멤버 조회
    const unitMembers = await this.userUnitRoleRepo
      .createQueryBuilder('uur')
      .innerJoin(UnitEntity, 'u', 'u.unt_id = uur.unt_id')
      .where('uur.unt_id IN (:...unitIds)', { unitIds })
      .andWhere('uur.uur_ended_at IS NULL')
      .andWhere('u.ent_id = :entityId', { entityId })
      .andWhere('u.unt_is_active = true')
      .select('uur.usr_id', 'usrId')
      .getRawMany<{ usrId: string }>();

    const userIds = [...new Set(unitMembers.map((m) => m.usrId))];

    if (userIds.length === 0) {
      return { members: [], summary: { totalMembers: 0, totalTodayDue: 0, totalOverdue: 0, totalInProgress: 0, totalIssues: 0 } };
    }

    // EntityUserRole에서 사용자 정보 가져오기
    const eurMembers = await this.eurRepo.find({
      where: { entId: entityId, usrId: In(userIds), eurStatus: 'ACTIVE' },
    });

    if (eurMembers.length === 0) {
      return { members: [], summary: { totalMembers: 0, totalTodayDue: 0, totalOverdue: 0, totalInProgress: 0, totalIssues: 0 } };
    }

    const eurUserIds = eurMembers.map((m) => m.usrId);

    // User 정보 조회 (ACTIVE 사용자만)
    const users = await this.userRepo.find({ where: { usrId: In(eurUserIds), usrStatus: 'ACTIVE' } });
    const userMap = new Map(users.map((u) => [u.usrId, u]));

    // ACTIVE 사용자만 필터링
    const activeUserIds = users.map((u) => u.usrId);
    const activeEurMembers = eurMembers.filter((m) => activeUserIds.includes(m.usrId));

    // MASTER가 아닌 경우 hidden 사용자 제외
    const isMaster = callerRole === 'MASTER';
    const visibleMembers = isMaster
      ? activeEurMembers
      : activeEurMembers.filter((m) => !m.eurHiddenFromToday);

    if (visibleMembers.length === 0) {
      return { members: [], summary: { totalMembers: 0, totalTodayDue: 0, totalOverdue: 0, totalInProgress: 0, totalIssues: 0 } };
    }

    const visibleUserIds = visibleMembers.map((m) => m.usrId);
    const hiddenMap = new Map(activeEurMembers.map((m) => [m.usrId, m.eurHiddenFromToday]));
    const today = getLocalToday(timezone);

    const [todoCounts, issueData, todosByUser, missionsByUser, attendanceByUser] = await Promise.all([
      this.getTodoCountsByUsers(visibleUserIds, entityId),
      this.getIssueDataByUsers(visibleUserIds, entityId),
      this.getTodoItemsByUsers(visibleUserIds, entityId),
      this.getMissionsByUsers(visibleUserIds, today),
      this.getAttendanceByUsers(visibleUserIds, today, entityId),
    ]);

    const employees = await this.employeeRepo.find({
      where: { entId: entityId, usrId: In(visibleUserIds) },
    });
    const empMap = new Map(employees.map((e) => [e.usrId, e]));

    // Unit 정보 조회
    const unitNameMap = await this.getUnitNamesByUsers(visibleUserIds, entityId);

    // Cell 정보 조회
    const cellInfoMap = await this.getCellInfoByUsers(visibleUserIds);

    const memberSummaries: MemberTodaySummary[] = visibleMembers.map((m) => {
      const tc = todoCounts.get(m.usrId) || { todayDue: 0, overdue: 0, inProgress: 0 };
      const id = issueData.get(m.usrId);
      const emp = empMap.get(m.usrId);
      const user = userMap.get(m.usrId);
      const userTodos = todosByUser.get(m.usrId) || { todayDue: [], overdue: [], inProgress: [] };
      const attendance = attendanceByUser.get(m.usrId);
      const cellInfo = cellInfoMap.get(m.usrId);
      return {
        userId: m.usrId,
        userName: user?.usrName || '',
        email: user?.usrEmail || '',
        role: m.eurRole,
        department: emp?.empDepartment || undefined,
        position: emp?.empPosition || undefined,
        unitName: unitNameMap.get(m.usrId) || undefined,
        cellIds: cellInfo?.cellIds || [],
        cellNames: cellInfo?.cellNames || [],
        todayDueCount: tc.todayDue,
        overdueCount: tc.overdue,
        inProgressCount: tc.inProgress,
        issueCount: id?.issueCount || 0,
        todayDueTodos: userTodos.todayDue,
        overdueTodos: userTodos.overdue,
        inProgressTodos: userTodos.inProgress,
        recentIssues: (id?.recentIssues || []).slice(0, 10),
        issueTotal4w: id?.issueTotal4w || 0,
        issueResolved4w: id?.issueResolved4w || 0,
        toReviewCount: id?.toReviewCount || 0,
        issueInProgressCount: id?.inProgressCount || 0,
        toReviewIssues: id?.toReviewIssues || [],
        inProgressIssues: id?.inProgressIssues || [],
        missionContent: missionsByUser.get(m.usrId) ?? null,
        todayAttendanceType: attendance?.type ?? null,
        todayAttendanceId: attendance?.id ?? null,
        todayAttendanceApproval: attendance?.type === 'REMOTE' ? (attendance?.approvalStatus ?? null) : null,
        ...(isMaster ? { isHidden: hiddenMap.get(m.usrId) || false } : {}),
      };
    });

    const summary = {
      totalMembers: memberSummaries.length,
      totalTodayDue: memberSummaries.reduce((s, m) => s + m.todayDueCount, 0),
      totalOverdue: memberSummaries.reduce((s, m) => s + m.overdueCount, 0),
      totalInProgress: memberSummaries.reduce((s, m) => s + m.inProgressCount, 0),
      totalIssues: memberSummaries.reduce((s, m) => s + m.issueCount, 0),
    };

    return { members: memberSummaries, summary };
  }

  async getCellToday(userId: string, entityId: string, timezone?: string, callerRole?: string): Promise<TeamTodayResponse> {
    // 사용자 소속 Cell 조회
    const userCells = await this.userCellRepo.find({ where: { usrId: userId } });
    const cellIds = [...new Set(userCells.map((c) => c.celId))];

    if (cellIds.length === 0) {
      return { members: [], summary: { totalMembers: 0, totalTodayDue: 0, totalOverdue: 0, totalInProgress: 0, totalIssues: 0 } };
    }

    // 같은 Cell 소속 멤버 조회
    const cellMembers = await this.userCellRepo.find({ where: { celId: In(cellIds) } });
    const userIds = [...new Set(cellMembers.map((m) => m.usrId))];

    if (userIds.length === 0) {
      return { members: [], summary: { totalMembers: 0, totalTodayDue: 0, totalOverdue: 0, totalInProgress: 0, totalIssues: 0 } };
    }

    // EntityUserRole에서 사용자 정보 가져오기
    const eurMembers = await this.eurRepo.find({
      where: { entId: entityId, usrId: In(userIds), eurStatus: 'ACTIVE' },
    });

    if (eurMembers.length === 0) {
      return { members: [], summary: { totalMembers: 0, totalTodayDue: 0, totalOverdue: 0, totalInProgress: 0, totalIssues: 0 } };
    }

    const eurUserIds = eurMembers.map((m) => m.usrId);
    const users = await this.userRepo.find({ where: { usrId: In(eurUserIds), usrStatus: 'ACTIVE' } });
    const userMap = new Map(users.map((u) => [u.usrId, u]));
    const activeUserIds = users.map((u) => u.usrId);
    const activeEurMembers = eurMembers.filter((m) => activeUserIds.includes(m.usrId));

    const isMaster = callerRole === 'MASTER';
    const visibleMembers = isMaster
      ? activeEurMembers
      : activeEurMembers.filter((m) => !m.eurHiddenFromToday);

    if (visibleMembers.length === 0) {
      return { members: [], summary: { totalMembers: 0, totalTodayDue: 0, totalOverdue: 0, totalInProgress: 0, totalIssues: 0 } };
    }

    const visibleUserIds = visibleMembers.map((m) => m.usrId);
    const hiddenMap = new Map(activeEurMembers.map((m) => [m.usrId, m.eurHiddenFromToday]));
    const today = getLocalToday(timezone);

    const [todoCounts, issueData, todosByUser, missionsByUser, attendanceByUser] = await Promise.all([
      this.getTodoCountsByUsers(visibleUserIds, entityId),
      this.getIssueDataByUsers(visibleUserIds, entityId),
      this.getTodoItemsByUsers(visibleUserIds, entityId),
      this.getMissionsByUsers(visibleUserIds, today),
      this.getAttendanceByUsers(visibleUserIds, today, entityId),
    ]);

    const employees = await this.employeeRepo.find({
      where: { entId: entityId, usrId: In(visibleUserIds) },
    });
    const empMap = new Map(employees.map((e) => [e.usrId, e]));

    // Unit 정보 조회
    const unitNameMap = await this.getUnitNamesByUsers(visibleUserIds, entityId);

    // Cell 정보 조회
    const cellInfoMap = await this.getCellInfoByUsers(visibleUserIds);

    // Cell 목록 (응답에 포함)
    const cells = await this.cellRepo.find({ where: { celId: In(cellIds) } });
    const cellList = cells.map((c) => ({ cellId: c.celId, cellName: c.celName }));

    const memberSummaries: MemberTodaySummary[] = visibleMembers.map((m) => {
      const tc = todoCounts.get(m.usrId) || { todayDue: 0, overdue: 0, inProgress: 0 };
      const id = issueData.get(m.usrId);
      const emp = empMap.get(m.usrId);
      const user = userMap.get(m.usrId);
      const userTodos = todosByUser.get(m.usrId) || { todayDue: [], overdue: [], inProgress: [] };
      const attendance = attendanceByUser.get(m.usrId);
      const cellInfo = cellInfoMap.get(m.usrId);
      return {
        userId: m.usrId,
        userName: user?.usrName || '',
        email: user?.usrEmail || '',
        role: m.eurRole,
        department: emp?.empDepartment || undefined,
        position: emp?.empPosition || undefined,
        unitName: unitNameMap.get(m.usrId) || undefined,
        cellIds: cellInfo?.cellIds || [],
        cellNames: cellInfo?.cellNames || [],
        todayDueCount: tc.todayDue,
        overdueCount: tc.overdue,
        inProgressCount: tc.inProgress,
        issueCount: id?.issueCount || 0,
        todayDueTodos: userTodos.todayDue,
        overdueTodos: userTodos.overdue,
        inProgressTodos: userTodos.inProgress,
        recentIssues: (id?.recentIssues || []).slice(0, 10),
        issueTotal4w: id?.issueTotal4w || 0,
        issueResolved4w: id?.issueResolved4w || 0,
        toReviewCount: id?.toReviewCount || 0,
        issueInProgressCount: id?.inProgressCount || 0,
        toReviewIssues: id?.toReviewIssues || [],
        inProgressIssues: id?.inProgressIssues || [],
        missionContent: missionsByUser.get(m.usrId) ?? null,
        todayAttendanceType: attendance?.type ?? null,
        todayAttendanceId: attendance?.id ?? null,
        todayAttendanceApproval: attendance?.type === 'REMOTE' ? (attendance?.approvalStatus ?? null) : null,
        ...(isMaster ? { isHidden: hiddenMap.get(m.usrId) || false } : {}),
      };
    });

    const summary = {
      totalMembers: memberSummaries.length,
      totalTodayDue: memberSummaries.reduce((s, m) => s + m.todayDueCount, 0),
      totalOverdue: memberSummaries.reduce((s, m) => s + m.overdueCount, 0),
      totalInProgress: memberSummaries.reduce((s, m) => s + m.inProgressCount, 0),
      totalIssues: memberSummaries.reduce((s, m) => s + m.issueCount, 0),
    };

    return { cells: cellList, members: memberSummaries, summary };
  }

  private async getUnitNamesByUsers(userIds: string[], entityId: string): Promise<Map<string, string>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.userUnitRoleRepo
      .createQueryBuilder('uur')
      .innerJoin(UnitEntity, 'u', 'u.unt_id = uur.unt_id')
      .where('uur.usr_id IN (:...userIds)', { userIds })
      .andWhere('uur.uur_ended_at IS NULL')
      .andWhere('u.ent_id = :entityId', { entityId })
      .andWhere('u.unt_is_active = true')
      .select('uur.usr_id', 'usrId')
      .addSelect('u.unt_name', 'unitName')
      .addSelect('uur.uur_is_primary', 'isPrimary')
      .orderBy('uur.uur_is_primary', 'DESC')
      .getRawMany<{ usrId: string; unitName: string; isPrimary: boolean }>();

    const map = new Map<string, string>();
    for (const r of rows) {
      if (!map.has(r.usrId)) map.set(r.usrId, r.unitName);
    }
    return map;
  }

  private async getCellInfoByUsers(
    userIds: string[],
  ): Promise<Map<string, { cellIds: string[]; cellNames: string[] }>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.userCellRepo
      .createQueryBuilder('uc')
      .innerJoin(CellEntity, 'c', 'c.cel_id = uc.cel_id')
      .where('uc.usr_id IN (:...userIds)', { userIds })
      .andWhere('c.cel_deleted_at IS NULL')
      .select('uc.usr_id', 'usrId')
      .addSelect('c.cel_id', 'cellId')
      .addSelect('c.cel_name', 'cellName')
      .getRawMany<{ usrId: string; cellId: string; cellName: string }>();

    const map = new Map<string, { cellIds: string[]; cellNames: string[] }>();
    for (const r of rows) {
      if (!map.has(r.usrId)) map.set(r.usrId, { cellIds: [], cellNames: [] });
      const entry = map.get(r.usrId)!;
      if (!entry.cellIds.includes(r.cellId)) {
        entry.cellIds.push(r.cellId);
        entry.cellNames.push(r.cellName);
      }
    }
    return map;
  }

  private async getTodoCountsByUsers(
    userIds: string[],
    entityId: string,
  ): Promise<Map<string, { todayDue: number; overdue: number; inProgress: number }>> {
    const rows = await this.todoRepo
      .createQueryBuilder('t')
      .select('t.usr_id', 'userId')
      .addSelect(`SUM(CASE WHEN t.tdo_due_date = CURRENT_DATE AND t.tdo_completed_at IS NULL THEN 1 ELSE 0 END)::int`, 'todayDue')
      .addSelect(`SUM(CASE WHEN t.tdo_due_date < CURRENT_DATE AND t.tdo_due_date IS NOT NULL AND t.tdo_completed_at IS NULL THEN 1 ELSE 0 END)::int`, 'overdue')
      .addSelect(`SUM(CASE WHEN t.tdo_completed_at IS NULL AND (t.tdo_start_date IS NULL OR t.tdo_start_date <= CURRENT_DATE) AND (t.tdo_due_date IS NULL OR t.tdo_due_date >= CURRENT_DATE) THEN 1 ELSE 0 END)::int`, 'inProgress')
      .where('t.usr_id IN (:...userIds)', { userIds })
      .andWhere('t.ent_id = :entityId', { entityId })
      .andWhere('t.tdo_deleted_at IS NULL')
      .groupBy('t.usr_id')
      .getRawMany();

    const map = new Map<string, { todayDue: number; overdue: number; inProgress: number }>();
    for (const r of rows) {
      map.set(r.userId, {
        todayDue: Number(r.todayDue) || 0,
        overdue: Number(r.overdue) || 0,
        inProgress: Number(r.inProgress) || 0,
      });
    }
    return map;
  }

  private async getIssueDataByUsers(
    userIds: string[],
    entityId: string,
  ): Promise<Map<string, {
    issueCount: number;
    issueTotal4w: number;
    issueResolved4w: number;
    toReviewCount: number;
    inProgressCount: number;
    toReviewIssues: MemberIssueItem[];
    inProgressIssues: MemberIssueItem[];
    recentIssues: MemberIssueItem[];
  }>> {
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const fourWeeksAgoStr = fourWeeksAgo.toISOString().split('T')[0];

    // 1) 4주간 총 이슈 건수 (reporter + assignee 별도 조회 후 합산)
    const [repTotal, assTotal, repRes, assRes] = await Promise.all([
      this.issueRepo.createQueryBuilder('i')
        .select('i.iss_reporter_id', 'userId').addSelect('COUNT(DISTINCT i.iss_id)::int', 'cnt')
        .where('i.iss_reporter_id IN (:...userIds)', { userIds })
        .andWhere('i.ent_id = :entityId', { entityId })
        .andWhere('i.iss_created_at >= :d', { d: fourWeeksAgoStr })
        .andWhere('i.iss_deleted_at IS NULL')
        .groupBy('i.iss_reporter_id').getRawMany(),
      this.issueRepo.createQueryBuilder('i')
        .select('i.iss_assignee_id', 'userId').addSelect('COUNT(DISTINCT i.iss_id)::int', 'cnt')
        .where('i.iss_assignee_id IN (:...userIds)', { userIds })
        .andWhere('i.ent_id = :entityId', { entityId })
        .andWhere('i.iss_created_at >= :d', { d: fourWeeksAgoStr })
        .andWhere('i.iss_deleted_at IS NULL')
        .groupBy('i.iss_assignee_id').getRawMany(),
      // 2) 4주간 해결 건수
      this.issueRepo.createQueryBuilder('i')
        .select('i.iss_reporter_id', 'userId').addSelect('COUNT(DISTINCT i.iss_id)::int', 'cnt')
        .where('i.iss_reporter_id IN (:...userIds)', { userIds })
        .andWhere('i.ent_id = :entityId', { entityId })
        .andWhere('i.iss_created_at >= :d', { d: fourWeeksAgoStr })
        .andWhere('i.iss_status IN (:...rs)', { rs: ['RESOLVED', 'CLOSED'] })
        .andWhere('i.iss_deleted_at IS NULL')
        .groupBy('i.iss_reporter_id').getRawMany(),
      this.issueRepo.createQueryBuilder('i')
        .select('i.iss_assignee_id', 'userId').addSelect('COUNT(DISTINCT i.iss_id)::int', 'cnt')
        .where('i.iss_assignee_id IN (:...userIds)', { userIds })
        .andWhere('i.ent_id = :entityId', { entityId })
        .andWhere('i.iss_created_at >= :d', { d: fourWeeksAgoStr })
        .andWhere('i.iss_status IN (:...rs)', { rs: ['RESOLVED', 'CLOSED'] })
        .andWhere('i.iss_deleted_at IS NULL')
        .groupBy('i.iss_assignee_id').getRawMany(),
    ]);

    const total4wMap = new Map<string, number>();
    for (const r of repTotal) total4wMap.set(r.userId, (total4wMap.get(r.userId) || 0) + (Number(r.cnt) || 0));
    for (const r of assTotal) if (r.userId) total4wMap.set(r.userId, (total4wMap.get(r.userId) || 0) + (Number(r.cnt) || 0));

    const resolved4wMap = new Map<string, number>();
    for (const r of repRes) resolved4wMap.set(r.userId, (resolved4wMap.get(r.userId) || 0) + (Number(r.cnt) || 0));
    for (const r of assRes) if (r.userId) resolved4wMap.set(r.userId, (resolved4wMap.get(r.userId) || 0) + (Number(r.cnt) || 0));

    // 3) 현재 활성 이슈 (OPEN, APPROVED, IN_PROGRESS) 상세 + 카운트
    const activeRows = await this.issueRepo
      .createQueryBuilder('i')
      .select(['i.iss_id', 'i.iss_title', 'i.iss_status', 'i.iss_severity', 'i.iss_created_at', 'i.iss_reporter_id', 'i.iss_assignee_id'])
      .where('(i.iss_reporter_id IN (:...userIds) OR i.iss_assignee_id IN (:...userIds))', { userIds })
      .andWhere('i.ent_id = :entityId', { entityId })
      .andWhere('i.iss_status IN (:...statuses)', { statuses: ['OPEN', 'APPROVED', 'IN_PROGRESS'] })
      .andWhere('i.iss_deleted_at IS NULL')
      .orderBy('i.iss_created_at', 'DESC')
      .getRawMany();

    type UserIssueData = {
      issueCount: number;
      issueTotal4w: number;
      issueResolved4w: number;
      toReviewCount: number;
      inProgressCount: number;
      toReviewIssues: MemberIssueItem[];
      inProgressIssues: MemberIssueItem[];
      recentIssues: MemberIssueItem[];
    };

    const map = new Map<string, UserIssueData>();
    const getOrCreate = (uid: string): UserIssueData => {
      if (!map.has(uid)) {
        map.set(uid, {
          issueCount: 0,
          issueTotal4w: total4wMap.get(uid) || 0,
          issueResolved4w: resolved4wMap.get(uid) || 0,
          toReviewCount: 0,
          inProgressCount: 0,
          toReviewIssues: [],
          inProgressIssues: [],
          recentIssues: [],
        });
      }
      return map.get(uid)!;
    };

    const seenByUser = new Map<string, Set<string>>();
    const addIssue = (uid: string, item: MemberIssueItem) => {
      if (!seenByUser.has(uid)) seenByUser.set(uid, new Set());
      const seen = seenByUser.get(uid)!;
      if (seen.has(item.issueId)) return;
      seen.add(item.issueId);

      const data = getOrCreate(uid);
      data.issueCount++;
      data.recentIssues.push(item);

      if (item.status === 'OPEN') {
        data.toReviewCount++;
        if (data.toReviewIssues.length < 5) data.toReviewIssues.push(item);
      } else if (item.status === 'APPROVED' || item.status === 'IN_PROGRESS') {
        data.inProgressCount++;
        if (data.inProgressIssues.length < 5) data.inProgressIssues.push(item);
      }
    };

    for (const r of activeRows) {
      const item: MemberIssueItem = {
        issueId: r.iss_id,
        title: r.iss_title,
        status: r.iss_status,
        severity: r.iss_severity,
        createdAt: r.iss_created_at?.toISOString?.()?.split('T')[0] || '',
      };
      if (r.iss_reporter_id && userIds.includes(r.iss_reporter_id)) addIssue(r.iss_reporter_id, item);
      if (r.iss_assignee_id && userIds.includes(r.iss_assignee_id)) addIssue(r.iss_assignee_id, item);
    }

    // Ensure 4-week stats are set even for users with no active issues
    for (const uid of userIds) {
      if (!map.has(uid) && (total4wMap.has(uid) || resolved4wMap.has(uid))) {
        getOrCreate(uid);
      }
    }

    return map;
  }

  private async getTodoItemsByUsers(
    userIds: string[],
    entityId: string,
  ): Promise<Map<string, { todayDue: MemberTodoItem[]; overdue: MemberTodoItem[]; inProgress: MemberTodoItem[] }>> {
    // 오늘 마감 할일 (전체)
    const todayDueRows = await this.todoRepo
      .createQueryBuilder('t')
      .select(['t.tdo_id', 't.tdo_title', 't.tdo_due_date', 't.tdo_status', 't.usr_id'])
      .where('t.usr_id IN (:...userIds)', { userIds })
      .andWhere('t.ent_id = :entityId', { entityId })
      .andWhere('t.tdo_due_date = CURRENT_DATE')
      .andWhere('t.tdo_completed_at IS NULL')
      .andWhere('t.tdo_deleted_at IS NULL')
      .orderBy('t.tdo_created_at', 'DESC')
      .getRawMany();

    // 지연 할일 (최근 3개씩)
    const overdueRows = await this.todoRepo
      .createQueryBuilder('t')
      .select(['t.tdo_id', 't.tdo_title', 't.tdo_due_date', 't.tdo_status', 't.usr_id'])
      .where('t.usr_id IN (:...userIds)', { userIds })
      .andWhere('t.ent_id = :entityId', { entityId })
      .andWhere('t.tdo_due_date < CURRENT_DATE')
      .andWhere('t.tdo_due_date IS NOT NULL')
      .andWhere('t.tdo_completed_at IS NULL')
      .andWhere('t.tdo_deleted_at IS NULL')
      .orderBy('t.tdo_due_date', 'DESC')
      .getRawMany();

    // 진행 중 할일: 미완료 + 시작일 <= 오늘 + (마감일 없거나 >= 오늘) + 오늘 마감 제외(중복 방지)
    const inProgressRows = await this.todoRepo
      .createQueryBuilder('t')
      .select(['t.tdo_id', 't.tdo_title', 't.tdo_due_date', 't.tdo_status', 't.usr_id'])
      .where('t.usr_id IN (:...userIds)', { userIds })
      .andWhere('t.ent_id = :entityId', { entityId })
      .andWhere('t.tdo_completed_at IS NULL')
      .andWhere('t.tdo_deleted_at IS NULL')
      .andWhere('(t.tdo_start_date IS NULL OR t.tdo_start_date <= CURRENT_DATE)')
      .andWhere('(t.tdo_due_date IS NULL OR t.tdo_due_date >= CURRENT_DATE)')
      .andWhere('(t.tdo_due_date IS NULL OR t.tdo_due_date != CURRENT_DATE)')
      .orderBy('t.tdo_created_at', 'DESC')
      .getRawMany();

    const map = new Map<string, { todayDue: MemberTodoItem[]; overdue: MemberTodoItem[]; inProgress: MemberTodoItem[] }>();

    const toItem = (r: any): MemberTodoItem => ({
      todoId: r.tdo_id,
      title: r.tdo_title,
      dueDate: typeof r.tdo_due_date === 'string' ? r.tdo_due_date : r.tdo_due_date?.toISOString?.()?.split('T')[0] || '',
      status: r.tdo_status,
    });

    for (const r of todayDueRows) {
      if (!map.has(r.usr_id)) map.set(r.usr_id, { todayDue: [], overdue: [], inProgress: [] });
      map.get(r.usr_id)!.todayDue.push(toItem(r));
    }

    for (const r of overdueRows) {
      if (!map.has(r.usr_id)) map.set(r.usr_id, { todayDue: [], overdue: [], inProgress: [] });
      const entry = map.get(r.usr_id)!;
      if (entry.overdue.length < 3) {
        entry.overdue.push(toItem(r));
      }
    }

    for (const r of inProgressRows) {
      if (!map.has(r.usr_id)) map.set(r.usr_id, { todayDue: [], overdue: [], inProgress: [] });
      map.get(r.usr_id)!.inProgress.push(toItem(r));
    }

    return map;
  }

  async getMyIssues(userId: string, entityId: string): Promise<MemberIssueItem[]> {
    const rows = await this.issueRepo
      .createQueryBuilder('i')
      .select(['i.iss_id', 'i.iss_title', 'i.iss_status', 'i.iss_severity', 'i.iss_created_at'])
      .where('(i.iss_reporter_id = :userId OR i.iss_assignee_id = :userId)', { userId })
      .andWhere('i.ent_id = :entityId', { entityId })
      .andWhere('i.iss_status NOT IN (:...cs)', { cs: ['RESOLVED', 'CLOSED'] })
      .andWhere('i.iss_deleted_at IS NULL')
      .orderBy('i.iss_created_at', 'DESC')
      .limit(10)
      .getRawMany();

    return rows.map((r) => ({
      issueId: r.iss_id,
      title: r.iss_title,
      status: r.iss_status,
      severity: r.iss_severity,
      createdAt: r.iss_created_at?.toISOString?.()?.split('T')[0] || '',
    }));
  }

  private async getMissionsByUsers(
    userIds: string[],
    today: string,
  ): Promise<Map<string, string | null>> {
    const missions = await this.missionRepo.find({
      where: { usrId: In(userIds), msnDate: today },
    });
    const map = new Map<string, string | null>();
    for (const m of missions) {
      map.set(m.usrId, m.msnContent);
    }
    return map;
  }

  private async getAttendanceByUsers(
    userIds: string[],
    today: string,
    entityId: string,
  ): Promise<Map<string, { id: string; type: string; approvalStatus: string }>> {
    if (userIds.length === 0) return new Map();
    const rows = await this.attendanceRepo
      .createQueryBuilder('att')
      .select(['att.att_id', 'att.usr_id', 'att.att_type', 'att.att_approval_status'])
      .where('att.usr_id IN (:...userIds)', { userIds })
      .andWhere('att.att_date = :today', { today })
      .andWhere('att.ent_id = :entityId', { entityId })
      .andWhere('att.att_deleted_at IS NULL')
      .getRawMany();

    const map = new Map<string, { id: string; type: string; approvalStatus: string }>();
    for (const r of rows) {
      map.set(r.usr_id, {
        id: r.att_id,
        type: r.att_type,
        approvalStatus: r.att_approval_status || 'APPROVED',
      });
    }
    return map;
  }

  // ─── Hide/Unhide Member ──────────────────────────────

  async toggleMemberHidden(entityId: string, targetUserId: string, hidden: boolean): Promise<{ userId: string; hidden: boolean }> {
    await this.eurRepo.update(
      { entId: entityId, usrId: targetUserId },
      { eurHiddenFromToday: hidden },
    );
    return { userId: targetUserId, hidden };
  }

  // ─── AI Analysis ──────────────────────────────────────

  private getLanguageInstruction(lang?: string): string {
    const langMap: Record<string, string> = { ko: 'Korean', en: 'English', vi: 'Vietnamese' };
    return `Write your response in ${langMap[lang || 'en'] || 'English'}.`;
  }

  myAiAnalysis(
    myData: MyTodayResponse,
    issues: MemberIssueItem[],
    entityId: string,
    userId: string,
    lang?: string,
  ): Observable<{ type: string; content: string }> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const langInstruction = this.getLanguageInstruction(lang);

          const todayDueLines = myData.todayDue.length > 0
            ? myData.todayDue.map((t) => `- [${t.status}] ${t.title} (Due: ${t.dueDate})`).join('\n')
            : 'None';

          const overdueLines = myData.overdue.length > 0
            ? myData.overdue.map((t) => `- [${t.status}] ${t.title} (Due: ${t.dueDate})`).join('\n')
            : 'None';

          const inProgressLines = myData.inProgress.length > 0
            ? myData.inProgress.map((t) => `- [${t.status}] ${t.title} (Due: ${t.dueDate})`).join('\n')
            : 'None';

          const issueLines = issues.length > 0
            ? issues.map((i) => `- [${i.severity}/${i.status}] ${i.title}`).join('\n')
            : 'None';

          const systemPrompt = `You are a personal work coach and manager advisor. Analyze the individual's current workload and provide objective, actionable guidance.
${langInstruction} Use well-structured markdown formatting with headings (##, ###), bullet points, bold text, and tables where appropriate.
Do NOT use any emojis in the output. Use plain text markers like [HIGH], [MEDIUM], [LOW] instead. Be specific, practical, and motivating.`;

          const userMessage = `Analyze the following **My Work Status** data and write an objective work status diagnosis and focus guide from a manager's perspective.

## Work Summary Statistics
- Today's due tasks: ${myData.summary.todayDueCount}
- Overdue items: ${myData.summary.overdueCount}
- In progress: ${myData.summary.inProgressCount}
- Completed today: ${myData.summary.completedTodayCount}
- Open issues: ${myData.summary.issueCount}

## Today's Due Tasks
${todayDueLines}

## Overdue Items
${overdueLines}

## In Progress Tasks
${inProgressLines}

## Related Issues
${issueLines}

Based on the above data, write a **Personal Work Coaching Report** including the following sections:

## 1. Current Work Status Diagnosis
(Workload level assessment: overloaded/adequate/light, severity of delays, overall work health)

## 2. Today's Priority Focus
(Priority tasks that must be handled today, with specific reasons)

## 3. Overdue Item Response Strategy
(Solutions per overdue item, priority adjustment suggestions, when to ask for help)

## 4. Issue Handling Guide
(Response order by issue severity, suggested resolution approaches)

## 5. Work Efficiency Improvement Suggestions
(Time management tips, workload distribution adjustments, bottleneck resolution)

## 6. Today's Action Plan
(5-7 specific action items organized chronologically)`;

          const stream$ = this.claudeService.streamMessage(
            systemPrompt,
            [{ role: 'user', content: userMessage }],
            { entId: entityId, usrId: userId, sourceType: 'TODAY_MY_AI_ANALYSIS' },
          );

          stream$.subscribe({
            next: (event: ClaudeStreamEvent) => {
              if (event.type === 'content' && event.content) {
                subscriber.next({ type: 'content', content: event.content });
              } else if (event.type === 'done') {
                subscriber.next({ type: 'done', content: '' });
              } else if (event.type === 'error') {
                subscriber.next({ type: 'error', content: event.error || 'Unknown error' });
              }
            },
            error: (err) => {
              subscriber.next({ type: 'error', content: err.message || 'Stream error' });
              subscriber.complete();
            },
            complete: () => subscriber.complete(),
          });
        } catch (err) {
          subscriber.next({ type: 'error', content: err instanceof Error ? err.message : 'Internal error' });
          subscriber.complete();
        }
      })();
    });
  }

  aiAnalysis(
    members: MemberTodaySummary[],
    summary: AllTodayResponse['summary'],
    scope: string,
    entityId: string,
    userId: string,
    lang?: string,
  ): Observable<{ type: string; content: string }> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const langInstruction = this.getLanguageInstruction(lang);
          const scopeLabel = scope === 'team' ? 'Team (Cell)' : 'Organization';

          const memberLines = members.map((m) =>
            `| ${m.userName} | ${m.department || '-'} | ${m.position || '-'} | ${m.todayDueCount} | ${m.overdueCount} | ${m.inProgressCount} | ${m.issueCount} |`,
          ).join('\n');

          const overloadedMembers = members
            .filter((m) => m.todayDueCount + m.overdueCount + m.inProgressCount >= 5 || m.overdueCount >= 3)
            .map((m) => `- ${m.userName}: Due today ${m.todayDueCount}, Overdue ${m.overdueCount}, In progress ${m.inProgressCount}, Issues ${m.issueCount}`)
            .join('\n') || 'None';

          const idleMembers = members
            .filter((m) => m.todayDueCount + m.overdueCount + m.inProgressCount === 0 && m.issueCount === 0)
            .map((m) => `- ${m.userName} (${m.department || '-'})`)
            .join('\n') || 'None';

          const systemPrompt = `You are a team management analyst. Analyze the team workload data and provide actionable insights for managers.
${langInstruction} Use well-structured markdown formatting with headings (##, ###), bullet points, bold text, and tables where appropriate.
Do NOT use any emojis in the output. Use plain text markers like [HIGH], [MEDIUM], [LOW] instead. Be specific and actionable.`;

          const userMessage = `Analyze the following ${scopeLabel} employee workload data and write a management report.

## Overall Summary
- Total members: ${summary.totalMembers}
- Today's due tasks: ${summary.totalTodayDue}
- Overdue items: ${summary.totalOverdue}
- In progress: ${summary.totalInProgress}
- Open issues: ${summary.totalIssues}

## Per-Member Status
| Name | Department | Position | Due Today | Overdue | In Progress | Issues |
|------|-----------|----------|-----------|---------|-------------|--------|
${memberLines}

## Overloaded Members (Criteria: due+overdue+in-progress >= 5 or overdue >= 3)
${overloadedMembers}

## Idle Members (No tasks/issues)
${idleMembers}

Based on the above data, write an analysis report including the following sections:

## 1. Overall Status Summary
(Key metrics and overall work situation assessment)

## 2. Workload Analysis
(Identify overloaded/idle employees, workload distribution imbalance analysis)

## 3. Overdue Items Analysis
(Employees with many overdue items, estimated causes, resolution suggestions)

## 4. Issue Status
(Employees with concentrated issues, issue handling status)

## 5. Workload Adjustment Suggestions
(Specific workload redistribution plans, priority adjustment suggestions)

## 6. Manager Action Items
(3-5 items requiring immediate action)`;

          const stream$ = this.claudeService.streamMessage(
            systemPrompt,
            [{ role: 'user', content: userMessage }],
            { entId: entityId, usrId: userId, sourceType: 'TODAY_AI_ANALYSIS' },
          );

          stream$.subscribe({
            next: (event: ClaudeStreamEvent) => {
              if (event.type === 'content' && event.content) {
                subscriber.next({ type: 'content', content: event.content });
              } else if (event.type === 'done') {
                subscriber.next({ type: 'done', content: '' });
              } else if (event.type === 'error') {
                subscriber.next({ type: 'error', content: event.error || 'Unknown error' });
              }
            },
            error: (err) => {
              subscriber.next({ type: 'error', content: err.message || 'Stream error' });
              subscriber.complete();
            },
            complete: () => subscriber.complete(),
          });
        } catch (err) {
          subscriber.next({ type: 'error', content: err instanceof Error ? err.message : 'Internal error' });
          subscriber.complete();
        }
      })();
    });
  }

  // ─── Reports ──────────────────────────────────────────

  async getReports(entityId: string, scope?: string) {
    const where: any = { entId: entityId, tdrDeletedAt: IsNull() };
    if (scope) where.tdrScope = scope;
    const reports = await this.reportRepo.find({ where, order: { tdrCreatedAt: 'DESC' } });
    return reports.map((r) => ({
      reportId: r.tdrId,
      title: r.tdrTitle,
      content: r.tdrContent,
      scope: r.tdrScope,
      createdAt: r.tdrCreatedAt,
    }));
  }

  async saveReport(data: { entityId: string; userId: string; title: string; content: string; scope: string }) {
    const report = this.reportRepo.create({
      entId: data.entityId,
      usrId: data.userId,
      tdrTitle: data.title,
      tdrContent: data.content,
      tdrScope: data.scope,
    });
    const saved = await this.reportRepo.save(report);
    return { reportId: saved.tdrId, title: saved.tdrTitle, content: saved.tdrContent, scope: saved.tdrScope, createdAt: saved.tdrCreatedAt };
  }

  async deleteReport(reportId: string, entityId: string) {
    await this.reportRepo.softDelete({ tdrId: reportId, entId: entityId });
  }

  private toTodoSummary = (todo: TodoEntity): TodoSummaryItem => ({
    todoId: todo.tdoId,
    title: todo.tdoTitle,
    status: todo.tdoStatus,
    dueDate: typeof todo.tdoDueDate === 'string' ? todo.tdoDueDate : todo.tdoDueDate?.toISOString?.()?.split('T')[0] || '',
    visibility: todo.tdoVisibility,
    userName: todo.user?.usrName || '',
    userId: todo.usrId,
  });
}
