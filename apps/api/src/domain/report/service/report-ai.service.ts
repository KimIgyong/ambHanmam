import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { ClaudeService, ClaudeStreamEvent } from '../../../infrastructure/external/claude/claude.service';
import { WorkReportEntity } from '../entity/work-report.entity';
import { DailyAggregation, WeeklyAggregation, ReportAggregatorService } from './report-aggregator.service';

@Injectable()
export class ReportAiService {
  constructor(
    private readonly claudeService: ClaudeService,
    private readonly aggregatorService: ReportAggregatorService,
    @InjectRepository(WorkReportEntity)
    private readonly workReportRepo: Repository<WorkReportEntity>,
  ) {}

  private getLanguageInstruction(lang?: string): string {
    const langMap: Record<string, string> = { ko: 'Korean', en: 'English', vi: 'Vietnamese' };
    return `Write your response in ${langMap[lang || 'en'] || 'English'}.`;
  }

  // ─── 일간 리포트 SSE 스트리밍 ───────────────────────

  generateDailyReport(
    data: DailyAggregation,
    entityId: string,
    userId: string,
    lang?: string,
  ): Observable<{ type: string; content: string }> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const langInstruction = this.getLanguageInstruction(lang);

          const missionSection = data.mission
            ? `- Mission: ${data.mission.content || 'Not set'}
- Achievement: ${data.mission.checkResult || 'Not evaluated'} (Score: ${data.mission.checkScore ?? 'N/A'})`
            : '- No mission registered for this day';

          const completedLines = data.todos.completedItems.length > 0
            ? data.todos.completedItems.map(t => `  - ${t.title}`).join('\n')
            : '  - None';

          const overdueLines = data.todos.overdueItems.length > 0
            ? data.todos.overdueItems.map(t => `  - [${t.status}] ${t.title} (Due: ${t.dueDate})`).join('\n')
            : '  - None';

          const inProgressLines = data.todos.inProgressItems.length > 0
            ? data.todos.inProgressItems.map(t => `  - ${t.title} (Due: ${t.dueDate || 'No deadline'})`).join('\n')
            : '  - None';

          const issueChangeLines = data.issues.statusChanges.length > 0
            ? data.issues.statusChanges.map(c => `  - ${c.title}: ${c.from} → ${c.to}`).join('\n')
            : '  - No status changes';

          const activeIssueLines = data.issues.assignedActive.length > 0
            ? data.issues.assignedActive.map(i => `  - [${i.severity}/${i.status}] ${i.title} (${i.doneRatio}% done)`).join('\n')
            : '  - None';

          const systemPrompt = `You are a professional work performance analyst. Analyze the individual's daily work data and generate a concise, actionable daily work report.
${langInstruction} Use well-structured markdown formatting with headings (##, ###), bullet points, bold text.
Do NOT use any emojis. Be specific, data-driven, and constructive.`;

          const userMessage = `Generate a **Daily Work Report** for ${data.date} based on the following data:

## Daily Mission
${missionSection}

## Task Statistics
- Tasks completed today: ${data.todos.completed}
- Tasks started: ${data.todos.started}
- Tasks cancelled: ${data.todos.cancelled}
- Overdue tasks: ${data.todos.overdue}
- In-progress tasks: ${data.todos.inProgressItems.length}

### Completed Tasks
${completedLines}

### Overdue Tasks
${overdueLines}

### In-Progress Tasks
${inProgressLines}

## Issue Activity
- Issues created: ${data.issues.created}
- Issues resolved: ${data.issues.resolved}
- Issues closed: ${data.issues.closed}

### Issue Status Changes
${issueChangeLines}

### Active Assigned Issues
${activeIssueLines}

## AI Coaching Sessions: ${data.aiCoaching.reports.length}

---

Based on the above data, write a structured daily report with the following sections:

## 1. Daily Summary
(2-3 sentence overview of the day's productivity)

## 2. Key Achievements
(What was accomplished, quantified where possible)

## 3. Attention Required
(Overdue items, blocked tasks, urgent issues that need immediate attention)

## 4. Productivity Score
(Rate 1-100 based on: completion rate, overdue management, issue responsiveness)
Format: **Score: XX/100**
Brief justification.

## 5. Tomorrow's Priorities
(Top 3-5 recommended priorities based on current workload and overdue status)`;

