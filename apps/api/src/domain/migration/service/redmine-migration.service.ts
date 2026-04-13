import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MigrationUserMapEntity } from '../entity/migration-user-map.entity';
import { MigrationLogEntity } from '../entity/migration-log.entity';
import { ProjectEntity } from '../../project/entity/project.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { IssueCommentEntity } from '../../issues/entity/issue-comment.entity';
import { IssueStatusLogEntity } from '../../issues/entity/issue-status-log.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { RedmineApiService, RedmineApiIssueDetail } from './redmine-api.service';
import { IssueSequenceService } from '../../issues/service/issue-sequence.service';

// Redmine tracker → AMB issue type
const TRACKER_MAP: Record<number, string> = {
  1: 'BUG',
  2: 'FEATURE_REQUEST',
  3: 'OPINION',
  4: 'TASK',
};

// Redmine issue status → AMB issue status
const STATUS_MAP: Record<number, string> = {
  1: 'OPEN',
  2: 'IN_PROGRESS',
  3: 'RESOLVED',
  4: 'OPEN',         // Feedback → OPEN
  5: 'CLOSED',
  6: 'REJECTED',
  7: 'APPROVED',     // Request → APPROVED
};

// Redmine project status → AMB project status
const PROJECT_STATUS_MAP: Record<number, string> = {
  1: 'IN_PROGRESS',   // Active
  5: 'COMPLETED',     // Closed
  9: 'CANCELLED',     // Archived
};

// Redmine priority → AMB priority + severity
const PRIORITY_MAP: Record<number, { priority: number; severity: string }> = {
  1: { priority: 5, severity: 'MINOR' },
  2: { priority: 3, severity: 'MINOR' },
  3: { priority: 2, severity: 'MAJOR' },
  4: { priority: 1, severity: 'MAJOR' },
  5: { priority: 1, severity: 'CRITICAL' },
};

export interface RedmineUser {
  id: number;
  login: string;
  mail?: string;
  firstname?: string;
  lastname?: string;
}

export interface RedmineProject {
  id: number;
  identifier: string;
  name: string;
  description?: string;
  status: number;
  parent_id?: number;
  created_on?: string;
}

interface RedmineIssue {
  id: number;
  project_id: number;
  tracker_id: number;
  subject: string;
  description?: string;
  status_id: number;
  priority_id: number;
  author_id: number;
  assigned_to_id?: number;
  start_date?: string;
  due_date?: string;
  done_ratio?: number;
  created_on?: string;
  updated_on?: string;
}

interface RedmineJournal {
  id: number;
  issue_id: number;
  user_id: number;
  notes?: string;
  created_on?: string;
  details?: Array<{
    property: string;
    prop_key: string;
    old_value?: string;
    value?: string;
  }>;
}

interface RedmineImportData {
  users?: RedmineUser[];
  projects?: RedmineProject[];
  issues?: RedmineIssue[];
  journals?: RedmineJournal[];
}

export interface MigrationResult {
  batchId: string;
  users: { total: number; mapped: number; unmapped: number };
  projects: { total: number; success: number; failed: number };
  issues: { total: number; success: number; failed: number };
  journals: { total: number; comments: number; statusLogs: number; failed: number };
  errors: string[];
}

@Injectable()
export class RedmineMigrationService {
  private readonly logger = new Logger(RedmineMigrationService.name);

  constructor(
    @InjectRepository(MigrationUserMapEntity)
    private readonly userMapRepo: Repository<MigrationUserMapEntity>,
    @InjectRepository(MigrationLogEntity)
    private readonly logRepo: Repository<MigrationLogEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    @InjectRepository(IssueCommentEntity)
    private readonly commentRepo: Repository<IssueCommentEntity>,
    @InjectRepository(IssueStatusLogEntity)
    private readonly statusLogRepo: Repository<IssueStatusLogEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly redmineApiService: RedmineApiService,
    private readonly issueSequenceService: IssueSequenceService,
  ) {}

