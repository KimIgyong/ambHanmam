import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ISSUE_VALID_TRANSITIONS, IssueStatus } from '@amb/types';
import { ClaudeService, ClaudeStreamEvent } from '../../../infrastructure/external/claude/claude.service';
import { IssueEntity } from '../entity/issue.entity';
import { IssueSequenceService } from './issue-sequence.service';
import { IssueCommentEntity } from '../entity/issue-comment.entity';
import { IssueStatusLogEntity } from '../entity/issue-status-log.entity';
import { IssueParticipantEntity } from '../entity/issue-participant.entity';
import { IssueCommentReactionEntity } from '../entity/issue-comment-reaction.entity';
import { IssueRatingEntity } from '../../activity-index/entity/issue-rating.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { UserCellEntity } from '../../members/entity/user-cell.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { ProjectEntity } from '../../project/entity/project.entity';
import { ProjectMemberEntity } from '../../project/entity/project-member.entity';
import { CreateIssueRequest } from '../dto/request/create-issue.request';
import { UpdateIssueRequest } from '../dto/request/update-issue.request';
import { IssueMapper } from '../mapper/issue.mapper';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { MODULE_DATA_EVENTS } from '../../kms/event/module-data.event';
import { TranslationService } from '../../translation/service/translation.service';
import { IssueResponse, IssueCommentResponse, IssueStatusLogResponse } from '@amb/types';
import {
  ASSIGNEE_EVENT,
  NOTIFICATION_TYPE,
  NOTIFICATION_RESOURCE_TYPE,
  ASSIGNEE_ROLE,
  AssigneeAssignedEvent,
  MENTION_EVENT,
  ISSUE_STATUS_EVENT,
  IssueStatusChangedEvent,
  REACTION_EVENT,
} from '../../notification/constant/notification-type.constant';
import { extractMentionedUserIds } from '../../notification/util/mention.util';

@Injectable()
export class IssueService {
  private readonly logger = new Logger(IssueService.name);

  constructor(
    @InjectRepository(IssueEntity)
    private readonly issueRepository: Repository<IssueEntity>,
    @InjectRepository(IssueCommentEntity)
    private readonly commentRepository: Repository<IssueCommentEntity>,
    @InjectRepository(IssueStatusLogEntity)
    private readonly statusLogRepository: Repository<IssueStatusLogEntity>,
    @InjectRepository(IssueParticipantEntity)
    private readonly participantRepository: Repository<IssueParticipantEntity>,
    @InjectRepository(IssueCommentReactionEntity)
    private readonly commentReactionRepository: Repository<IssueCommentReactionEntity>,
    @InjectRepository(IssueRatingEntity)
    private readonly issueRatingRepository: Repository<IssueRatingEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userCellRepository: Repository<UserCellEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly userUnitRoleRepository: Repository<UserUnitRoleEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(ProjectMemberEntity)
    private readonly projectMemberRepository: Repository<ProjectMemberEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly translationService: TranslationService,
    private readonly claudeService: ClaudeService,
    private readonly issueSequenceService: IssueSequenceService,
  ) {}

