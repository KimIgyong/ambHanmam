import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { TodoStatusLogEntity } from '../../todo/entity/todo-status-log.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { IssueStatusLogEntity } from '../../issues/entity/issue-status-log.entity';
import { DailyMissionEntity } from '../../today/entity/daily-mission.entity';
import { TodayReportEntity } from '../../today/entity/today-report.entity';

export interface DailyAggregation {
  date: string;
  userId: string;
  mission: {
    content: string | null;
    checkResult: string | null;
    checkScore: number | null;
    registeredLines: any[];
  } | null;
  todos: {
    created: number;
    started: number;
    completed: number;
    cancelled: number;
    total: number;
    overdue: number;
    completedItems: Array<{ id: string; title: string; completedAt: string }>;
    overdueItems: Array<{ id: string; title: string; dueDate: string; status: string }>;
    inProgressItems: Array<{ id: string; title: string; dueDate: string | null }>;
  };
  issues: {
    created: number;
    resolved: number;
    closed: number;
    statusChanges: Array<{ issueId: string; title: string; from: string; to: string; changedAt: string }>;
    assignedActive: Array<{ id: string; title: string; severity: string; status: string; doneRatio: number }>;
  };
  aiCoaching: {
    reports: Array<{ id: string; title: string; scope: string; createdAt: string }>;
  };
}

export interface WeeklyAggregation {
  periodStart: string;
  periodEnd: string;
  userId: string;
  dailyBreakdown: DailyAggregation[];
  summary: {
    totalTodosCreated: number;
    totalTodosCompleted: number;
    totalTodosCancelled: number;
    totalOverdue: number;
    completionRate: number;
    totalIssuesCreated: number;
    totalIssuesResolved: number;
    totalIssuesClosed: number;
    avgMissionScore: number | null;
    missionDays: number;
    aiCoachingCount: number;
  };
}