  /**
   * Dry-run: 매핑 결과를 시뮬레이션하여 결과 반환 (DB 미변경)
   */
  async preview(data: RedmineImportData): Promise<{
    users: Array<{ redmineUser: RedmineUser; matchedAmbUser: { id: string; name: string; email: string } | null }>;
    projects: Array<{ redmineProject: RedmineProject; ambStatus: string }>;
    issues: Array<{ redmineIssue: { id: number; subject: string }; ambType: string; ambStatus: string; ambPriority: number; ambSeverity: string }>;
    summary: { users: number; projects: number; issues: number; journals: number };
  }> {
    const ambUsers = await this.userRepo.find({ select: ['usrId', 'usrName', 'usrEmail'] });

    // Preview user mapping
    const userPreviews = (data.users || []).map((u) => {
      const match = ambUsers.find((a) => a.usrEmail?.toLowerCase() === u.mail?.toLowerCase());
      return {
        redmineUser: u,
        matchedAmbUser: match ? { id: match.usrId, name: match.usrName, email: match.usrEmail } : null,
      };
    });

    // Preview project mapping
    const projectPreviews = (data.projects || []).map((p) => ({
      redmineProject: p,
      ambStatus: PROJECT_STATUS_MAP[p.status] || 'IN_PROGRESS',
    }));

    // Preview issue mapping
    const issuePreviews = (data.issues || []).map((i) => {
      const pm = PRIORITY_MAP[i.priority_id] || { priority: 3, severity: 'MAJOR' };
      return {
        redmineIssue: { id: i.id, subject: i.subject },
        ambType: TRACKER_MAP[i.tracker_id] || 'OTHER',
        ambStatus: STATUS_MAP[i.status_id] || 'OPEN',
        ambPriority: pm.priority,
        ambSeverity: pm.severity,
      };
    });

    return {
      users: userPreviews,
      projects: projectPreviews,
      issues: issuePreviews,
      summary: {
        users: (data.users || []).length,
        projects: (data.projects || []).length,
        issues: (data.issues || []).length,
        journals: (data.journals || []).length,
      },
    };
  }

  /**
   * 전체 임포트: 사용자→프로젝트→이슈→코멘트 순차 처리
   */
  async importAll(data: RedmineImportData, entityId: string): Promise<MigrationResult> {
    const batchId = uuidv4();
    const errors: string[] = [];

    this.logger.log(`[Migration] Starting batch ${batchId} for entity ${entityId}`);

    // Step 1: Map users
    const userMap = await this.mapUsers(data.users || [], batchId);
    const mappedCount = Object.values(userMap).filter((v) => v !== null).length;

    // Get system user as fallback
    const systemUser = await this.userRepo.findOne({ where: { usrEmail: 'system@amoeba.com' } });
    const fallbackUserId = systemUser?.usrId || Object.values(userMap).find(Boolean) || '';

    // Step 2: Import projects
    const projectResult = await this.importProjects(
      data.projects || [], entityId, userMap, fallbackUserId, batchId, errors,
    );

    // Step 3: Import issues
    const issueResult = await this.importIssues(
      data.issues || [], entityId, projectResult.projectMap, userMap, fallbackUserId, batchId, errors,
    );

    // Step 4: Import journals
    const journalResult = await this.importJournals(
      data.journals || [], issueResult.issueMap, userMap, fallbackUserId, batchId, errors,
    );

    this.logger.log(`[Migration] Batch ${batchId} completed`);

    return {
      batchId,
      users: {
        total: (data.users || []).length,
        mapped: mappedCount,
        unmapped: (data.users || []).length - mappedCount,
      },
      projects: projectResult.stats,
      issues: issueResult.stats,
      journals: journalResult.stats,
      errors,
    };
  }

  /**
   * 이메일 기반 사용자 매칭
   */
  private async mapUsers(
    users: RedmineUser[],
    batchId: string,
  ): Promise<Record<number, string | null>> {
    const userMap: Record<number, string | null> = {};
    const ambUsers = await this.userRepo.find({ select: ['usrId', 'usrEmail'] });

    for (const redmineUser of users) {
      const matched = ambUsers.find(
        (a) => a.usrEmail?.toLowerCase() === redmineUser.mail?.toLowerCase(),
      );

      if (matched) {
        userMap[redmineUser.id] = matched.usrId;

        // Save mapping
        const existing = await this.userMapRepo.findOne({ where: { redmineUserId: redmineUser.id } });
        if (!existing) {
          const mapEntity = this.userMapRepo.create({
            redmineUserId: redmineUser.id,
            ambUserId: matched.usrId,
            redmineLogin: redmineUser.login,
            redmineEmail: redmineUser.mail,
          });
          await this.userMapRepo.save(mapEntity);
        }

        await this.writeLog(batchId, 'USER', redmineUser.id, matched.usrId, 'SUCCESS');
      } else {
        userMap[redmineUser.id] = null;
        await this.writeLog(batchId, 'USER', redmineUser.id, null, 'SKIPPED', `No matching AMB user for ${redmineUser.mail}`);
      }
    }

    return userMap;
  }