  async getIssues(
    filters?: {
      type?: string;
      status?: string;
      severity?: string;
      priority?: number;
      search?: string;
      project_id?: string;
      scope?: string;
      reporter_id?: string;
      cell_id?: string;
    },
    page = 1,
    size = 20,
    entityId?: string,
    userId?: string,
  ): Promise<{ data: IssueResponse[]; totalCount: number }> {
    const qb = this.issueRepository
      .createQueryBuilder('iss')
      .leftJoinAndSelect('iss.reporter', 'reporter')
      .leftJoinAndSelect('iss.assignee', 'assignee')
      .leftJoinAndSelect('iss.project', 'project')
      .leftJoinAndSelect('iss.parentIssue', 'parentIssue')
      .leftJoinAndSelect('iss.epic', 'epic')
      .leftJoinAndSelect('iss.component', 'component');

    if (entityId) {
      qb.andWhere('iss.entId = :entityId', { entityId });
    }

    // scope filter
    if (filters?.scope === 'my' && userId) {
      qb.andWhere('iss.issReporterId = :userId', { userId });
    } else if (filters?.scope === 'my_assigned' && userId) {
      qb.andWhere('iss.issAssigneeId = :userId', { userId });
    } else if (filters?.scope === 'my_involved' && userId) {
      qb.andWhere(
        '(iss.issReporterId = :userId OR iss.issAssigneeId = :userId OR iss.issId IN ' +
        '(SELECT isp.iss_id FROM amb_issue_participants isp WHERE isp.usr_id = :userId))',
        { userId },
      );
    } else if (filters?.scope === 'my_cell' && userId) {
      const userCells = await this.userCellRepository.find({ where: { usrId: userId } });
      const cellIds = userCells.map((uc) => uc.celId);
      if (cellIds.length > 0) {
        qb.andWhere('iss.issCellId IN (:...cellIds)', { cellIds });
      } else {
        qb.andWhere('1 = 0');
      }
    } else if (filters?.scope === 'my_unit' && userId) {
      const userUnits = await this.userUnitRoleRepository.find({ where: { usrId: userId } });
      const unitIds = userUnits.map((uu) => uu.untId);
      if (unitIds.length > 0) {
        const unitMembers = await this.userUnitRoleRepository.find({
          where: { untId: In(unitIds) },
          select: ['usrId'],
        });
        const memberIds = [...new Set(unitMembers.map((m) => m.usrId))];
        if (memberIds.length > 0) {
          qb.andWhere(
            '(iss.issReporterId IN (:...memberIds) OR iss.issAssigneeId IN (:...memberIds))',
            { memberIds },
          );
        } else {
          qb.andWhere('1 = 0');
        }
      } else {
        qb.andWhere('1 = 0');
      }
    }

    if (filters?.type) {
      const types = filters.type.split(',');
      if (types.length === 1) {
        qb.andWhere('iss.issType = :type', { type: types[0] });
      } else {
        qb.andWhere('iss.issType IN (:...types)', { types });
      }
    }
    if (filters?.status) {
      const statuses = filters.status.split(',');
      if (statuses.length === 1) {
        qb.andWhere('iss.issStatus = :status', { status: statuses[0] });
      } else {
        qb.andWhere('iss.issStatus IN (:...statuses)', { statuses });
      }
    }
    if (filters?.severity) {
      qb.andWhere('iss.issSeverity = :severity', { severity: filters.severity });
    }
    if (filters?.priority) {
      qb.andWhere('iss.issPriority = :priority', { priority: filters.priority });
    }
    if (filters?.search) {
      qb.andWhere('(iss.issTitle ILIKE :search OR iss.issDescription ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters?.project_id) {
      if (filters.project_id === '__none__') {
        qb.andWhere('iss.pjtId IS NULL');
      } else {
        qb.andWhere('iss.pjtId = :projectId', { projectId: filters.project_id });
      }
    }
    if (filters?.reporter_id) {
      qb.andWhere('iss.issReporterId = :reporterId', { reporterId: filters.reporter_id });
    }
    if (filters?.cell_id) {
      qb.andWhere('iss.issCellId = :cellId', { cellId: filters.cell_id });
    }

    qb.orderBy('iss.issPriority', 'ASC')
      .addOrderBy('iss.issCreatedAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);

    const [entities, totalCount] = await qb.getManyAndCount();

    const issueIds = entities.map((e) => e.issId);
    const commentCounts = await this.getCommentCounts(issueIds);
    const participantsMap = await this.getParticipantsMap(issueIds);
    const ratingStats = await this.getRatingStats(issueIds);
    const myRatings = userId ? await this.getMyRatings(issueIds, userId) : {};

    return {
      data: entities.map((e) => IssueMapper.toResponse(
        e,
        commentCounts[e.issId] || 0,
        participantsMap[e.issId],
        {
          avgRating: ratingStats[e.issId]?.avg || null,
          ratingCount: ratingStats[e.issId]?.count || 0,
          myRating: myRatings[e.issId] || null,
        },
      )),
      totalCount,
    };
  }

  async getIssueById(id: string, userId?: string): Promise<IssueResponse> {
    const entity = await this.issueRepository.findOne({
      where: { issId: id },
      relations: ['reporter', 'assignee', 'project', 'parentIssue', 'epic', 'component'],
    });

    if (!entity) {
      throw new BusinessException(
        ERROR_CODE.ISSUE_NOT_FOUND.code,
        ERROR_CODE.ISSUE_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const commentCount = await this.commentRepository.count({ where: { issId: id } });
    const participants = await this.participantRepository.find({
      where: { issId: id },
      relations: ['user'],
      order: { ispCreatedAt: 'ASC' },
    });
    const ratingStats = await this.getRatingStats([id]);
    const myRatings = userId ? await this.getMyRatings([id], userId) : {};
    return IssueMapper.toResponse(entity, commentCount, participants, {
      avgRating: ratingStats[id]?.avg || null,
      ratingCount: ratingStats[id]?.count || 0,
      myRating: myRatings[id] || null,
    });
  }

  async createIssue(
    dto: CreateIssueRequest,
    userId: string,
    entityId?: string,
  ): Promise<IssueResponse> {
    const entity = this.issueRepository.create({
      entId: entityId || null,
      issType: dto.type,
      issTitle: dto.title,
      issDescription: dto.description,
      issSeverity: dto.severity,
      issStatus: 'OPEN',
      issPriority: dto.priority || 3,
      issReporterId: userId,
      issAssigneeId: dto.assignee_id || userId,
      issAffectedModules: dto.affected_modules || null,
      issVisibility: dto.visibility || 'ENTITY',
      issCellId: dto.group_id || null,
      pjtId: dto.project_id || null,
      issStartDate: dto.start_date || null,
      issDueDate: dto.due_date || null,
      issDoneRatio: dto.done_ratio ?? 0,
      issParentId: dto.parent_issue_id || null,
      epcId: dto.epic_id || null,
      cmpId: dto.component_id || null,
      issGoogleDriveLink: dto.google_drive_link || null,
      issRefNumber: entityId ? await this.issueSequenceService.generateRefNumber(entityId) : null,
    });

    // Epic/Component 상호 배타 검증
    if (entity.epcId && entity.cmpId) {
      throw new BusinessException(
        ERROR_CODE.EPIC_COMPONENT_EXCLUSIVE.code,
        ERROR_CODE.EPIC_COMPONENT_EXCLUSIVE.message,
      );
    }

    const saved = await this.issueRepository.save(entity);

    // Add system comment for todo-to-issue conversion
    if (dto.source_todo_id) {
      const systemComment = this.commentRepository.create({
        issId: saved.issId,
        iscAuthorId: userId,
        iscAuthorType: 'SYSTEM',
        iscContent: `Converted from Task: ${dto.source_todo_title || 'Untitled'}`,
        iscIssueStatus: saved.issStatus,
      });
      await this.commentRepository.save(systemComment);
    }

    // Add system comment for meeting-note-to-issue conversion
    if (dto.source_meeting_note_title) {
      const systemComment = this.commentRepository.create({
        issId: saved.issId,
        iscAuthorId: userId,
        iscAuthorType: 'SYSTEM',
        iscContent: `Created from Note: ${dto.source_meeting_note_title}`,
        iscIssueStatus: saved.issStatus,
      });
      await this.commentRepository.save(systemComment);
    }

    // Save participants
    if (dto.participant_ids?.length) {
      const participants = dto.participant_ids.map((usrId) =>
        this.participantRepository.create({ issId: saved.issId, usrId, ispRole: 'PARTICIPANT' }),
      );
      await this.participantRepository.save(participants);
    }

    this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
      module: 'issue',
      type: 'ISSUE',
      refId: saved.issId,
      title: saved.issTitle,
      content: [saved.issTitle, saved.issDescription, saved.issAffectedModules?.join(' ')].filter(Boolean).join(' '),
      ownerId: userId,
      entityId: entityId,
      visibility: saved.issVisibility,
      cellId: saved.issCellId,
    });

    // Emit assignee & participant notifications
    const needsAssigneeNotify = dto.assignee_id && dto.assignee_id !== userId;
    const participantRecipients = (dto.participant_ids || []).filter(
      (id) => id !== userId && id !== dto.assignee_id,
    );

    if (needsAssigneeNotify || participantRecipients.length > 0) {
      const sender = await this.userRepository.findOne({ where: { usrId: userId } });
      const senderName = sender?.usrName || 'Unknown';

      if (needsAssigneeNotify) {
        this.eventEmitter.emit(ASSIGNEE_EVENT, {
          type: NOTIFICATION_TYPE.ISSUE_ASSIGNED,
          resourceType: NOTIFICATION_RESOURCE_TYPE.ISSUE,
          resourceId: saved.issId,
          resourceTitle: saved.issTitle,
          senderId: userId,
          senderName,
          recipientIds: [dto.assignee_id],
          entityId: entityId || '',
          role: ASSIGNEE_ROLE.ASSIGNEE,
        } as AssigneeAssignedEvent);
      }

      if (participantRecipients.length > 0) {
        this.eventEmitter.emit(ASSIGNEE_EVENT, {
          type: NOTIFICATION_TYPE.ISSUE_ASSIGNED,
          resourceType: NOTIFICATION_RESOURCE_TYPE.ISSUE,
          resourceId: saved.issId,
          resourceTitle: saved.issTitle,
          senderId: userId,
          senderName,
          recipientIds: participantRecipients,
          entityId: entityId || '',
          role: ASSIGNEE_ROLE.PARTICIPANT,
        } as AssigneeAssignedEvent);
      }
    }

    // Reload with reporter relation
    return this.getIssueById(saved.issId);
  }

  async updateIssue(
    id: string,
    dto: UpdateIssueRequest,
    userId: string,
  ): Promise<IssueResponse> {
    const entity = await this.issueRepository.findOne({
      where: { issId: id },
      relations: ['reporter', 'assignee'],
    });

    if (!entity) {
      throw new BusinessException(
        ERROR_CODE.ISSUE_NOT_FOUND.code,
        ERROR_CODE.ISSUE_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    // Permission check: reporter, assignee, participant, or MANAGER/ADMIN
    const isReporter = entity.issReporterId === userId;
    const isAssignee = entity.issAssigneeId === userId;
    const isParticipantUser = await this.participantRepository.findOne({
      where: { issId: id, usrId: userId },
    });
    if (!isReporter && !isAssignee && !isParticipantUser) {
      const actor = await this.userRepository.findOne({ where: { usrId: userId } });
      const isManager = ['MASTER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(actor?.usrRole ?? '');
      if (!isManager) {
        throw new BusinessException(
          ERROR_CODE.ISSUE_PERMISSION_DENIED.code,
          ERROR_CODE.ISSUE_PERMISSION_DENIED.message,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    if (dto.type !== undefined) entity.issType = dto.type;
    if (dto.title !== undefined) entity.issTitle = dto.title;
    if (dto.description !== undefined) entity.issDescription = dto.description;
    if (dto.severity !== undefined) entity.issSeverity = dto.severity;
    if (dto.priority !== undefined) entity.issPriority = dto.priority;
    if (dto.affected_modules !== undefined) entity.issAffectedModules = dto.affected_modules;
    if (dto.resolution !== undefined) entity.issResolution = dto.resolution;
    if (dto.ai_analysis !== undefined) entity.issAiAnalysis = dto.ai_analysis;
    if (dto.assignee !== undefined) entity.issAssignee = dto.assignee;
    // Track previous assignee for auto-participant conversion
    const previousAssigneeId = entity.issAssigneeId;
    const previousAssigneeName = entity.assignee?.usrName || '';

    if (dto.assignee_id !== undefined) {
      const newId = dto.assignee_id || null;
      entity.issAssigneeId = newId;
      // relation 객체도 갱신해야 TypeORM save()가 FK를 덮어쓰지 않음
      entity.assignee = newId ? ({ usrId: newId } as UserEntity) : null;
    }
    if (dto.visibility !== undefined) entity.issVisibility = dto.visibility;
    if (dto.group_id !== undefined) entity.issCellId = dto.group_id || null;
    if (dto.project_id !== undefined) entity.pjtId = dto.project_id || null;
    if (dto.start_date !== undefined) entity.issStartDate = dto.start_date || null;
    if (dto.due_date !== undefined) entity.issDueDate = dto.due_date || null;
    if (dto.done_ratio !== undefined) entity.issDoneRatio = dto.done_ratio;
    if (dto.parent_issue_id !== undefined) entity.issParentId = dto.parent_issue_id || null;
    if (dto.epic_id !== undefined) entity.epcId = dto.epic_id || null;
    if (dto.component_id !== undefined) entity.cmpId = dto.component_id || null;
    if (dto.google_drive_link !== undefined) entity.issGoogleDriveLink = dto.google_drive_link || null;

    // Epic/Component 상호 배타 검증
    if (entity.epcId && entity.cmpId) {
      throw new BusinessException(
        ERROR_CODE.EPIC_COMPONENT_EXCLUSIVE.code,
        ERROR_CODE.EPIC_COMPONENT_EXCLUSIVE.message,
      );
    }

    const saved = await this.issueRepository.save(entity);

    // Log assignee change
    if (
      dto.assignee_id !== undefined &&
      dto.assignee_id !== previousAssigneeId
    ) {
      const newAssignee = dto.assignee_id
        ? await this.userRepository.findOne({ where: { usrId: dto.assignee_id } })
        : null;
      const assigneeLog = this.statusLogRepository.create({
        issId: id,
        islChangeType: 'ASSIGNEE',
        islFromStatus: previousAssigneeName || '',
        islToStatus: newAssignee?.usrName || '',
        islChangedBy: userId,
        islNote: null,
      });
      await this.statusLogRepository.save(assigneeLog);
    }

    // Auto-convert former assignee to participant
    if (
      dto.assignee_id !== undefined &&
      previousAssigneeId &&
      previousAssigneeId !== dto.assignee_id
    ) {
      const existing = await this.participantRepository.findOne({
        where: { issId: id, usrId: previousAssigneeId },
      });
      if (!existing) {
        await this.participantRepository.save(
          this.participantRepository.create({
            issId: id,
            usrId: previousAssigneeId,
            ispRole: 'FORMER_ASSIGNEE',
          }),
        );
      }
    }

    // Update participants if provided
    if (dto.participant_ids !== undefined) {
      // Remove manually-added participants, keep FORMER_ASSIGNEE
      await this.participantRepository.delete({ issId: id, ispRole: 'PARTICIPANT' });
      for (const usrId of dto.participant_ids) {
        const exists = await this.participantRepository.findOne({
          where: { issId: id, usrId },
        });
        if (!exists) {
          await this.participantRepository.save(
            this.participantRepository.create({ issId: id, usrId, ispRole: 'PARTICIPANT' }),
          );
        }
      }
    }

    // Mark translations stale if title or description changed
    if (dto.title !== undefined || dto.description !== undefined) {
      await this.translationService.markStale('ISSUE', saved.issId);
    }

    this.eventEmitter.emit(MODULE_DATA_EVENTS.UPDATED, {
      module: 'issue',
      type: 'ISSUE',
      refId: saved.issId,
      title: saved.issTitle,
      content: [saved.issTitle, saved.issDescription].filter(Boolean).join(' '),
      ownerId: entity.issReporterId,
      visibility: saved.issVisibility,
      cellId: saved.issCellId,
    });

    // Emit assignee notification if assignee changed
    if (dto.assignee_id !== undefined && dto.assignee_id && dto.assignee_id !== userId) {
      const sender = await this.userRepository.findOne({ where: { usrId: userId } });
      this.eventEmitter.emit(ASSIGNEE_EVENT, {
        type: NOTIFICATION_TYPE.ISSUE_ASSIGNED,
        resourceType: NOTIFICATION_RESOURCE_TYPE.ISSUE,
        resourceId: saved.issId,
        resourceTitle: saved.issTitle,
        senderId: userId,
        senderName: sender?.usrName || 'Unknown',
        recipientIds: [dto.assignee_id],
        entityId: entity.entId || '',
        role: ASSIGNEE_ROLE.ASSIGNEE,
      } as AssigneeAssignedEvent);
    }

    const commentCount = await this.commentRepository.count({ where: { issId: id } });
    const participants = await this.participantRepository.find({
      where: { issId: id },
      relations: ['user'],
      order: { ispCreatedAt: 'ASC' },
    });
    return IssueMapper.toResponse(saved, commentCount, participants);
  }

  async updateIssueStatus(
    id: string,
    newStatus: string,
    userId: string,
    note?: string,
  ): Promise<IssueResponse> {
    const entity = await this.issueRepository.findOne({
      where: { issId: id },
      relations: ['reporter', 'assignee'],
    });

    if (!entity) {
      throw new BusinessException(
        ERROR_CODE.ISSUE_NOT_FOUND.code,
        ERROR_CODE.ISSUE_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const currentStatus = entity.issStatus as IssueStatus;

    // 동일 상태로의 변경 방지
    if (currentStatus === newStatus) {
      throw new BusinessException(
        ERROR_CODE.ISSUE_INVALID_STATUS_TRANSITION.code,
        `Already in ${currentStatus} status`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Permission check: reporter, assignee, participant, or MANAGER/ADMIN
    const isParticipant = await this.participantRepository.findOne({
      where: { issId: id, usrId: userId },
    });
    const isInvolved = entity.issReporterId === userId || entity.issAssigneeId === userId || !!isParticipant;
    if (!isInvolved) {
      const actor = await this.userRepository.findOne({ where: { usrId: userId } });
      const isManager = ['MASTER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(actor?.usrRole ?? '');
      if (!isManager) {
        throw new BusinessException(
          ERROR_CODE.ISSUE_PERMISSION_DENIED.code,
          ERROR_CODE.ISSUE_PERMISSION_DENIED.message,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    // CLOSED 전이: reporter 또는 MASTER/ADMIN만 가능
    if (newStatus === 'CLOSED') {
      const isReporter = entity.issReporterId === userId;
      if (!isReporter) {
        const actor = await this.userRepository.findOne({ where: { usrId: userId } });
        const isMasterOrAdmin = actor?.usrRole === 'MASTER' || actor?.usrRole === 'ADMIN';
        if (!isMasterOrAdmin) {
          throw new BusinessException(
            ERROR_CODE.ISSUE_PERMISSION_DENIED.code,
            'Only the reporter or MASTER/ADMIN can close an issue',
            HttpStatus.FORBIDDEN,
          );
        }
      }
    }

    // Create status log
    const log = this.statusLogRepository.create({
      issId: id,
      islFromStatus: currentStatus,
      islToStatus: newStatus,
      islChangedBy: userId,
      islNote: note || null,
    });
    await this.statusLogRepository.save(log);

    // Update status
    entity.issStatus = newStatus;
    if (newStatus === 'RESOLVED') {
      entity.issResolvedAt = new Date();
    }
    if (newStatus === 'OPEN' && entity.issResolvedAt) {
      entity.issResolvedAt = null;
    }

    const saved = await this.issueRepository.save(entity);
    this.logger.log(`Issue ${id} status: ${currentStatus} → ${newStatus}`);

    // Emit status change notification
    const changer = await this.userRepository.findOne({ where: { usrId: userId } });
    const statusParticipantEntities = await this.participantRepository.find({
      where: { issId: id },
    });
    this.eventEmitter.emit(ISSUE_STATUS_EVENT, {
      issueId: id,
      issueTitle: entity.issTitle,
      fromStatus: currentStatus,
      toStatus: newStatus,
      changerId: userId,
      changerName: changer?.usrName || 'Unknown',
      reporterId: entity.issReporterId,
      assigneeId: entity.issAssigneeId,
      participantIds: statusParticipantEntities.map((p) => p.usrId),
      entityId: entity.entId,
    } as IssueStatusChangedEvent);

    const commentCount = await this.commentRepository.count({ where: { issId: id } });
    const statusParticipants = await this.participantRepository.find({
      where: { issId: id },
      relations: ['user'],
      order: { ispCreatedAt: 'ASC' },
    });
    return IssueMapper.toResponse(saved, commentCount, statusParticipants);
  }

  async deleteIssue(id: string): Promise<void> {
    const entity = await this.issueRepository.findOne({ where: { issId: id } });

    if (!entity) {
      throw new BusinessException(
        ERROR_CODE.ISSUE_NOT_FOUND.code,
        ERROR_CODE.ISSUE_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.issueRepository.softRemove(entity);
  }

  /**
   * Soft delete with permission check:
   * - Reporter: only if assignee is not set
   * - Project Manager: if issue belongs to their project
   * - MASTER/ADMIN: always allowed
   */
  async softDeleteIssue(id: string, userId: string, userRole: string, entityId?: string): Promise<void> {
    const entity = await this.issueRepository.findOne({ where: { issId: id } });
    if (!entity) {
      throw new BusinessException(ERROR_CODE.ISSUE_NOT_FOUND.code, ERROR_CODE.ISSUE_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }
    if (entityId && entity.entId && entity.entId !== entityId) {
      throw new BusinessException(ERROR_CODE.ISSUE_NOT_FOUND.code, ERROR_CODE.ISSUE_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    const allowed = await this.checkDeletePermission(entity, userId, userRole);
    if (!allowed) {
      throw new BusinessException(ERROR_CODE.ISSUE_DELETE_NOT_ALLOWED.code, ERROR_CODE.ISSUE_DELETE_NOT_ALLOWED.message, HttpStatus.FORBIDDEN);
    }

    await this.issueRepository.softRemove(entity);
  }

  /**
   * Hard delete (permanent) — MASTER only.
   * Removes issue and all related data within a transaction.
   */
  async permanentDeleteIssue(id: string, entityId?: string): Promise<void> {
    const entity = await this.issueRepository.findOne({ where: { issId: id }, withDeleted: true });
    if (!entity) {
      throw new BusinessException(ERROR_CODE.ISSUE_NOT_FOUND.code, ERROR_CODE.ISSUE_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }
    if (entityId && entity.entId && entity.entId !== entityId) {
      throw new BusinessException(ERROR_CODE.ISSUE_NOT_FOUND.code, ERROR_CODE.ISSUE_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    await this.issueRepository.manager.transaction(async (manager) => {
      // Delete reactions on comments of this issue
      const comments = await manager.find(IssueCommentEntity, { where: { issId: id } });
      if (comments.length > 0) {
        const commentIds = comments.map((c) => c.iscId);
        await manager.delete(IssueCommentReactionEntity, { iscId: In(commentIds) });
      }
      // Delete comments, status logs, participants, ratings
      await manager.delete(IssueCommentEntity, { issId: id });
      await manager.delete(IssueStatusLogEntity, { issId: id });
      await manager.delete(IssueParticipantEntity, { issId: id });
      await manager.delete(IssueRatingEntity, { issId: id });
      // Delete the issue itself (hard delete)
      await manager.remove(entity);
    });
  }

  private async checkDeletePermission(entity: IssueEntity, userId: string, userRole: string): Promise<boolean> {
    // MASTER / ADMIN / SUPER_ADMIN — always allowed
    const privilegedRoles = ['MASTER', 'ADMIN', 'SUPER_ADMIN'];
    if (privilegedRoles.includes(userRole)) return true;

    // Reporter — allowed only if no assignee
    if (entity.issReporterId === userId && !entity.issAssigneeId) {
      return true;
    }

    // Project Manager — allowed for issues in their project
    if (entity.pjtId) {
      const project = await this.projectRepository.findOne({ where: { pjtId: entity.pjtId } });
      if (project && project.pjtManagerId === userId) return true;

      const membership = await this.projectMemberRepository.findOne({
        where: { pjtId: entity.pjtId, usrId: userId, pmbRole: 'MANAGER' },
      });
      if (membership) return true;
    }

    return false;
  }

  // ── Comments ──

  async getIssueComments(issueId: string, userId?: string): Promise<IssueCommentResponse[]> {
    const issue = await this.issueRepository.findOne({ where: { issId: issueId } });
    if (!issue) {
      throw new BusinessException(
        ERROR_CODE.ISSUE_NOT_FOUND.code,
        ERROR_CODE.ISSUE_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const comments = await this.commentRepository.find({
      where: { issId: issueId, iscParentId: IsNull() },
      relations: ['author', 'replies', 'replies.author'],
      order: { iscCreatedAt: 'ASC' },
    });

    const allIds = comments.flatMap((c) => [c.iscId, ...(c.replies || []).map((r) => r.iscId)]);
    const reactionMap = await this.buildCommentReactionMap(allIds, userId);

    return comments.map((c) => ({
      ...IssueMapper.toCommentResponse(c),
      reactions: reactionMap.get(c.iscId) || [],
      replies: (c.replies || [])
        .sort((a, b) => a.iscCreatedAt.getTime() - b.iscCreatedAt.getTime())
        .map((r) => ({
          ...IssueMapper.toCommentResponse(r),
          reactions: reactionMap.get(r.iscId) || [],
        })),
    }));
  }

  async addIssueComment(
    issueId: string,
    content: string,
    userId: string,
    authorType: string = 'USER',
    parentId?: string,
    clientVisible: boolean = false,
  ): Promise<IssueCommentResponse> {
    const issue = await this.issueRepository.findOne({ where: { issId: issueId } });
    if (!issue) {
      throw new BusinessException(
        ERROR_CODE.ISSUE_NOT_FOUND.code,
        ERROR_CODE.ISSUE_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    // Reply validation: only 1 depth allowed
    let parentComment: IssueCommentEntity | null = null;
    if (parentId) {
      parentComment = await this.commentRepository.findOne({ where: { iscId: parentId } });
      if (!parentComment) {
        throw new BusinessException('E3020', 'Parent comment not found', HttpStatus.NOT_FOUND);
      }
      if (parentComment.iscParentId) {
        throw new BusinessException('E3021', 'Nested replies are not allowed', HttpStatus.BAD_REQUEST);
      }
    }

    const comment = this.commentRepository.create({
      issId: issueId,
      iscAuthorId: userId,
      iscAuthorType: authorType,
      iscContent: content,
      iscIssueStatus: issue.issStatus,
      iscParentId: parentId || null,
      iscClientVisible: parentId ? (parentComment?.iscClientVisible ?? clientVisible) : clientVisible,
    });

    const saved = await this.commentRepository.save(comment);

    // Reload with author relation
    const loaded = await this.commentRepository.findOne({
      where: { iscId: saved.iscId },
      relations: ['author'],
    });

    // 멘션 감지 및 알림 발행
    const entityUsers = await this.userRepository.find({
      where: { usrCompanyId: issue.entId! },
      select: ['usrId', 'usrName'],
    });
    const mentionedIds = extractMentionedUserIds(content, entityUsers, userId);
    if (mentionedIds.length > 0) {
      this.eventEmitter.emit(MENTION_EVENT, {
        resourceType: NOTIFICATION_RESOURCE_TYPE.ISSUE,
        resourceId: issueId,
        resourceTitle: issue.issTitle,
        commentId: saved.iscId,
        senderId: userId,
        senderName: loaded?.author?.usrName || '',
        recipientIds: mentionedIds,
        entityId: issue.entId,
      });
    }

    // 멘션이 없을 경우: 답글이면 원래 코멘트 작성자에게, 아니면 assignee + participants 전원에게 알림
    if (mentionedIds.length === 0) {
      if (parentComment && parentComment.iscAuthorId !== userId) {
        // 답글: 원래 코멘트 작성자에게 알림
        this.eventEmitter.emit(MENTION_EVENT, {
          resourceType: NOTIFICATION_RESOURCE_TYPE.ISSUE,
          resourceId: issueId,
          resourceTitle: issue.issTitle,
          commentId: saved.iscId,
          senderId: userId,
          senderName: loaded?.author?.usrName || '',
          recipientIds: [parentComment.iscAuthorId],
          entityId: issue.entId,
        });
      } else if (!parentComment) {
        // 일반 코멘트: assignee + participants 전원에게 알림
        const participants = await this.participantRepository.find({
          where: { issId: issueId },
        });
        const participantUserIds = participants.map((p) => p.usrId);
        const commentRecipients = [
          ...(issue.issAssigneeId ? [issue.issAssigneeId] : []),
          ...participantUserIds,
        ].filter((id) => id !== userId);
        const uniqueRecipients = [...new Set(commentRecipients)];

        if (uniqueRecipients.length > 0) {
          this.eventEmitter.emit(MENTION_EVENT, {
            resourceType: NOTIFICATION_RESOURCE_TYPE.ISSUE,
            resourceId: issueId,
            resourceTitle: issue.issTitle,
            commentId: saved.iscId,
            senderId: userId,
            senderName: loaded?.author?.usrName || '',
            recipientIds: uniqueRecipients,
            entityId: issue.entId,
          });
        }
      }
    }

    return IssueMapper.toCommentResponse(loaded!);
  }

  async deleteIssueComment(commentId: string, _userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { iscId: commentId } });

    if (!comment) {
      throw new BusinessException(
        ERROR_CODE.ISSUE_COMMENT_NOT_FOUND.code,
        ERROR_CODE.ISSUE_COMMENT_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.commentRepository.remove(comment);
  }

  async toggleCommentClientVisible(
    commentId: string,
    clientVisible: boolean,
  ): Promise<{ commentId: string; clientVisible: boolean }> {
    const comment = await this.commentRepository.findOne({ where: { iscId: commentId } });
    if (!comment) {
      throw new BusinessException(
        ERROR_CODE.ISSUE_COMMENT_NOT_FOUND.code,
        ERROR_CODE.ISSUE_COMMENT_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    comment.iscClientVisible = clientVisible;
    await this.commentRepository.save(comment);

    // 대댓글도 동일하게 변경
    await this.commentRepository.update(
      { iscParentId: commentId },
      { iscClientVisible: clientVisible },
    );

    return { commentId, clientVisible };
  }

  // ── Comment Reactions ──

  private static readonly REACTION_TYPES = ['LIKE', 'CHECK', 'PRAY', 'GRIN', 'LOVE'] as const;

  async toggleCommentReaction(
    commentId: string,
    reactionType: string,
    userId: string,
  ): Promise<{ type: string; count: number; reacted: boolean }[]> {
    const existing = await this.commentReactionRepository.findOne({
      where: { iscId: commentId, usrId: userId, icrType: reactionType },
    });

    if (existing) {
      await this.commentReactionRepository.remove(existing);
    } else {
      await this.commentReactionRepository.save(
        this.commentReactionRepository.create({ iscId: commentId, usrId: userId, icrType: reactionType }),
      );

      // 리액션 추가 시 코멘트 작성자에게 알림
      try {
        const comment = await this.commentRepository.findOne({ where: { iscId: commentId } });
        if (comment && comment.iscAuthorId !== userId) {
          const issue = await this.issueRepository.findOne({ where: { issId: comment.issId } });
          const user = await this.userRepository.findOne({ where: { usrId: userId }, select: ['usrId', 'usrName'] });
          if (issue && user) {
            this.eventEmitter.emit(REACTION_EVENT, {
              resourceType: NOTIFICATION_RESOURCE_TYPE.ISSUE,
              resourceId: issue.issId,
              resourceTitle: issue.issTitle,
              commentId,
              reactionType,
              senderId: userId,
              senderName: user.usrName || '',
              recipientId: comment.iscAuthorId,
              entityId: issue.entId,
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to emit reaction notification: ${err.message}`);
      }
    }

    return this.getCommentReactionSummary(commentId, userId);
  }

  async getCommentReactionSummary(
    commentId: string,
    userId: string,
  ): Promise<{ type: string; count: number; reacted: boolean }[]> {
    const reactions = await this.commentReactionRepository.find({ where: { iscId: commentId } });
    return IssueService.REACTION_TYPES
      .map((type) => {
        const filtered = reactions.filter((r) => r.icrType === type);
        return { type, count: filtered.length, reacted: filtered.some((r) => r.usrId === userId) };
      })
      .filter((s) => s.count > 0);
  }

  private async buildCommentReactionMap(
    commentIds: string[],
    userId?: string,
  ): Promise<Map<string, { type: string; count: number; reacted: boolean }[]>> {
    if (commentIds.length === 0) return new Map();

    const reactions = await this.commentReactionRepository.find({ where: { iscId: In(commentIds) } });
    const map = new Map<string, { type: string; count: number; reacted: boolean }[]>();

    for (const cId of commentIds) {
      const cReactions = reactions.filter((r) => r.iscId === cId);
      const summaries = IssueService.REACTION_TYPES
        .map((type) => {
          const filtered = cReactions.filter((r) => r.icrType === type);
          return { type, count: filtered.length, reacted: userId ? filtered.some((r) => r.usrId === userId) : false };
        })
        .filter((s) => s.count > 0);
      if (summaries.length > 0) map.set(cId, summaries);
    }

    return map;
  }

  // ── Status Logs ──

  async getIssueStatusLogs(issueId: string): Promise<IssueStatusLogResponse[]> {
    const issue = await this.issueRepository.findOne({ where: { issId: issueId } });
    if (!issue) {
      throw new BusinessException(
        ERROR_CODE.ISSUE_NOT_FOUND.code,
        ERROR_CODE.ISSUE_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const logs = await this.statusLogRepository.find({
      where: { issId: issueId },
      relations: ['changedByUser'],
      order: { islCreatedAt: 'DESC' },
    });

    return logs.map(IssueMapper.toStatusLogResponse);
  }

  /**
   * 내가 작성하거나 나에게 할당된 이슈 조회
   */
  async getMyIssues(userId: string, entityId?: string, size = 5): Promise<IssueResponse[]> {
    const qb = this.issueRepository
      .createQueryBuilder('iss')
      .leftJoinAndSelect('iss.reporter', 'reporter')
      .leftJoinAndSelect('iss.assignee', 'assignee')
      .leftJoinAndSelect('iss.project', 'project')
      .leftJoinAndSelect('iss.epic', 'epic')
      .leftJoinAndSelect('iss.component', 'component')
      .where(
        '(iss.issReporterId = :userId OR iss.issAssigneeId = :userId OR iss.issId IN ' +
        '(SELECT isp.iss_id FROM amb_issue_participants isp WHERE isp.usr_id = :userId))',
        { userId },
      );

    if (entityId) {
      qb.andWhere('iss.entId = :entityId', { entityId });
    }

    qb.orderBy('iss.issPriority', 'ASC')
      .addOrderBy('iss.issCreatedAt', 'DESC')
      .take(size);

    const entities = await qb.getMany();
    const issueIds = entities.map((e) => e.issId);
    const commentCounts = await this.getCommentCounts(issueIds);
    const participantsMap = await this.getParticipantsMap(issueIds);

    return entities.map((e) => IssueMapper.toResponse(e, commentCounts[e.issId] || 0, participantsMap[e.issId]));
  }

  // ── Filter Presets ──

  async getFilterPresets(userId: string): Promise<Array<{ name: string; filters: Record<string, any> }>> {
    const user = await this.userRepository.findOne({ where: { usrId: userId } });
    return user?.usrIssueFilterPresets || [];
  }

  async saveFilterPresets(userId: string, presets: Array<{ name: string; filters: Record<string, any> }>): Promise<void> {
    await this.userRepository.update(userId, { usrIssueFilterPresets: presets });
  }

  // ── Private helpers ──

  private async getParticipantsMap(issueIds: string[]): Promise<Record<string, IssueParticipantEntity[]>> {
    if (issueIds.length === 0) return {};

    const participants = await this.participantRepository.find({
      where: { issId: In(issueIds) },
      relations: ['user'],
      order: { ispCreatedAt: 'ASC' },
    });

    const result: Record<string, IssueParticipantEntity[]> = {};
    for (const p of participants) {
      if (!result[p.issId]) result[p.issId] = [];
      result[p.issId].push(p);
    }
    return result;
  }

  private async getCommentCounts(issueIds: string[]): Promise<Record<string, number>> {
    if (issueIds.length === 0) return {};

    const counts = await this.commentRepository
      .createQueryBuilder('c')
      .select('c.iss_id', 'issId')
      .addSelect('COUNT(*)', 'count')
      .where('c.iss_id IN (:...issueIds)', { issueIds })
      .groupBy('c.iss_id')
      .getRawMany();

    const result: Record<string, number> = {};
    for (const row of counts) {
      result[row.issId] = Number(row.count);
    }
    return result;
  }

  private async getRatingStats(issueIds: string[]): Promise<Record<string, { avg: number; count: number }>> {
    if (issueIds.length === 0) return {};

    const rows = await this.issueRatingRepository
      .createQueryBuilder('r')
      .select('r.iss_id', 'issId')
      .addSelect('AVG(r.isr_rating)', 'avg')
      .addSelect('COUNT(*)::int', 'count')
      .where('r.iss_id IN (:...issueIds)', { issueIds })
      .groupBy('r.iss_id')
      .getRawMany();

    const result: Record<string, { avg: number; count: number }> = {};
    for (const row of rows) {
      result[row.issId] = { avg: parseFloat(Number(row.avg).toFixed(1)), count: Number(row.count) };
    }
    return result;
  }

  private async getMyRatings(issueIds: string[], userId: string): Promise<Record<string, number>> {
    if (issueIds.length === 0) return {};

    const ratings = await this.issueRatingRepository.find({
      where: { issId: In(issueIds), usrId: userId },
    });

    const result: Record<string, number> = {};
    for (const r of ratings) {
      result[r.issId] = r.isrRating;
    }
    return result;
  }

  aiReview(issueId: string, userId: string, entityId?: string, language: string = 'en'): Observable<{ type: string; content: string }> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const issue = await this.issueRepository.findOne({
            where: { issId: issueId },
            relations: ['reporter'],
          });

          if (!issue) {
            subscriber.next({ type: 'error', content: 'Issue not found' });
            subscriber.complete();
            return;
          }

          const langInstruction = language === 'ko'
            ? 'Respond only in Korean (한국어로만 응답하세요).'
            : language === 'vi'
              ? 'Respond only in Vietnamese (Chỉ trả lời bằng tiếng Việt).'
              : 'Respond only in English.';

          const systemPrompt = `You are an expert issue reviewer for a business management system.
${langInstruction}
Be concise and actionable.`;

          const userMessage = `Please review the following issue:

**Title**: ${issue.issTitle}
**Type**: ${issue.issType}
**Severity**: ${issue.issSeverity}
**Priority**: ${issue.issPriority}
**Status**: ${issue.issStatus}
**Reporter**: ${issue.reporter?.usrName || 'Unknown'}
**Affected Modules**: ${issue.issAffectedModules?.join(', ') || 'N/A'}
**Description**:
${issue.issDescription || 'No description'}

Please provide your analysis in the following format:

## Summary
(1-2 sentence summary of the issue)

## Severity Assessment
(Is the assigned severity appropriate? Why?)

## Impact Scope
(What modules/features are affected?)

## Suggested Resolution
(Possible approaches to resolve this issue)

## Recommendation
(APPROVE / REJECT / NEED_MORE_INFO with brief reason)`;

          const stream$ = this.claudeService.streamMessage(
            systemPrompt,
            [{ role: 'user', content: userMessage }],
            entityId ? { entId: entityId, usrId: userId, sourceType: 'ISSUE_AI_REVIEW' } : undefined,
          );

          let fullContent = '';

          stream$.subscribe({
            next: (event: ClaudeStreamEvent) => {
              if (event.type === 'content' && event.content) {
                fullContent += event.content;
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
            complete: async () => {
              // 완료 시 AI 분석 결과 저장
              if (fullContent) {
                await this.issueRepository.update(
                  { issId: issueId },
                  { issAiAnalysis: fullContent },
                );
              }
              subscriber.complete();
            },
          });
        } catch (err) {
          subscriber.next({ type: 'error', content: err instanceof Error ? err.message : 'Internal error' });
          subscriber.complete();
        }
      })();
    });
  }
}