          let fullContent = '';
          const stream$ = this.claudeService.streamMessage(
            systemPrompt,
            [{ role: 'user', content: userMessage }],
            { entId: entityId, usrId: userId, sourceType: 'WORK_REPORT_DAILY' },
          );

          stream$.subscribe({
            next: (event: ClaudeStreamEvent) => {
              if (event.type === 'content' && event.content) {
                fullContent += event.content;
                subscriber.next({ type: 'content', content: event.content });
              } else if (event.type === 'done') {
                // AI 생성 완료 후 DB에 저장
                this.saveReport(entityId, userId, 'daily', data.date, data.date, data, fullContent)
                  .then(() => subscriber.next({ type: 'done', content: '' }))
                  .catch(() => subscriber.next({ type: 'done', content: '' }));
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

  // ─── 주간 리포트 SSE 스트리밍 ───────────────────────

  generateWeeklyReport(
    data: WeeklyAggregation,
    entityId: string,
    userId: string,
    lang?: string,
  ): Observable<{ type: string; content: string }> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const langInstruction = this.getLanguageInstruction(lang);

          const dailySummaryLines = data.dailyBreakdown.map(d => {
            const mScore = d.mission?.checkScore != null ? `${d.mission.checkScore}` : '-';
            return `| ${d.date} | ${d.todos.completed} | ${d.todos.overdue} | ${d.issues.resolved} | ${mScore} |`;
          }).join('\n');

          const allCompleted = data.dailyBreakdown
            .flatMap(d => d.todos.completedItems)
            .map(t => `  - ${t.title}`)
            .join('\n') || '  - None';

          const allOverdue = data.dailyBreakdown[data.dailyBreakdown.length - 1]?.todos.overdueItems
            .map(t => `  - [${t.status}] ${t.title} (Due: ${t.dueDate})`)
            .join('\n') || '  - None';

          const allIssueChanges = data.dailyBreakdown
            .flatMap(d => d.issues.statusChanges)
            .map(c => `  - ${c.title}: ${c.from} → ${c.to}`)
            .join('\n') || '  - No changes';

          const systemPrompt = `You are a professional work performance analyst. Analyze the individual's weekly work data and generate a comprehensive weekly work report with trend analysis.
${langInstruction} Use well-structured markdown formatting with headings (##, ###), bullet points, bold text, and tables.
Do NOT use any emojis. Be specific, data-driven, and provide trend insights.`;

          const userMessage = `Generate a **Weekly Work Report** for ${data.periodStart} ~ ${data.periodEnd} based on the following data:

## Weekly Summary Statistics
- Total tasks completed: ${data.summary.totalTodosCompleted}
- Total tasks created: ${data.summary.totalTodosCreated}
- Tasks cancelled: ${data.summary.totalTodosCancelled}
- Current overdue: ${data.summary.totalOverdue}
- Completion rate: ${data.summary.completionRate}%
- Issues resolved: ${data.summary.totalIssuesResolved}
- Issues closed: ${data.summary.totalIssuesClosed}
- Mission days: ${data.summary.missionDays}/7
- Average mission score: ${data.summary.avgMissionScore ?? 'N/A'}
- AI coaching sessions: ${data.summary.aiCoachingCount}

## Daily Breakdown
| Date | Completed | Overdue | Issues Resolved | Mission Score |
|------|-----------|---------|-----------------|---------------|
${dailySummaryLines}

## All Completed Tasks This Week
${allCompleted}

## Current Overdue Tasks (End of Week)
${allOverdue}

## Issue Activity This Week
${allIssueChanges}

---

Based on the above data, write a structured weekly report with the following sections:

## 1. Week Overview
(3-5 sentence summary of overall weekly performance)

## 2. Key Achievements
(Major accomplishments and milestones this week)

## 3. Performance Trends
(Daily productivity patterns, improving/declining areas, consistency)

## 4. Risk Assessment
(Overdue items accumulating, issues requiring escalation, bottlenecks)

## 5. Weekly Productivity Score
(Rate 1-100 based on: completion rate, overdue trend, issue handling, mission consistency)
Format: **Score: XX/100**
Brief comparison with ideal performance.

## 6. Next Week Recommendations
(Top priorities, suggested focus areas, workload balancing advice)`;

          let fullContent = '';
          const stream$ = this.claudeService.streamMessage(
            systemPrompt,
            [{ role: 'user', content: userMessage }],
            { entId: entityId, usrId: userId, sourceType: 'WORK_REPORT_WEEKLY' },
          );

          stream$.subscribe({
            next: (event: ClaudeStreamEvent) => {
              if (event.type === 'content' && event.content) {
                fullContent += event.content;
                subscriber.next({ type: 'content', content: event.content });
              } else if (event.type === 'done') {
                this.saveReport(entityId, userId, 'weekly', data.periodStart, data.periodEnd, data, fullContent)
                  .then(() => subscriber.next({ type: 'done', content: '' }))
                  .catch(() => subscriber.next({ type: 'done', content: '' }));
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

  // ─── 리포트 저장 ──────────────────────────────────

  private async saveReport(
    entityId: string,
    userId: string,
    type: string,
    periodStart: string,
    periodEnd: string,
    rawData: DailyAggregation | WeeklyAggregation,
    aiSummary: string,
  ): Promise<WorkReportEntity> {
    // 기존 동일 기간 리포트가 있으면 업데이트
    const existing = await this.workReportRepo.findOne({
      where: { entId: entityId, usrId: userId, wkrType: type, wkrPeriodStart: periodStart, wkrPeriodEnd: periodEnd },
    });

    if (existing) {
      existing.wkrRawData = rawData as any;
      existing.wkrAiSummary = aiSummary;
      existing.wkrAiScore = this.extractScore(aiSummary);
      return this.workReportRepo.save(existing);
    }

    const report = this.workReportRepo.create({
      entId: entityId,
      usrId: userId,
      wkrType: type,
      wkrPeriodStart: periodStart,
      wkrPeriodEnd: periodEnd,
      wkrRawData: rawData as any,
      wkrAiSummary: aiSummary,
      wkrAiScore: this.extractScore(aiSummary),
    });
    return this.workReportRepo.save(report);
  }

  private extractScore(aiContent: string): Record<string, any> | null {
    const match = aiContent.match(/\*\*Score:\s*(\d+)\/100\*\*/);
    if (match) {
      return { productivityScore: parseInt(match[1], 10) };
    }
    return null;
  }

  // ─── 리포트 조회 ──────────────────────────────────

  async getReports(entityId: string, userId: string, type?: string): Promise<WorkReportEntity[]> {
    const qb = this.workReportRepo
      .createQueryBuilder('r')
      .where('r.entId = :entityId', { entityId })
      .andWhere('r.usrId = :userId', { userId })
      .andWhere('r.wkrDeletedAt IS NULL')
      .orderBy('r.wkrPeriodStart', 'DESC')
      .take(50);

    if (type) {
      qb.andWhere('r.wkrType = :type', { type });
    }

    return qb.getMany();
  }

  async getReportById(id: string, entityId: string): Promise<WorkReportEntity | null> {
    return this.workReportRepo.findOne({
      where: { wkrId: id, entId: entityId },
    });
  }

  async deleteReport(id: string, entityId: string): Promise<void> {
    await this.workReportRepo.softDelete({ wkrId: id, entId: entityId });
  }
}