  /**
   * 프로젝트 일괄 생성 (2-pass: 1차 생성, 2차 parent_id 설정)
   */
  private async importProjects(
    projects: RedmineProject[],
    entityId: string,
    userMap: Record<number, string | null>,
    fallbackUserId: string,
    batchId: string,
    errors: string[],
  ): Promise<{ projectMap: Record<number, string>; stats: { total: number; success: number; failed: number } }> {
    const projectMap: Record<number, string> = {};
    let success = 0;
    let failed = 0;

    // Pass 1: Create projects (without parent_id)
    for (const rp of projects) {
      try {
        // Check duplicate
        const existing = await this.projectRepo.findOne({ where: { pjtRedmineId: rp.id } });
        if (existing) {
          projectMap[rp.id] = existing.pjtId;
          await this.writeLog(batchId, 'PROJECT', rp.id, existing.pjtId, 'SKIPPED', 'Already imported');
          success++;
          continue;
        }

        const now = new Date();
        const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

        const project = this.projectRepo.create({
          entId: entityId,
          pjtCode: `RM-${yyyymm}-${String(rp.id).padStart(4, '0')}`,
          pjtName: rp.name,
          pjtSummary: rp.description || null,
          pjtStatus: PROJECT_STATUS_MAP[rp.status] || 'IN_PROGRESS',
          pjtPriority: 'MEDIUM',
          pjtProposerId: fallbackUserId,
          pjtCurrency: 'VND',
          pjtRedmineId: rp.id,
          pjtOriginalLang: 'en',
        } as Partial<ProjectEntity>);

        const saved = await this.projectRepo.save(project);
        projectMap[rp.id] = saved.pjtId;
        await this.writeLog(batchId, 'PROJECT', rp.id, saved.pjtId, 'SUCCESS');
        success++;
      } catch (err: any) {
        failed++;
        const msg = `Failed to import project ${rp.id} "${rp.name}": ${err.message}`;
        errors.push(msg);
        this.logger.error(msg);
        await this.writeLog(batchId, 'PROJECT', rp.id, null, 'FAILED', err.message);
      }
    }

    // Pass 2: Set parent_id
    for (const rp of projects) {
      if (rp.parent_id && projectMap[rp.parent_id] && projectMap[rp.id]) {
        try {
          await this.projectRepo.update(
            { pjtId: projectMap[rp.id] },
            { pjtParentId: projectMap[rp.parent_id] },
          );
        } catch (err: any) {
          this.logger.warn(`Failed to set parent for project ${rp.id}: ${err.message}`);
        }
      }
    }

    return { projectMap, stats: { total: projects.length, success, failed } };
  }

  /**
   * 이슈 일괄 생성
   */
  private async importIssues(
    issues: RedmineIssue[],
    entityId: string,
    projectMap: Record<number, string>,
    userMap: Record<number, string | null>,
    fallbackUserId: string,
    batchId: string,
    errors: string[],
  ): Promise<{ issueMap: Record<number, string>; stats: { total: number; success: number; failed: number } }> {
    const issueMap: Record<number, string> = {};
    let success = 0;
    let failed = 0;

    for (const ri of issues) {
      try {
        // Check duplicate
        const existing = await this.issueRepo.findOne({ where: { issRedmineId: ri.id } });
        if (existing) {
          issueMap[ri.id] = existing.issId;
          await this.writeLog(batchId, 'ISSUE', ri.id, existing.issId, 'SKIPPED', 'Already imported');
          success++;
          continue;
        }

        const pm = PRIORITY_MAP[ri.priority_id] || { priority: 3, severity: 'MAJOR' };
        const reporterId = userMap[ri.author_id] || fallbackUserId;
        const assigneeId = ri.assigned_to_id ? (userMap[ri.assigned_to_id] || null) : null;
        const ambStatus = STATUS_MAP[ri.status_id] || 'OPEN';

        const issue = this.issueRepo.create({
          entId: entityId,
          issType: TRACKER_MAP[ri.tracker_id] || 'OTHER',
          issTitle: ri.subject,
          issDescription: ri.description || '-',
          issSeverity: pm.severity,
          issStatus: ambStatus,
          issPriority: pm.priority,
          issReporterId: reporterId,
          issAssigneeId: assigneeId || reporterId,
          pjtId: projectMap[ri.project_id] || null,
          issRedmineId: ri.id,
          issRefNumber: await this.issueSequenceService.generateRefNumber(entityId),
          issStartDate: ri.start_date || null,
          issDueDate: ri.due_date || null,
          issDoneRatio: ri.done_ratio || 0,
          issOriginalLang: 'en',
          issVisibility: 'ENTITY',
          ...(ri.created_on ? { issCreatedAt: new Date(ri.created_on) } : {}),
        } as Partial<IssueEntity>);

        if (ambStatus === 'RESOLVED' || ambStatus === 'CLOSED') {
          issue.issResolvedAt = ri.updated_on ? new Date(ri.updated_on) : new Date();
        }

        const saved = await this.issueRepo.save(issue);
        issueMap[ri.id] = saved.issId;
        await this.writeLog(batchId, 'ISSUE', ri.id, saved.issId, 'SUCCESS');
        success++;
      } catch (err: any) {
        failed++;
        const msg = `Failed to import issue ${ri.id} "${ri.subject}": ${err.message}`;
        errors.push(msg);
        this.logger.error(msg);
        await this.writeLog(batchId, 'ISSUE', ri.id, null, 'FAILED', err.message);
      }
    }

    return { issueMap, stats: { total: issues.length, success, failed } };
  }

