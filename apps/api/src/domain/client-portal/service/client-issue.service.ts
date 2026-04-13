import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { IssueCommentEntity } from '../../issues/entity/issue-comment.entity';
import { IssueParticipantEntity } from '../../issues/entity/issue-participant.entity';
import { IssueStatusLogEntity } from '../../issues/entity/issue-status-log.entity';
import { ProjectClientEntity } from '../../project/entity/project-client.entity';
import { ProjectEntity } from '../../project/entity/project.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { IssueSequenceService } from '../../issues/service/issue-sequence.service';
import {
  ISSUE_STATUS_EVENT,
  IssueStatusChangedEvent,
  MENTION_EVENT,
  NOTIFICATION_TYPE,
  NOTIFICATION_RESOURCE_TYPE,
} from '../../notification/constant/notification-type.constant';

@Injectable()
export class ClientIssueService {
  constructor(
    @InjectRepository(IssueEntity)
    private readonly issueRepository: Repository<IssueEntity>,
    @InjectRepository(IssueCommentEntity)
    private readonly commentRepository: Repository<IssueCommentEntity>,
    @InjectRepository(IssueParticipantEntity)
    private readonly participantRepository: Repository<IssueParticipantEntity>,
    @InjectRepository(IssueStatusLogEntity)
    private readonly statusLogRepository: Repository<IssueStatusLogEntity>,
    @InjectRepository(ProjectClientEntity)
    private readonly projectClientRepository: Repository<ProjectClientEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly issueSequenceService: IssueSequenceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 이슈 생성 (고객)
   */
  async createIssue(userId: string, cliId: string, dto: {
    project_id: string;
    type: string;
    title: string;
    description: string;
    severity: string;
    epic_id?: string;
    component_id?: string;
    parent_issue_id?: string;
    assignee_id?: string;
    participant_ids?: string[];
    start_date?: string;
    due_date?: string;
    google_drive_link?: string;
  }) {
    // 프로젝트 접근 권한 확인
    const link = await this.projectClientRepository.findOne({
      where: { pjtId: dto.project_id, cliId, pclStatus: 'ACTIVE' },
    });
    if (!link) {
      throw new ForbiddenException('No access to this project');
    }

    // 프로젝트의 entId 조회
    const project = await this.projectRepository.findOne({
      where: { pjtId: dto.project_id },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 허용 이슈 타입 확인
    const allowedTypes = ['BUG', 'FEATURE_REQUEST', 'OPINION', 'OTHER'];
    if (!allowedTypes.includes(dto.type)) {
      throw new BadRequestException(`Issue type must be one of: ${allowedTypes.join(', ')}`);
    }

    const issue = this.issueRepository.create({
      entId: project.entId,
      issType: dto.type,
      issTitle: dto.title,
      issDescription: dto.description,
      issSeverity: dto.severity,
      issStatus: 'OPEN',
      issPriority: 3,
      issReporterId: userId,
      issAssigneeId: dto.assignee_id || userId,
      issVisibility: 'ENTITY',
      pjtId: dto.project_id,
      epcId: dto.epic_id || null,
      cmpId: dto.component_id || null,
      issParentId: dto.parent_issue_id || null,
      issStartDate: dto.start_date || null,
      issDueDate: dto.due_date || null,
      issGoogleDriveLink: dto.google_drive_link || null,
      issRefNumber: await this.issueSequenceService.generateRefNumber(project.entId),
    });

    const saved = await this.issueRepository.save(issue);

    // 관련자(participants) 등록
    if (dto.participant_ids?.length) {
      const participants = dto.participant_ids.map(usrId =>
        this.participantRepository.create({ issId: saved.issId, usrId, ispRole: 'PARTICIPANT' }),
      );
      await this.participantRepository.save(participants);
    }

    return this.mapIssue(saved);
  }

  /**
   * 고객이 등록한 이슈 목록
   */
  async findMyIssues(userId: string, cliId: string, query?: {
    status?: string;
    project_id?: string;
    search?: string;
    page?: number;
    size?: number;
  }) {
    const page = query?.page || 1;
    const size = query?.size || 20;

    const qb = this.issueRepository.createQueryBuilder('i')
      .leftJoinAndSelect('i.reporter', 'reporter')
      .leftJoinAndSelect('i.assignee', 'assignee')
      .leftJoinAndSelect('i.project', 'project')
      .where('i.issReporterId = :userId', { userId })
      .andWhere('i.issDeletedAt IS NULL');

    if (query?.status) {
      qb.andWhere('i.issStatus = :status', { status: query.status });
    }

    if (query?.project_id) {
      qb.andWhere('i.pjtId = :pjtId', { pjtId: query.project_id });
    }

    if (query?.search) {
      qb.andWhere('(i.issTitle ILIKE :search OR i.issDescription ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('i.issCreatedAt', 'DESC');
    qb.skip((page - 1) * size).take(size);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map(i => this.mapIssue(i)),
      pagination: { page, size, total, totalPages: Math.ceil(total / size) },
    };
  }

  /**
   * 프로젝트별 이슈 목록 (고객 뷰)
   */
  async findProjectIssues(projectId: string, cliId: string, query?: {
    status?: string;
    exclude_closed?: string;
    search?: string;
    sort?: string;
    page?: number;
    size?: number;
  }) {
    // 접근 권한 확인
    const link = await this.projectClientRepository.findOne({
      where: { pjtId: projectId, cliId, pclStatus: 'ACTIVE' },
    });
    if (!link) {
      throw new ForbiddenException('No access to this project');
    }

    const page = query?.page || 1;
    const size = query?.size || 20;

    const qb = this.issueRepository.createQueryBuilder('i')
      .leftJoinAndSelect('i.reporter', 'reporter')
      .leftJoinAndSelect('i.assignee', 'assignee')
      .where('i.pjtId = :projectId', { projectId })
      .andWhere('i.issDeletedAt IS NULL')
      .andWhere("i.issVisibility = 'ENTITY'");

    if (query?.status && query.status !== 'all') {
      qb.andWhere('i.issStatus = :status', { status: query.status });
    }

    if (query?.exclude_closed === 'true') {
      qb.andWhere("i.issStatus NOT IN ('CLOSED', 'REJECTED')");
    }

    if (query?.search) {
      qb.andWhere('(i.issTitle ILIKE :search)', { search: `%${query.search}%` });
    }

    // 정렬
    switch (query?.sort) {
      case 'status':
        qb.orderBy('i.issStatus', 'ASC').addOrderBy('i.issCreatedAt', 'DESC');
        break;
      case 'priority':
        qb.orderBy('i.issPriority', 'ASC').addOrderBy('i.issCreatedAt', 'DESC');
        break;
      default:
        qb.orderBy('i.issCreatedAt', 'DESC');
    }

    qb.skip((page - 1) * size).take(size);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map(i => this.mapIssue(i)),
      pagination: { page, size, total, totalPages: Math.ceil(total / size) },
    };
  }

  /**
   * 이슈 상세 (고객 뷰)
   */
  async findIssueById(issueId: string, userId: string, cliId: string) {
    const issue = await this.issueRepository.findOne({
      where: { issId: issueId },
      relations: ['reporter', 'assignee', 'project', 'comments', 'comments.author'],
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // 접근 권한: 본인이 reporter이거나, 프로젝트가 cliId에 연결됨
    if (issue.issReporterId !== userId) {
      if (issue.pjtId) {
        const link = await this.projectClientRepository.findOne({
          where: { pjtId: issue.pjtId, cliId, pclStatus: 'ACTIVE' },
        });
        if (!link) {
          throw new ForbiddenException('No access to this issue');
        }
      } else {
        throw new ForbiddenException('No access to this issue');
      }
    }

    return {
      ...this.mapIssue(issue),
      description: issue.issDescription,
      comments: (issue.comments || [])
        .filter(c => c.iscClientVisible === true)
        .map(c => ({
        id: c.iscId,
        content: c.iscContent,
        authorName: c.author?.usrName || 'Unknown',
        authorType: c.iscAuthorType,
        issueStatus: c.iscIssueStatus,
        createdAt: c.iscCreatedAt,
      })) || [],
    };
  }

  /**
   * 코멘트 추가 (고객)
   */
  async addComment(issueId: string, userId: string, cliId: string, content: string) {
    // 이슈 접근 확인
    const issue = await this.issueRepository.findOne({ where: { issId: issueId } });
    if (!issue) throw new NotFoundException('Issue not found');

    // 접근 권한: reporter이거나 프로젝트 접근 가능
    if (issue.issReporterId !== userId && issue.pjtId) {
      const link = await this.projectClientRepository.findOne({
        where: { pjtId: issue.pjtId, cliId, pclStatus: 'ACTIVE' },
      });
      if (!link) throw new ForbiddenException('No access to this issue');
    }

    const comment = this.commentRepository.create({
      issId: issueId,
      iscAuthorId: userId,
      iscAuthorType: 'USER',
      iscContent: content,
      iscClientVisible: true,
    });

    const saved = await this.commentRepository.save(comment);

    // 알림 발송: 담당자 + 관련자에게 코멘트 알림
    this.emitCommentNotification(issue, userId).catch(() => {});

    return {
      id: saved.iscId,
      content: saved.iscContent,
      createdAt: saved.iscCreatedAt,
    };
  }

  /**
   * 해결 확인 (RESOLVED → CLOSED)
   */
  async confirmResolution(issueId: string, userId: string) {
    const issue = await this.issueRepository.findOne({ where: { issId: issueId } });
    if (!issue) throw new NotFoundException('Issue not found');

    if (issue.issReporterId !== userId) {
      throw new ForbiddenException('Only the reporter can confirm resolution');
    }

    if (issue.issStatus !== 'RESOLVED') {
      throw new BadRequestException('Issue must be in RESOLVED status to confirm');
    }

    await this.issueRepository.update(issueId, { issStatus: 'CLOSED' });

    // 상태 변경 로그 생성
    await this.statusLogRepository.save(this.statusLogRepository.create({
      issId: issueId,
      islFromStatus: 'RESOLVED',
      islToStatus: 'CLOSED',
      islChangedBy: userId,
      islNote: 'Resolution confirmed by client',
    }));

    // 상태 변경 코멘트 자동 생성
    await this.commentRepository.save({
      issId: issueId,
      iscAuthorId: userId,
      iscAuthorType: 'USER',
      iscContent: 'Resolution confirmed by client',
      iscIssueStatus: 'CLOSED',
    });

    // 상태 변경 알림 이벤트 발행
    const changer = await this.userRepository.findOne({ where: { usrId: userId } });
    this.eventEmitter.emit(ISSUE_STATUS_EVENT, {
      issueId,
      issueTitle: issue.issTitle,
      fromStatus: 'RESOLVED',
      toStatus: 'CLOSED',
      changerId: userId,
      changerName: changer?.usrName || 'Client',
      reporterId: issue.issReporterId,
      assigneeId: issue.issAssigneeId,
      entityId: issue.entId,
    } as IssueStatusChangedEvent);

    return { success: true, status: 'CLOSED' };
  }

  private mapIssue(i: IssueEntity) {
    return {
      id: i.issId,
      refNumber: i.issRefNumber || null,
      type: i.issType,
      title: i.issTitle,
      severity: i.issSeverity,
      status: i.issStatus,
      priority: i.issPriority,
      reporterId: i.issReporterId,
      reporterName: (i as any).reporter?.usrName || null,
      assigneeName: (i as any).assignee?.usrName || null,
      projectId: i.pjtId,
      projectName: (i as any).project?.pjtName || null,
      doneRatio: (i as any).issDoneRatio || 0,
      createdAt: (i as any).issCreatedAt,
      updatedAt: (i as any).issUpdatedAt,
    };
  }

  /**
   * 이슈 상태 변경 이력 조회
   */
  async getStatusLogs(issueId: string, userId: string, cliId: string) {
    const issue = await this.issueRepository.findOne({ where: { issId: issueId } });
    if (!issue) throw new NotFoundException('Issue not found');

    // 접근 권한 확인
    if (issue.issReporterId !== userId && issue.pjtId) {
      const link = await this.projectClientRepository.findOne({
        where: { pjtId: issue.pjtId, cliId, pclStatus: 'ACTIVE' },
      });
      if (!link) throw new ForbiddenException('No access to this issue');
    }

    const logs = await this.statusLogRepository.find({
      where: { issId: issueId },
      relations: ['changedByUser'],
      order: { islCreatedAt: 'DESC' },
    });

    return logs.map((log) => ({
      logId: log.islId,
      changeType: log.islChangeType,
      fromStatus: log.islFromStatus,
      toStatus: log.islToStatus,
      changedByName: log.changedByUser?.usrName || 'Unknown',
      note: log.islNote,
      createdAt: log.islCreatedAt,
    }));
  }

  /**
   * 코멘트 작성 시 담당자 + 관련자에게 알림 발송
   */
  private async emitCommentNotification(issue: IssueEntity, commenterId: string): Promise<void> {
    const recipients = new Set<string>();
    // 담당자에게 알림
    if (issue.issAssigneeId && issue.issAssigneeId !== commenterId) {
      recipients.add(issue.issAssigneeId);
    }
    // 작성자(reporter)에게 알림
    if (issue.issReporterId !== commenterId) {
      recipients.add(issue.issReporterId);
    }
    // 관련자들에게 알림
    const participants = await this.participantRepository.find({ where: { issId: issue.issId } });
    for (const p of participants) {
      if (p.usrId !== commenterId) {
        recipients.add(p.usrId);
      }
    }

    if (recipients.size === 0) return;

    const commenter = await this.userRepository.findOne({ where: { usrId: commenterId } });
    const commenterName = commenter?.usrName || 'Client';

    this.eventEmitter.emit(MENTION_EVENT, {
      resourceType: NOTIFICATION_RESOURCE_TYPE.ISSUE,
      resourceId: issue.issId,
      resourceTitle: issue.issTitle,
      commentId: '',
      senderId: commenterId,
      senderName: commenterName,
      recipientIds: [...recipients],
      entityId: issue.entId,
    });
  }
}