@Injectable()
export class ReportAggregatorService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    @InjectRepository(TodoStatusLogEntity)
    private readonly todoStatusLogRepo: Repository<TodoStatusLogEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    @InjectRepository(IssueStatusLogEntity)
    private readonly issueStatusLogRepo: Repository<IssueStatusLogEntity>,
    @InjectRepository(DailyMissionEntity)
    private readonly missionRepo: Repository<DailyMissionEntity>,
    @InjectRepository(TodayReportEntity)
    private readonly todayReportRepo: Repository<TodayReportEntity>,
  ) {}

  async aggregateDaily(userId: string, entityId: string, date: string): Promise<DailyAggregation> {
    const dayStart = `${date} 00:00:00`;
    const dayEnd = `${date} 23:59:59`;

    const [mission, todoStatusLogs, todosCompletedToday, todosOverdue, todosInProgress, issueLogs, assignedIssues, aiReports] = await Promise.all([
      // 1. 미션
      this.missionRepo.findOne({ where: { usrId: userId, entId: entityId, msnDate: date } }),

      // 2. 당일 Todo 상태 변경 이력
      this.todoStatusLogRepo
        .createQueryBuilder('tsl')
        .innerJoin('tsl.todo', 'todo')
        .where('todo.usrId = :userId', { userId })
        .andWhere('todo.entId = :entityId', { entityId })
        .andWhere('tsl.tslChangedAt BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
        .getMany(),

      // 3. 당일 완료된 Todo
      this.todoRepo.find({
        where: { usrId: userId, entId: entityId },
        select: ['tdoId', 'tdoTitle', 'tdoCompletedAt'],
      }).then(todos => todos.filter(t =>
        t.tdoCompletedAt && t.tdoCompletedAt.toISOString().startsWith(date),
      )),

      // 4. Overdue (당일 기준 마감일 지남 + 미완료)
      this.todoRepo
        .createQueryBuilder('todo')
        .where('todo.usrId = :userId', { userId })
        .andWhere('todo.entId = :entityId', { entityId })
        .andWhere('todo.tdoDueDate < :date', { date })
        .andWhere('todo.tdoStatus NOT IN (:...done)', { done: ['DONE', 'CANCELLED'] })
        .andWhere('todo.tdoDeletedAt IS NULL')
        .select(['todo.tdoId', 'todo.tdoTitle', 'todo.tdoDueDate', 'todo.tdoStatus'])
        .getMany(),

      // 5. 진행중 Todo
      this.todoRepo
        .createQueryBuilder('todo')
        .where('todo.usrId = :userId', { userId })
        .andWhere('todo.entId = :entityId', { entityId })
        .andWhere('todo.tdoStatus = :status', { status: 'IN_PROGRESS' })
        .andWhere('todo.tdoDeletedAt IS NULL')
        .select(['todo.tdoId', 'todo.tdoTitle', 'todo.tdoDueDate'])
        .getMany(),

      // 6. 당일 Issue 상태 변경
      this.issueStatusLogRepo
        .createQueryBuilder('isl')
        .innerJoin('isl.issue', 'issue')
        .where('(issue.issReporterId = :userId OR issue.issAssigneeId = :userId)', { userId })
        .andWhere('issue.entId = :entityId', { entityId })
        .andWhere('isl.islCreatedAt BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
        .leftJoinAndSelect('isl.issue', 'i')
        .getMany(),

      // 7. 담당 이슈 (활성)
      this.issueRepo
        .createQueryBuilder('issue')
        .where('issue.issAssigneeId = :userId', { userId })
        .andWhere('issue.entId = :entityId', { entityId })
        .andWhere('issue.issStatus NOT IN (:...done)', { done: ['CLOSED', 'REJECTED'] })
        .andWhere('issue.issDeletedAt IS NULL')
        .select(['issue.issId', 'issue.issTitle', 'issue.issSeverity', 'issue.issStatus', 'issue.issDoneRatio'])
        .getMany(),

      // 8. AI 코칭 리포트
      this.todayReportRepo
        .createQueryBuilder('report')
        .where('report.usrId = :userId', { userId })
        .andWhere('report.entId = :entityId', { entityId })
        .andWhere('report.tdrCreatedAt BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
        .andWhere('report.tdrDeletedAt IS NULL')
        .select(['report.tdrId', 'report.tdrTitle', 'report.tdrScope', 'report.tdrCreatedAt'])
        .getMany(),
    ]);

    // 상태 변경 집계
    const statusCounts = { created: 0, started: 0, completed: 0, cancelled: 0 };
    for (const log of todoStatusLogs) {
      if (log.tslToStatus === 'DONE') statusCounts.completed++;
      else if (log.tslToStatus === 'IN_PROGRESS') statusCounts.started++;
      else if (log.tslToStatus === 'CANCELLED') statusCounts.cancelled++;
      if (log.tslFromStatus === 'SCHEDULED' && log.tslToStatus !== 'CANCELLED') statusCounts.created++;
    }

    // Issue 상태 변경 집계
    const issueCounts = { created: 0, resolved: 0, closed: 0 };
    const issueChanges: DailyAggregation['issues']['statusChanges'] = [];
    for (const log of issueLogs) {
      if (log.islToStatus === 'RESOLVED') issueCounts.resolved++;
      if (log.islToStatus === 'CLOSED') issueCounts.closed++;
      if (log.islFromStatus === 'OPEN') issueCounts.created++;
      issueChanges.push({
        issueId: log.issId,
        title: log.issue?.issTitle ?? '',
        from: log.islFromStatus,
        to: log.islToStatus,
        changedAt: log.islCreatedAt?.toISOString() ?? '',
      });
    }

    return {
      date,
      userId,
      mission: mission ? {
        content: mission.msnContent,
        checkResult: mission.msnCheckResult,
        checkScore: mission.msnCheckScore,
        registeredLines: mission.msnRegisteredLines,
      } : null,
      todos: {
        created: statusCounts.created,
        started: statusCounts.started,
        completed: statusCounts.completed,
        cancelled: statusCounts.cancelled,
        total: todosCompletedToday.length + todosOverdue.length + todosInProgress.length,
        overdue: todosOverdue.length,
        completedItems: todosCompletedToday.map(t => ({
          id: t.tdoId, title: t.tdoTitle, completedAt: t.tdoCompletedAt!.toISOString(),
        })),
        overdueItems: todosOverdue.map(t => ({
          id: t.tdoId, title: t.tdoTitle, dueDate: String(t.tdoDueDate), status: t.tdoStatus,
        })),
        inProgressItems: todosInProgress.map(t => ({
          id: t.tdoId, title: t.tdoTitle, dueDate: t.tdoDueDate ? String(t.tdoDueDate) : null,
        })),
      },
      issues: {
        created: issueCounts.created,
        resolved: issueCounts.resolved,
        closed: issueCounts.closed,
        statusChanges: issueChanges,
        assignedActive: assignedIssues.map(i => ({
          id: i.issId, title: i.issTitle, severity: i.issSeverity, status: i.issStatus, doneRatio: i.issDoneRatio,
        })),
      },
      aiCoaching: {
        reports: aiReports.map(r => ({
          id: r.tdrId, title: r.tdrTitle, scope: r.tdrScope, createdAt: r.tdrCreatedAt.toISOString(),
        })),
      },
    };
  }

  async aggregateWeekly(userId: string, entityId: string, periodStart: string, periodEnd: string): Promise<WeeklyAggregation> {
    // periodStart ~ periodEnd 사이 각 날짜별 집계
    const dates = this.getDateRange(periodStart, periodEnd);
    const dailyBreakdown = await Promise.all(
      dates.map(date => this.aggregateDaily(userId, entityId, date)),
    );

    // 주간 요약
    const summary = {
      totalTodosCreated: 0,
      totalTodosCompleted: 0,
      totalTodosCancelled: 0,
      totalOverdue: 0,
      completionRate: 0,
      totalIssuesCreated: 0,
      totalIssuesResolved: 0,
      totalIssuesClosed: 0,
      avgMissionScore: null as number | null,
      missionDays: 0,
      aiCoachingCount: 0,
    };

    let missionScoreSum = 0;
    let missionScoreCount = 0;

    for (const daily of dailyBreakdown) {
      summary.totalTodosCreated += daily.todos.created;
      summary.totalTodosCompleted += daily.todos.completed;
      summary.totalTodosCancelled += daily.todos.cancelled;
      summary.totalOverdue = Math.max(summary.totalOverdue, daily.todos.overdue); // 마지막 날 기준
      summary.totalIssuesCreated += daily.issues.created;
      summary.totalIssuesResolved += daily.issues.resolved;
      summary.totalIssuesClosed += daily.issues.closed;
      summary.aiCoachingCount += daily.aiCoaching.reports.length;

      if (daily.mission) {
        summary.missionDays++;
        if (daily.mission.checkScore != null) {
          missionScoreSum += daily.mission.checkScore;
          missionScoreCount++;
        }
      }
    }

    if (missionScoreCount > 0) {
      summary.avgMissionScore = Math.round(missionScoreSum / missionScoreCount);
    }

    const totalTasks = summary.totalTodosCreated + summary.totalTodosCompleted;
    summary.completionRate = totalTasks > 0
      ? Math.round((summary.totalTodosCompleted / totalTasks) * 100)
      : 0;

    // overdue는 기간 마지막 날 기준으로 재집계
    const lastDaily = dailyBreakdown[dailyBreakdown.length - 1];
    if (lastDaily) {
      summary.totalOverdue = lastDaily.todos.overdue;
    }

    return {
      periodStart,
      periodEnd,
      userId,
      dailyBreakdown,
      summary,
    };
  }

  private getDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }
}