  /**
   * 코멘트 + 상태 변경 이력 분리 저장
   */
  private async importJournals(
    journals: RedmineJournal[],
    issueMap: Record<number, string>,
    userMap: Record<number, string | null>,
    fallbackUserId: string,
    batchId: string,
    errors: string[],
  ): Promise<{ stats: { total: number; comments: number; statusLogs: number; failed: number } }> {
    let comments = 0;
    let statusLogs = 0;
    let failed = 0;

    for (const journal of journals) {
      const ambIssueId = issueMap[journal.issue_id];
      if (!ambIssueId) {
        failed++;
        continue;
      }

      const userId = userMap[journal.user_id] || fallbackUserId;

      try {
        // Status change details → status logs
        const statusChanges = (journal.details || []).filter(
          (d) => d.property === 'attr' && d.prop_key === 'status_id',
        );

        for (const sc of statusChanges) {
          const fromStatus = STATUS_MAP[Number(sc.old_value)] || 'OPEN';
          const toStatus = STATUS_MAP[Number(sc.value)] || 'OPEN';

          const log = this.statusLogRepo.create({
            issId: ambIssueId,
            islFromStatus: fromStatus,
            islToStatus: toStatus,
            islChangedBy: userId,
            islNote: journal.notes || null,
          } as Partial<IssueStatusLogEntity>);

          await this.statusLogRepo.save(log);
          statusLogs++;
        }

        // Notes → comments
        if (journal.notes && journal.notes.trim()) {
          const comment = this.commentRepo.create({
            issId: ambIssueId,
            iscAuthorId: userId,
            iscAuthorType: 'USER',
            iscContent: journal.notes.trim(),
          } as Partial<IssueCommentEntity>);

          await this.commentRepo.save(comment);
          comments++;
        }

        await this.writeLog(batchId, 'JOURNAL', journal.id, ambIssueId, 'SUCCESS');
      } catch (err: any) {
        failed++;
        const msg = `Failed to import journal ${journal.id}: ${err.message}`;
        errors.push(msg);
        this.logger.error(msg);
        await this.writeLog(batchId, 'JOURNAL', journal.id, null, 'FAILED', err.message);
      }
    }

    return { stats: { total: journals.length, comments, statusLogs, failed } };
  }

  /**
   * 배치 단위 롤백
   */
  async rollback(batchId: string): Promise<{ deleted: { projects: number; issues: number; comments: number; statusLogs: number } }> {
    const logs = await this.logRepo.find({
      where: { mglBatchId: batchId, mglStatus: 'SUCCESS' },
      order: { mglCreatedAt: 'DESC' },
    });

    let deletedProjects = 0;
    let deletedIssues = 0;
    let deletedComments = 0;
    let deletedStatusLogs = 0;

    // Reverse order: journals → issues → projects
    const journalLogs = logs.filter((l) => l.mglEntityType === 'JOURNAL');
    const issueLogs = logs.filter((l) => l.mglEntityType === 'ISSUE');
    const projectLogs = logs.filter((l) => l.mglEntityType === 'PROJECT');

    // Delete status logs and comments from journals
    for (const log of journalLogs) {
      if (log.mglTargetId) {
        // Target is the issue ID, delete related
        await this.statusLogRepo.delete({ issId: log.mglTargetId });
        await this.commentRepo.delete({ issId: log.mglTargetId });
        deletedComments++;
        deletedStatusLogs++;
      }
    }

    // Delete issues
    for (const log of issueLogs) {
      if (log.mglTargetId) {
        // Delete comments and status logs first
        await this.commentRepo.delete({ issId: log.mglTargetId });
        await this.statusLogRepo.delete({ issId: log.mglTargetId });
        await this.issueRepo.delete({ issId: log.mglTargetId });
        deletedIssues++;
      }
    }

    // Delete projects
    for (const log of projectLogs) {
      if (log.mglTargetId) {
        // Clear parent references first
        await this.projectRepo.update(
          { pjtParentId: log.mglTargetId },
          { pjtParentId: null as any },
        );
        await this.projectRepo.delete({ pjtId: log.mglTargetId });
        deletedProjects++;
      }
    }

    // Mark all logs as rolled back
    await this.logRepo.update(
      { mglBatchId: batchId },
      { mglStatus: 'ROLLED_BACK' as any },
    );

    // Delete user mappings related to this batch
    const userLogs = logs.filter((l) => l.mglEntityType === 'USER');
    for (const log of userLogs) {
      await this.userMapRepo.delete({ redmineUserId: log.mglSourceId });
    }

    return {
      deleted: {
        projects: deletedProjects,
        issues: deletedIssues,
        comments: deletedComments,
        statusLogs: deletedStatusLogs,
      },
    };
  }

