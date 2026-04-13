import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEntity } from '../entity/calendar.entity';

/**
 * AI Calendar Service (FR-SCH-060~067)
 * Phase 6: AI 일정 보조 기능 뼈대
 *
 * Pattern: Human sets WHAT → AI builds HOW → Human confirms
 * 실제 Claude API 연동은 SSE 스트리밍으로 구현
 */
@Injectable()
export class CalendarAiService {
  private readonly logger = new Logger(CalendarAiService.name);

  constructor(
    @InjectRepository(CalendarEntity)
    private readonly calendarRepo: Repository<CalendarEntity>,
  ) {}

  /**
   * AI 오늘 할 일 자동 생성 (FR-SCH-060)
   * 프로젝트 WBS, 어제 미완료 이월, 우선순위 분석
   */
  async generateToday(userId: string, entityId: string) {
    this.logger.log(`[AI] generateToday for user ${userId}`);

    // Gather context: user's schedules, carry-over tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCalendars = await this.calendarRepo
      .createQueryBuilder('s')
      .where('s.usrId = :userId', { userId })
      .andWhere('s.entId = :entityId', { entityId })
      .andWhere('s.calStartAt >= :today', { today: today.toISOString() })
      .andWhere('s.calStartAt < :tomorrow', { tomorrow: tomorrow.toISOString() })
      .andWhere('s.calDeletedAt IS NULL')
      .orderBy('s.calStartAt', 'ASC')
      .getMany();

    // TODO: Claude API 호출 (SSE 스트리밍)
    // 현재는 스텁 응답
    return {
      status: 'stub',
      message: 'AI today schedule generation — will be connected to Claude API via SSE',
      existingSchedules: todayCalendars.length,
      suggestions: [],
    };
  }

  /**
   * AI WBS 초안 생성 (FR-SCH-062)
   * 마일스톤 기반 → WBS, 태스크 분해, 의존관계, 리소스 배분
   */
  async generateWbs(
    userId: string,
    entityId: string,
    payload: { project_id?: string; milestones?: string[]; deadline?: string },
  ) {
    this.logger.log(`[AI] generateWbs for project ${payload.project_id || 'new'}`);

    // TODO: Claude API 호출 (SSE 스트리밍)
    return {
      status: 'stub',
      message: 'AI WBS generation — will be connected to Claude API via SSE',
      projectId: payload.project_id,
      milestones: payload.milestones?.length ?? 0,
      wbs: [],
    };
  }

  /**
   * AI 주간 최적화 제안 (FR-SCH-066)
   * 태스크 재배치, 병렬처리, 워크로드 밸런싱
   */
  async optimizeWeek(userId: string, entityId: string, payload: { week_start?: string }) {
    this.logger.log(`[AI] optimizeWeek for user ${userId}`);

    const weekStart = payload.week_start
      ? new Date(payload.week_start)
      : this.getMonday(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekCalendars = await this.calendarRepo
      .createQueryBuilder('s')
      .where('s.usrId = :userId', { userId })
      .andWhere('s.entId = :entityId', { entityId })
      .andWhere('s.calStartAt >= :start', { start: weekStart.toISOString() })
      .andWhere('s.calStartAt < :end', { end: weekEnd.toISOString() })
      .andWhere('s.calDeletedAt IS NULL')
      .orderBy('s.calStartAt', 'ASC')
      .getMany();

    // TODO: Claude API 호출 (SSE 스트리밍)
    return {
      status: 'stub',
      message: 'AI weekly optimization — will be connected to Claude API via SSE',
      weekStart: weekStart.toISOString(),
      schedulesInWeek: weekCalendars.length,
      optimizations: [],
    };
  }

  /**
   * AI 팀 일정 분석 (FR-SCH-061)
   * 팀원 일정 집계, 충돌/과부하/갭 감지
   */
  async analyzeTeam(userId: string, entityId: string, payload: { department_id?: string }) {
    this.logger.log(`[AI] analyzeTeam for dept ${payload.department_id}`);

    // TODO: Claude API 호출 (SSE 스트리밍)
    return {
      status: 'stub',
      message: 'AI team analysis — will be connected to Claude API via SSE',
      departmentId: payload.department_id,
      conflicts: [],
      overloads: [],
      gaps: [],
    };
  }

  private getMonday(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }
}
