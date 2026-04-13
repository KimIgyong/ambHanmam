import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, IsNull, LessThan, Between, Raw } from 'typeorm';
import { TodaySnapshotEntity } from '../entity/today-snapshot.entity';
import { DailyMissionEntity } from '../entity/daily-mission.entity';
import { TodaySnapshotMemoEntity } from '../entity/today-snapshot-memo.entity';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { CalendarEntity } from '../../calendar/entity/calendar.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { getLocalToday } from '../../../global/util/date.util';

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    @InjectRepository(TodaySnapshotEntity)
    private readonly snapshotRepo: Repository<TodaySnapshotEntity>,
    @InjectRepository(TodaySnapshotMemoEntity)
    private readonly memoRepo: Repository<TodaySnapshotMemoEntity>,
    @InjectRepository(DailyMissionEntity)
    private readonly missionRepo: Repository<DailyMissionEntity>,
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    @InjectRepository(CalendarEntity)
    private readonly calendarRepo: Repository<CalendarEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  /**
   * 미션 저장 시 스냅샷 자동 생성 (UPSERT)
   */
  async createSnapshot(userId: string, entityId: string, msnId: string, timezone?: string): Promise<TodaySnapshotEntity> {
    const today = getLocalToday(timezone);

    // 병렬 수집
    const [mission, todos, issues, schedules, user] = await Promise.all([
      this.missionRepo.findOne({ where: { msnId } }),
      this.collectTodos(userId, entityId, today),
      this.collectIssues(userId, entityId),
      this.collectSchedules(userId, today),
      this.userRepo.findOne({ where: { usrId: userId } }),
    ]);

    const userName = user?.usrName || 'Unknown';
    const d = new Date();
    const title = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 · ${userName}'s Today`;

    const snapshotData = {
      mission: mission ? {
        content: mission.msnContent,
        checkResult: mission.msnCheckResult,
        checkScore: mission.msnCheckScore,
      } : null,
      todos,
      issues,
      schedules,
      capturedAt: new Date().toISOString(),
    };

    // UPSERT: usr_id + snp_date unique
    const existing = await this.snapshotRepo.findOne({
      where: { usrId: userId, snpDate: today },
    });

    if (existing) {
      existing.msnId = msnId;
      existing.snpTitle = title;
      existing.snpData = snapshotData;
      existing.snpCapturedAt = new Date();
      return this.snapshotRepo.save(existing);
    }

    return this.snapshotRepo.save(this.snapshotRepo.create({
      entId: entityId,
      usrId: userId,
      msnId: msnId,
      snpDate: today,
      snpTitle: title,
      snpData: snapshotData,
      snpCapturedAt: new Date(),
    }));
  }

  /**
   * 달력 조회: 월별 스냅샷 요약
   */
  async getCalendar(userId: string, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const snapshots = await this.snapshotRepo.find({
      where: {
        usrId: userId,
        snpDate: Raw((alias) => `${alias} >= :start AND ${alias} < :end`, {
          start: startDate,
          end: endDate,
        }),
      },
      order: { snpDate: 'ASC' },
    });

    // 미션 조회 (체크 결과)
    const msnIds = snapshots.map((s) => s.msnId).filter(Boolean);
    const missions = msnIds.length > 0
      ? await this.missionRepo.find({ where: { msnId: In(msnIds) } })
      : [];
    const missionMap = new Map(missions.map((m) => [m.msnId, m]));

    // 메모 카운트
    const snpIds = snapshots.map((s) => s.snpId);
    const memoCounts = snpIds.length > 0
      ? await this.memoRepo
          .createQueryBuilder('m')
          .select('m.snp_id', 'snpId')
          .addSelect('COUNT(*)', 'count')
          .where('m.snp_id IN (:...snpIds)', { snpIds })
          .andWhere('m.smo_deleted_at IS NULL')
          .groupBy('m.snp_id')
          .getRawMany()
      : [];
    const memoCountMap = new Map(memoCounts.map((r) => [r.snpId, parseInt(r.count)]));

    return {
      year,
      month,
      days: snapshots.map((s) => {
        const mission = missionMap.get(s.msnId);
        return {
          date: s.snpDate,
          snpId: s.snpId,
          checkResult: mission?.msnCheckResult || null,
          checkScore: mission?.msnCheckScore || null,
          memoCount: memoCountMap.get(s.snpId) || 0,
          hasSnapshot: true,
        };
      }),
    };
  }

  /**
   * 스냅샷 상세 조회
   */
  async getDetail(userId: string, date: string) {
    const snapshot = await this.snapshotRepo.findOne({
      where: { usrId: userId, snpDate: date },
    });

    if (!snapshot) return null;

    const memos = await this.memoRepo.find({
      where: { snpId: snapshot.snpId },
      order: { smoOrder: 'ASC' },
      withDeleted: false,
    });

    // 이전/다음 스냅샷 날짜
    const [prev, next] = await Promise.all([
      this.snapshotRepo.findOne({
        where: {
          usrId: userId,
          snpDate: Raw((alias) => `${alias} < :date`, { date }),
        },
        order: { snpDate: 'DESC' },
        select: ['snpDate'],
      }),
      this.snapshotRepo.findOne({
        where: {
          usrId: userId,
          snpDate: Raw((alias) => `${alias} > :date`, { date }),
        },
        order: { snpDate: 'ASC' },
        select: ['snpDate'],
      }),
    ]);

    return {
      snpId: snapshot.snpId,
      snpDate: snapshot.snpDate,
      snpTitle: snapshot.snpTitle,
      snpData: snapshot.snpData,
      snpCapturedAt: snapshot.snpCapturedAt,
      memos: memos.map((m) => ({
        smoId: m.smoId,
        usrId: m.usrId,
        smoContent: m.smoContent,
        smoOrder: m.smoOrder,
        smoCreatedAt: m.smoCreatedAt,
        smoUpdatedAt: m.smoUpdatedAt,
      })),
      prevDate: prev?.snpDate || null,
      nextDate: next?.snpDate || null,
    };
  }

  // ─── Private: Data Collectors ─────────────────────────

  private async collectTodos(userId: string, entityId: string, today: string) {
    const todos = await this.todoRepo.find({
      where: [
        // 미완료 할일
        { usrId: userId, entId: entityId, tdoStatus: Not('COMPLETED') },
        // 오늘 완료한 할일
        {
          usrId: userId, entId: entityId, tdoStatus: 'COMPLETED',
          tdoCompletedAt: Raw((alias) => `DATE(${alias}) = :today`, { today }),
        },
      ],
      order: { tdoDueDate: 'ASC' },
    });

    const overdue: any[] = [];
    const todayDue: any[] = [];
    const inProgress: any[] = [];
    const scheduled: any[] = [];
    const completedToday: any[] = [];

    for (const t of todos) {
      const item = {
        tdoId: t.tdoId,
        title: t.tdoTitle,
        status: t.tdoStatus,
        dueDate: t.tdoDueDate,
        tags: t.tdoTags,
        completedAt: t.tdoCompletedAt,
        startedAt: t.tdoStartedAt,
      };
      if (t.tdoStatus === 'COMPLETED') {
        completedToday.push(item);
      } else if (t.tdoStatus === 'IN_PROGRESS') {
        inProgress.push(item);
      } else {
        const dueStr = t.tdoDueDate?.toString().split('T')[0];
        if (dueStr && dueStr < today) {
          overdue.push(item);
        } else if (dueStr === today) {
          todayDue.push(item);
        } else {
          scheduled.push(item);
        }
      }
    }

    return { overdue, todayDue, inProgress, scheduled, completedToday };
  }

  private async collectIssues(userId: string, entityId: string) {
    // 등록한 이슈
    const reported = await this.issueRepo.find({
      where: {
        issReporterId: userId, entId: entityId,
        issStatus: Not(In(['CLOSED', 'RESOLVED'])),
      },
    });

    // 담당 이슈
    const assigned = await this.issueRepo.find({
      where: {
        issAssigneeId: userId, entId: entityId,
        issStatus: Not(In(['CLOSED', 'RESOLVED'])),
      },
    });

    const mapIssue = (i: any, role: string) => ({
      issId: i.issId,
      title: i.issTitle,
      type: i.issType,
      severity: i.issSeverity,
      status: i.issStatus,
      priority: i.issPriority,
      dueDate: i.issDueDate,
      role,
    });

    // 중복 제거 (동일 이슈가 등록+담당 모두인 경우)
    const seenIds = new Set<string>();
    const result: any[] = [];

    for (const i of reported) {
      seenIds.add(i.issId);
      result.push(mapIssue(i, 'REPORTER'));
    }
    for (const i of assigned) {
      if (!seenIds.has(i.issId)) {
        result.push(mapIssue(i, 'ASSIGNEE'));
      } else {
        // 등록 + 담당 둘 다인 경우 BOTH
        const existing = result.find((r) => r.issId === i.issId);
        if (existing) existing.role = 'BOTH';
      }
    }

    return result;
  }

  private async collectSchedules(userId: string, today: string) {
    const dayStart = `${today}T00:00:00`;
    const dayEnd = `${today}T23:59:59`;

    const schedules = await this.calendarRepo.find({
      where: {
        usrId: userId,
        calStartAt: Raw((alias) => `${alias} >= :start AND ${alias} <= :end`, {
          start: dayStart,
          end: dayEnd,
        }),
      },
      order: { calStartAt: 'ASC' },
    });

    return schedules.map((s) => ({
      calId: s.calId,
      title: s.calTitle,
      startAt: s.calStartAt,
      endAt: s.calEndAt,
      isAllDay: s.calIsAllDay,
      location: s.calLocation,
      category: s.calCategory,
      color: s.calColor,
    }));
  }
}