  /**
   * 마이그레이션 로그 조회
   */
  async getLogs(batchId?: string, status?: string): Promise<MigrationLogEntity[]> {
    const where: any = {};
    if (batchId) where.mglBatchId = batchId;
    if (status) where.mglStatus = status;

    return this.logRepo.find({
      where,
      order: { mglCreatedAt: 'DESC' },
      take: 500,
    });
  }

  /**
   * Redmine API에서 선택된 이슈를 가져와 AMA DB에 저장
   */
  async importSelectedIssues(
    issueIds: number[],
    entityId: string,
    targetProjectId?: string,
    configOverride?: { baseUrl: string; apiKey: string },
  ): Promise<MigrationResult> {
    const batchId = uuidv4();
    const errors: string[] = [];

    this.logger.log(`[Migration] Selected import batch ${batchId}: ${issueIds.length} issues`);

    // 1. Check already imported
    const existingIssues = await this.issueRepo.find({
      where: { issRedmineId: In(issueIds) },
      select: ['issId', 'issRedmineId'],
    });
    const alreadyImportedIds = new Set(
      existingIssues.map((e) => e.issRedmineId).filter((id): id is number => id !== null),
    );

    const toImportIds = issueIds.filter((id) => !alreadyImportedIds.has(id));
    if (toImportIds.length === 0) {
      return {
        batchId,
        users: { total: 0, mapped: 0, unmapped: 0 },
        projects: { total: 0, success: 0, failed: 0 },
        issues: { total: issueIds.length, success: 0, failed: 0 },
        journals: { total: 0, comments: 0, statusLogs: 0, failed: 0 },
        errors: ['All issues already imported'],
      };
    }

    // 2. Fetch issue details from Redmine API
    const issueDetails: RedmineApiIssueDetail[] = [];
    for (const id of toImportIds) {
      try {
        const detail = await this.redmineApiService.fetchIssueDetail(id, configOverride);
        issueDetails.push(detail);
      } catch (err: any) {
        errors.push(`Failed to fetch Redmine issue #${id}: ${err.message}`);
        await this.writeLog(batchId, 'ISSUE', id, null, 'FAILED', `Fetch error: ${err.message}`);
      }
    }

    // 3. Fetch Redmine users for author/assignee mapping
    const redmineUserIds = new Set<number>();
    for (const issue of issueDetails) {
      redmineUserIds.add(issue.author.id);
      if (issue.assigned_to) redmineUserIds.add(issue.assigned_to.id);
      for (const j of issue.journals || []) {
        redmineUserIds.add(j.user.id);
      }
    }

    // Build user map from existing mappings + email matching
    const userMap = await this.buildUserMapFromApi(Array.from(redmineUserIds), batchId);

    const systemUser = await this.userRepo.findOne({ where: { usrEmail: 'system@amoeba.com' } });
    const fallbackUserId = systemUser?.usrId || Object.values(userMap).find(Boolean) || '';

    // 4. Ensure projects exist (or use target project)
    let projectMap: Record<number, string> = {};
    const redmineProjectIds = new Set(issueDetails.map((i) => i.project.id));

    if (targetProjectId) {
      // All issues go to the specified AMA project
      for (const rpId of redmineProjectIds) {
        projectMap[rpId] = targetProjectId;
      }
    } else {
      projectMap = await this.ensureProjects(
        Array.from(redmineProjectIds),
        issueDetails,
        entityId,
        fallbackUserId,
        batchId,
        errors,
      );
    }

    // 5. Import issues
    let issueSuccess = 0;
    let issueFailed = 0;
    const issueMap: Record<number, string> = {};

    for (const ri of issueDetails) {
      try {
        const pm = PRIORITY_MAP[ri.priority.id] || { priority: 3, severity: 'MAJOR' };
        const reporterId = userMap[ri.author.id] || fallbackUserId;
        const assigneeId = ri.assigned_to ? (userMap[ri.assigned_to.id] || null) : null;
        const ambStatus = STATUS_MAP[ri.status.id] || 'OPEN';

        const issue = this.issueRepo.create({
          entId: entityId,
          issType: TRACKER_MAP[ri.tracker.id] || 'OTHER',
          issTitle: ri.subject,
          issDescription: ri.description || '-',
          issSeverity: pm.severity,
          issStatus: ambStatus,
          issPriority: pm.priority,
          issReporterId: reporterId,
          issAssigneeId: assigneeId || reporterId,
          pjtId: projectMap[ri.project.id] || null,
          issRedmineId: ri.id,
          issRefNumber: await this.issueSequenceService.generateRefNumber(entityId),
          issStartDate: ri.start_date || null,
          issDueDate: ri.due_date || null,
          issDoneRatio: ri.done_ratio || 0,
          issOriginalLang: 'en',
          issVisibility: 'ENTITY',
          ...(ri.created_on ? { issCreatedAt: new Date(ri.created_on) } : {}),
        } as Partial<IssueEntity>);

        if (ambStatus === 'RESOLVED' || ambStatus === 'CLOSED') {
          issue.issResolvedAt = ri.updated_on ? new Date(ri.updated_on) : new Date();
        }

        const saved = await this.issueRepo.save(issue);
        issueMap[ri.id] = saved.issId;
        await this.writeLog(batchId, 'ISSUE', ri.id, saved.issId, 'SUCCESS');
        issueSuccess++;
      } catch (err: any) {
        issueFailed++;
        errors.push(`Issue #${ri.id} "${ri.subject}": ${err.message}`);
        await this.writeLog(batchId, 'ISSUE', ri.id, null, 'FAILED', err.message);
      }
    }

    // 6. Import journals (comments + status logs)
    let journalComments = 0;
    let journalStatusLogs = 0;
    let journalFailed = 0;
    let journalTotal = 0;

    for (const ri of issueDetails) {
      const ambIssueId = issueMap[ri.id];
      if (!ambIssueId || !ri.journals) continue;

      for (const journal of ri.journals) {
        journalTotal++;
        const userId = userMap[journal.user.id] || fallbackUserId;

        try {
          // Status changes
          const statusChanges = (journal.details || []).filter(
            (d) => d.property === 'attr' && d.name === 'status_id',
          );
          for (const sc of statusChanges) {
            const fromStatus = STATUS_MAP[Number(sc.old_value)] || 'OPEN';
            const toStatus = STATUS_MAP[Number(sc.new_value)] || 'OPEN';
            const log = this.statusLogRepo.create({
              issId: ambIssueId,
              islFromStatus: fromStatus,
              islToStatus: toStatus,
              islChangedBy: userId,
              islNote: journal.notes || null,
            } as Partial<IssueStatusLogEntity>);
            await this.statusLogRepo.save(log);
            journalStatusLogs++;
          }

          // Notes → comment
          if (journal.notes && journal.notes.trim()) {
            const comment = this.commentRepo.create({
              issId: ambIssueId,
              iscAuthorId: userId,
              iscAuthorType: 'USER',
              iscContent: journal.notes.trim(),
            } as Partial<IssueCommentEntity>);
            await this.commentRepo.save(comment);
            journalComments++;
          }

          await this.writeLog(batchId, 'JOURNAL', journal.id, ambIssueId, 'SUCCESS');
        } catch (err: any) {
          journalFailed++;
          errors.push(`Journal #${journal.id}: ${err.message}`);
          await this.writeLog(batchId, 'JOURNAL', journal.id, null, 'FAILED', err.message);
        }
      }
    }

    // Log skipped
    for (const id of alreadyImportedIds) {
      await this.writeLog(batchId, 'ISSUE', id, null, 'SKIPPED', 'Already imported');
    }

    return {
      batchId,
      users: {
        total: redmineUserIds.size,
        mapped: Object.values(userMap).filter(Boolean).length,
        unmapped: redmineUserIds.size - Object.values(userMap).filter(Boolean).length,
      },
      projects: {
        total: redmineProjectIds.size,
        success: Object.keys(projectMap).length,
        failed: 0,
      },
      issues: {
        total: issueIds.length,
        success: issueSuccess,
        failed: issueFailed,
      },
      journals: {
        total: journalTotal,
        comments: journalComments,
        statusLogs: journalStatusLogs,
        failed: journalFailed,
      },
      errors,
    };
  }

  /**
   * Redmine user IDs → AMB user IDs (기존 매핑 + 이메일 매칭)
   */
  private async buildUserMapFromApi(
    redmineUserIds: number[],
    batchId: string,
  ): Promise<Record<number, string | null>> {
    const userMap: Record<number, string | null> = {};
    const ambUsers = await this.userRepo.find({ select: ['usrId', 'usrEmail'] });

    // Check existing mappings first
    const existingMaps = await this.userMapRepo.find({
      where: { redmineUserId: In(redmineUserIds) },
    });
    for (const m of existingMaps) {
      userMap[m.redmineUserId] = m.ambUserId;
    }

    // For unmapped users, try fetching from Redmine API
    const unmappedIds = redmineUserIds.filter((id) => !(id in userMap));
    for (const redmineUserId of unmappedIds) {
      try {
        const users = await this.redmineApiService.fetchUsers(0, 100);
        const redmineUser = users.users.find((u) => u.id === redmineUserId);
        if (redmineUser) {
          const matched = ambUsers.find(
            (a) => a.usrEmail?.toLowerCase() === redmineUser.mail?.toLowerCase(),
          );
          if (matched) {
            userMap[redmineUserId] = matched.usrId;
            // Save mapping
            const existing = await this.userMapRepo.findOne({ where: { redmineUserId } });
            if (!existing) {
              await this.userMapRepo.save(this.userMapRepo.create({
                redmineUserId,
                ambUserId: matched.usrId,
                redmineLogin: redmineUser.login,
                redmineEmail: redmineUser.mail,
              }));
            }
            await this.writeLog(batchId, 'USER', redmineUserId, matched.usrId, 'SUCCESS');
          } else {
            userMap[redmineUserId] = null;
            await this.writeLog(batchId, 'USER', redmineUserId, null, 'SKIPPED',
              `No AMB user for ${redmineUser.mail}`);
          }
        } else {
          userMap[redmineUserId] = null;
        }
      } catch {
        userMap[redmineUserId] = null;
      }
    }

    return userMap;
  }

  /**
   * 지정된 Entity의 AMA 프로젝트 목록 조회 (import 대상 선택용)
   */
  async getAmaProjects(entityId: string): Promise<{ pjtId: string; pjtCode: string; pjtName: string; pjtStatus: string }[]> {
    const projects = await this.projectRepo.find({
      where: { entId: entityId, pjtDeletedAt: null as any },
      select: ['pjtId', 'pjtCode', 'pjtName', 'pjtStatus'],
      order: { pjtName: 'ASC' },
    });
    return projects.map((p) => ({
      pjtId: p.pjtId,
      pjtCode: p.pjtCode,
      pjtName: p.pjtName,
      pjtStatus: p.pjtStatus,
    }));
  }

  /**
   * Redmine에서 가져온 이슈 목록 조회 (issRedmineId IS NOT NULL)
   */
  async getImportedIssues(params: {
    entityId?: string;
    projectId?: string;
    status?: string;
    search?: string;
    offset: number;
    limit: number;
  }): Promise<{ issues: any[]; totalCount: number }> {
    const qb = this.issueRepo.createQueryBuilder('i')
      .leftJoinAndSelect('i.project', 'p')
      .leftJoinAndSelect('i.reporter', 'r')
      .leftJoinAndSelect('i.assignee', 'a')
      .where('i.issRedmineId IS NOT NULL')
      .andWhere('i.issDeletedAt IS NULL');

    if (params.entityId) {
      qb.andWhere('i.entId = :entityId', { entityId: params.entityId });
    }
    if (params.projectId) {
      qb.andWhere('i.pjtId = :projectId', { projectId: params.projectId });
    }
    if (params.status) {
      qb.andWhere('i.issStatus = :status', { status: params.status });
    }
    if (params.search) {
      qb.andWhere('(i.issTitle ILIKE :search OR CAST(i.issRedmineId AS TEXT) LIKE :search)', {
        search: `%${params.search}%`,
      });
    }

    qb.orderBy('i.issCreatedAt', 'DESC')
      .skip(params.offset)
      .take(params.limit);

    const [issues, totalCount] = await qb.getManyAndCount();

    return {
      issues: issues.map((i) => ({
        issId: i.issId,
        issRedmineId: i.issRedmineId,
        issTitle: i.issTitle,
        issType: i.issType,
        issStatus: i.issStatus,
        issSeverity: i.issSeverity,
        issPriority: i.issPriority,
        issDoneRatio: i.issDoneRatio,
        issCreatedAt: i.issCreatedAt,
        issUpdatedAt: i.issUpdatedAt,
        project: i.project ? { pjtId: i.project.pjtId, pjtCode: i.project.pjtCode, pjtName: i.project.pjtName } : null,
        reporter: i.reporter ? { usrId: i.reporter.usrId, usrName: i.reporter.usrName } : null,
        assignee: i.assignee ? { usrId: i.assignee.usrId, usrName: i.assignee.usrName } : null,
      })),
      totalCount,
    };
  }

  /**
   * 가져온 이슈 삭제 (관련 코멘트, 상태로그, 마이그레이션 로그 포함)
   */
  async deleteImportedIssues(issueIds: string[]): Promise<{ deleted: number; errors: string[] }> {
    const errors: string[] = [];
    let deleted = 0;

    for (const issId of issueIds) {
      try {
        const issue = await this.issueRepo.findOne({ where: { issId } });
        if (!issue || !issue.issRedmineId) {
          errors.push(`Issue ${issId}: not found or not a Redmine imported issue`);
          continue;
        }

        // Delete related comments
        await this.commentRepo.delete({ issId });
        // Delete related status logs
        await this.statusLogRepo.delete({ issId });
        // Delete migration logs for this Redmine ID
        await this.logRepo.delete({ mglSourceId: issue.issRedmineId, mglSource: 'REDMINE' });
        // Delete the issue (hard delete since it's reimportable)
        await this.issueRepo.delete({ issId });

        deleted++;
      } catch (err: any) {
        errors.push(`Issue ${issId}: ${err.message}`);
      }
    }

    return { deleted, errors };
  }

  /**
   * 다시 가져오기: 기존 이슈 삭제 후 Redmine에서 다시 import
   */
  async reimportIssues(
    issueIds: string[],
    entityId: string,
    targetProjectId?: string,
    configOverride?: { baseUrl: string; apiKey: string },
  ): Promise<MigrationResult> {
    // 1. Collect Redmine IDs from existing issues
    const issues = await this.issueRepo.find({
      where: { issId: In(issueIds) },
      select: ['issId', 'issRedmineId'],
    });

    const redmineIds = issues
      .map((i) => i.issRedmineId)
      .filter((id): id is number => id !== null);

    if (redmineIds.length === 0) {
      throw new BadRequestException('No valid Redmine issue IDs found');
    }

    // 2. Delete existing issues
    await this.deleteImportedIssues(issueIds);

    // 3. Re-import from Redmine
    return this.importSelectedIssues(redmineIds, entityId, targetProjectId, configOverride);
  }

  /**
   * Redmine 프로젝트가 AMA에 없으면 자동 생성
   */
  private async ensureProjects(
    redmineProjectIds: number[],
    issueDetails: RedmineApiIssueDetail[],
    entityId: string,
    fallbackUserId: string,
    batchId: string,
    errors: string[],
  ): Promise<Record<number, string>> {
    const projectMap: Record<number, string> = {};

    for (const rpId of redmineProjectIds) {
      // Check existing
      const existing = await this.projectRepo.findOne({ where: { pjtRedmineId: rpId } });
      if (existing) {
        projectMap[rpId] = existing.pjtId;
        continue;
      }

      // Get project name from issue details
      const sampleIssue = issueDetails.find((i) => i.project.id === rpId);
      const projectName = sampleIssue?.project.name || `Redmine Project #${rpId}`;

      try {
        const now = new Date();
        const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

        const project = this.projectRepo.create({
          entId: entityId,
          pjtCode: `RM-${yyyymm}-${String(rpId).padStart(4, '0')}`,
          pjtName: projectName,
          pjtStatus: 'IN_PROGRESS',
          pjtPriority: 'MEDIUM',
          pjtProposerId: fallbackUserId,
          pjtCurrency: 'VND',
          pjtRedmineId: rpId,
          pjtOriginalLang: 'en',
        } as Partial<ProjectEntity>);

        const saved = await this.projectRepo.save(project);
        projectMap[rpId] = saved.pjtId;
        await this.writeLog(batchId, 'PROJECT', rpId, saved.pjtId, 'SUCCESS');
      } catch (err: any) {
        errors.push(`Project #${rpId}: ${err.message}`);
        await this.writeLog(batchId, 'PROJECT', rpId, null, 'FAILED', err.message);
      }
    }

    return projectMap;
  }

  /**
   * 로그 기록 헬퍼
   */
  private async writeLog(
    batchId: string,
    entityType: string,
    sourceId: number,
    targetId: string | null,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    const log = this.logRepo.create({
      mglBatchId: batchId,
      mglSource: 'REDMINE',
      mglEntityType: entityType,
      mglSourceId: sourceId,
      mglTargetId: targetId,
      mglStatus: status,
      mglErrorMessage: errorMessage || null,
    });
    await this.logRepo.save(log);
  }
}
