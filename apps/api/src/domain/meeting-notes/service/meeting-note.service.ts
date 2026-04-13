import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository, Brackets, In, IsNull } from 'typeorm';
import { MeetingNoteEntity } from '../entity/meeting-note.entity';
import { MeetingNoteProjectEntity } from '../entity/meeting-note-project.entity';
import { MeetingNoteParticipantEntity } from '../entity/meeting-note-participant.entity';
import { MeetingNoteIssueEntity } from '../entity/meeting-note-issue.entity';
import { MeetingNoteCommentEntity } from '../entity/meeting-note-comment.entity';
import { MeetingNoteRatingEntity } from '../entity/meeting-note-rating.entity';
import { MeetingNoteFolderEntity } from '../entity/meeting-note-folder.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { CreateMeetingNoteRequest } from '../dto/request/create-meeting-note.request';
import { UpdateMeetingNoteRequest } from '../dto/request/update-meeting-note.request';
import { CreateFolderRequest } from '../dto/request/create-folder.request';
import { UpdateFolderRequest } from '../dto/request/update-folder.request';
import { MeetingNoteMapper } from '../mapper/meeting-note.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { MeetingNoteResponse, MeetingNoteCommentResponse } from '@amb/types';
import { TranslationService } from '../../translation/service/translation.service';
import { CellAccessService } from '../../members/service/cell-access.service';
import { MODULE_DATA_EVENTS } from '../../kms/event/module-data.event';
import {
  ASSIGNEE_EVENT,
  NOTIFICATION_TYPE,
  NOTIFICATION_RESOURCE_TYPE,
  ASSIGNEE_ROLE,
  AssigneeAssignedEvent,
  MENTION_EVENT,
} from '../../notification/constant/notification-type.constant';
import { extractMentionedUserIds } from '../../notification/util/mention.util';
import { NoteLinkService } from './note-link.service';
import { stripHtml } from '../../../global/util/sanitize.util';
import { IssueService } from '../../issues/service/issue.service';

@Injectable()
export class MeetingNoteService {
  constructor(
    @InjectRepository(MeetingNoteEntity)
    private readonly noteRepository: Repository<MeetingNoteEntity>,
    @InjectRepository(MeetingNoteProjectEntity)
    private readonly projectRepo: Repository<MeetingNoteProjectEntity>,
    @InjectRepository(MeetingNoteParticipantEntity)
    private readonly participantRepo: Repository<MeetingNoteParticipantEntity>,
    @InjectRepository(MeetingNoteIssueEntity)
    private readonly issueRepo: Repository<MeetingNoteIssueEntity>,
    @InjectRepository(MeetingNoteCommentEntity)
    private readonly commentRepo: Repository<MeetingNoteCommentEntity>,
    @InjectRepository(MeetingNoteRatingEntity)
    private readonly ratingRepo: Repository<MeetingNoteRatingEntity>,
    @InjectRepository(MeetingNoteFolderEntity)
    private readonly folderRepo: Repository<MeetingNoteFolderEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly translationService: TranslationService,
    private readonly cellAccessService: CellAccessService,
    private readonly noteLinkService: NoteLinkService,
    private readonly issueService: IssueService,
  ) {}

  private async getUserUnit(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { usrId: userId } });
    return user?.usrUnit || '';
  }

  private readonly fullRelations = [
    'user', 'assignee', 'folder',
    'participants', 'participants.user',
    'projects', 'projects.project',
    'issues', 'issues.issue',
  ];

  /**
   * 노트의 tsvector 검색 벡터를 업데이트
   */
  private async updateSearchVector(noteId: string, title: string, content: string): Promise<void> {
    const plainText = stripHtml(content || '');
    await this.noteRepository.query(
      `UPDATE amb_meeting_notes SET mtn_search_vector = to_tsvector('simple', coalesce($1, '') || ' ' || coalesce($2, '')) WHERE mtn_id = $3`,
      [title || '', plainText, noteId],
    );
  }

  /**
   * Full-text 검색 (tsvector 기반)
   */
  async fullTextSearch(
    query: string,
    userId: string,
    entityId: string,
    scope?: string,
    page = 1,
    size = 20,
  ): Promise<{ data: any[]; totalCount: number }> {
    // 검색어를 tsquery 형식으로 변환: 공백 -> &, 각 단어 뒤에 :* (prefix match)
    const words = query.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return { data: [], totalCount: 0 };
    const tsQuery = words.map((w) => `${w}:*`).join(' & ');

    const userDept = await this.getUserUnit(userId);
    const userCellIds = await this.cellAccessService.getUserCellIds(userId);

    const qb = this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.user', 'user')
      .leftJoinAndSelect('note.folder', 'folder')
      .where('note.entId = :entityId', { entityId })
      .andWhere('note.mtnDeletedAt IS NULL')
      .andWhere(
        `note.mtnSearchVector @@ to_tsquery('simple', :tsQuery)`,
        { tsQuery },
      );

    // Visibility filter
    qb.andWhere(
      `(note.usrId = :userId
        OR note.mtnVisibility = 'ENTITY'
        OR (note.mtnVisibility = 'UNIT' AND note.mtnUnit = :userDept)
        ${userCellIds.length > 0 ? `OR (note.mtnVisibility = 'CELL' AND note.mtnCellId IN (:...userCellIds))` : ''}
      )`,
      { userId, userDept, ...(userCellIds.length > 0 ? { userCellIds } : {}) },
    );

    if (scope === 'mine') {
      qb.andWhere('note.usrId = :scopeUser', { scopeUser: userId });
    }

    // ts_headline으로 매칭 스니펫 생성
    qb.addSelect(
      `ts_headline('simple', coalesce(note.mtnTitle, '') || ' ' || coalesce(note.mtnContent, ''), to_tsquery('simple', :tsQuery), 'StartSel=<mark>,StopSel=</mark>,MaxWords=40,MinWords=20')`,
      'snippet',
    );
    qb.addSelect(
      `ts_rank(note.mtnSearchVector, to_tsquery('simple', :tsQuery))`,
      'rank',
    );

    const totalCount = await qb.getCount();

    qb.orderBy('rank', 'DESC')
      .addOrderBy('note.mtnUpdatedAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);

    const rawResults = await qb.getRawAndEntities();

    const data = rawResults.entities.map((entity, idx) => ({
      meetingNoteId: entity.mtnId,
      title: entity.mtnTitle,
      type: entity.mtnType,
      authorName: entity.user?.usrName || '',
      folderName: entity.folder?.mnfName || null,
      updatedAt: entity.mtnUpdatedAt,
      snippet: rawResults.raw[idx]?.snippet || '',
      rank: parseFloat(rawResults.raw[idx]?.rank || '0'),
    }));

    return { data, totalCount };
  }

  async getMeetingNotes(
    userId: string,
    filters?: { visibility?: string; date_from?: string; date_to?: string; type?: string; scope?: string; search?: string; folder_id?: string; exclude_daily?: boolean },
    entityId?: string,
    page = 1,
    size = 20,
  ): Promise<{ data: MeetingNoteResponse[]; totalCount: number }> {
    const userDept = await this.getUserUnit(userId);
    const userCellIds = await this.cellAccessService.getUserCellIds(userId);

    const qb = this.noteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.user', 'user')
      .leftJoinAndSelect('note.assignee', 'assignee')
      .leftJoinAndSelect('note.folder', 'folder')
      .leftJoinAndSelect('note.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .leftJoinAndSelect('note.projects', 'projects')
      .leftJoinAndSelect('projects.project', 'project')
      .leftJoinAndSelect('note.issues', 'issues')
      .leftJoinAndSelect('issues.issue', 'issue');

    if (entityId) {
      qb.where('note.entId = :entityId', { entityId });
    }

    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where('note.usrId = :userId', { userId })
          .orWhere('note.mtnVisibility = :public', { public: 'PUBLIC' })
          .orWhere(
            new Brackets((deptSub) => {
              deptSub
                .where('note.mtnVisibility = :dept', { dept: 'UNIT' })
                .andWhere('note.mtnUnit = :userDept', { userDept });
            }),
          )
          .orWhere(
            new Brackets((entSub) => {
              entSub
                .where('note.mtnVisibility = :entity', { entity: 'ENTITY' })
                .andWhere('note.entId = :entId', { entId: entityId || '' });
            }),
          );
        if (userCellIds.length > 0) {
          sub.orWhere(
            new Brackets((grpSub) => {
              grpSub
                .where('note.mtnVisibility = :group', { group: 'CELL' })
                .andWhere('note.mtnCellId IN (:...userCellIds)', { userCellIds });
            }),
          );
        }
      }),
    );

    if (filters?.visibility) {
      qb.andWhere('note.mtnVisibility = :filterVis', { filterVis: filters.visibility });
    }

    // Scope filter (view scope)
    if (filters?.scope === 'mine') {
      qb.andWhere('note.usrId = :scopeUserId', { scopeUserId: userId });
    } else if (filters?.scope === 'unit') {
      const userUnit = await this.getUserUnit(userId);
      if (userUnit) {
        // Find all users in same unit
        const unitUsers = await this.userRepository.find({
          where: { usrUnit: userUnit },
          select: ['usrId'],
        });
        const unitUserIds = unitUsers.map((u) => u.usrId);
        if (unitUserIds.length > 0) {
          qb.andWhere('note.usrId IN (:...unitUserIds)', { unitUserIds });
        }
      }
    } else if (filters?.scope === 'cell') {
      const cellIds = await this.cellAccessService.getUserCellIds(userId);
      if (cellIds.length > 0) {
        qb.andWhere('note.mtnCellId IN (:...scopeCellIds)', { scopeCellIds: cellIds });
      } else {
        qb.andWhere('1 = 0');
      }
    }
    // scope === 'all' or undefined → no additional filter

    if (filters?.type) {
      qb.andWhere('note.mtnType = :filterType', { filterType: filters.type });
    } else if (filters?.exclude_daily) {
      qb.andWhere('note.mtnType != :dailyType', { dailyType: 'DAILY_NOTE' });
    }
    if (filters?.search) {
      const searchWords = filters.search.trim().split(/\s+/).filter(Boolean);
      if (searchWords.length > 0) {
        const tsQuery = searchWords.map((w) => `${w}:*`).join(' & ');
        qb.andWhere(
          new Brackets((sub) => {
            sub
              .where(`note.mtnSearchVector @@ to_tsquery('simple', :tsQuery)`, { tsQuery })
              .orWhere('LOWER(note.mtnTitle) LIKE LOWER(:search)', { search: `%${filters.search}%` });
          }),
        );
      }
    }
    if (filters?.date_from) {
      qb.andWhere('note.mtnMeetingDate >= :dateFrom', { dateFrom: filters.date_from });
    }
    if (filters?.date_to) {
      qb.andWhere('note.mtnMeetingDate <= :dateTo', { dateTo: filters.date_to });
    }
    if (filters?.folder_id === 'uncategorized') {
      qb.andWhere('note.mtnFolderId IS NULL');
    } else if (filters?.folder_id) {
      qb.andWhere('note.mtnFolderId = :folderId', { folderId: filters.folder_id });
    }

    qb.orderBy('note.mtnMeetingDate', 'DESC').addOrderBy('note.mtnCreatedAt', 'DESC');

    qb.skip((page - 1) * size).take(size);
    const [entities, totalCount] = await qb.getManyAndCount();

    // Batch fetch comment counts and rating stats
    const noteIds = entities.map((e) => e.mtnId);
    const commentCounts = await this.getCommentCounts(noteIds);
    const ratingStats = await this.getRatingStats(noteIds);
    const myRatings = await this.getMyRatings(noteIds, userId);

    const data = entities.map((e) => MeetingNoteMapper.toResponse(e, {
      commentCount: commentCounts[e.mtnId] || 0,
      avgRating: ratingStats[e.mtnId]?.avg || null,
      ratingCount: ratingStats[e.mtnId]?.count || 0,
      myRating: myRatings[e.mtnId] || null,
    }));

    return { data, totalCount };
  }

  async getMeetingNoteById(id: string, userId: string): Promise<MeetingNoteResponse> {
    const userDept = await this.getUserUnit(userId);

    const entity = await this.noteRepository.findOne({
      where: { mtnId: id },
      relations: this.fullRelations,
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.MEETING_NOTE_NOT_FOUND.message);
    }

    const canAccess =
      entity.usrId === userId ||
      entity.mtnVisibility === 'PUBLIC' ||
      (entity.mtnVisibility === 'UNIT' && entity.mtnUnit === userDept) ||
      (entity.mtnVisibility === 'ENTITY') ||
      (entity.mtnVisibility === 'CELL' && entity.mtnCellId && await this.cellAccessService.isUserInCell(userId, entity.mtnCellId));

    if (!canAccess) {
      throw new ForbiddenException(ERROR_CODE.MEETING_NOTE_ACCESS_DENIED.message);
    }

    const commentCount = await this.commentRepo.count({ where: { mtnId: id } });
    const ratingStats = await this.getRatingStats([id]);
    const myRatings = await this.getMyRatings([id], userId);

    return MeetingNoteMapper.toResponse(entity, {
      commentCount,
      avgRating: ratingStats[id]?.avg || null,
      ratingCount: ratingStats[id]?.count || 0,
      myRating: myRatings[id] || null,
    });
  }

  async createMeetingNote(dto: CreateMeetingNoteRequest, userId: string, entityId?: string): Promise<MeetingNoteResponse> {
    const meetingDate = dto.type === 'MEMO'
      ? new Date()
      : dto.meeting_date ? new Date(dto.meeting_date) : new Date();

    const entity = this.noteRepository.create({
      entId: entityId || null,
      usrId: userId,
      mtnType: dto.type || 'MEMO',
      mtnTitle: dto.title,
      mtnContent: dto.content,
      mtnMeetingDate: meetingDate,
      mtnVisibility: dto.visibility || 'PRIVATE',
      mtnUnit: dto.department || null,
      mtnCellId: dto.group_id || null,
      mtnAssigneeId: dto.assignee_id || null,
      mtnFolderId: dto.folder_id || null,
    });

    const saved = await this.noteRepository.save(entity);

    // Sync child relations
    if (dto.participant_ids?.length) await this.syncParticipants(saved.mtnId, dto.participant_ids);
    if (dto.project_ids?.length) await this.syncProjects(saved.mtnId, dto.project_ids);
    if (dto.issue_ids?.length) await this.syncIssues(saved.mtnId, dto.issue_ids);

    // Auto-create issue from note if requested
    if (dto.create_issue) {
      const createdIssue = await this.issueService.createIssue(
        {
          type: dto.create_issue_type || 'TASK',
          title: dto.title,
          description: dto.content,
          severity: dto.create_issue_severity || 'MINOR',
          project_id: dto.create_issue_project_id,
          source_meeting_note_title: dto.title,
        } as any,
        userId,
        entityId,
      );
      // Link the created issue to this note
      const existingIds = (dto.issue_ids || []);
      await this.syncIssues(saved.mtnId, [...existingIds, createdIssue.issueId]);
    }

    // Sync wiki links
    if (entityId && dto.content) {
      await this.noteLinkService.parseAndSaveLinks(saved.mtnId, dto.content, entityId).catch(() => {});
    }

    // Update FTS search vector
    this.updateSearchVector(saved.mtnId, saved.mtnTitle, saved.mtnContent).catch(() => {});

    this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
      module: 'meeting-notes',
      type: 'NOTE',
      refId: saved.mtnId,
      title: saved.mtnTitle,
      content: [saved.mtnTitle, saved.mtnContent].filter(Boolean).join(' '),
      ownerId: userId,
      entityId: entityId,
      visibility: saved.mtnVisibility,
      cellId: saved.mtnCellId,
    });

    // Emit assignee/participant notifications
    {
      const recipientSet = new Set<string>();
      if (dto.assignee_id && dto.assignee_id !== userId) {
        recipientSet.add(dto.assignee_id);
      }
      if (dto.participant_ids?.length) {
        dto.participant_ids.forEach((id) => {
          if (id !== userId) recipientSet.add(id);
        });
      }
      if (recipientSet.size > 0) {
        const sender = await this.userRepository.findOne({ where: { usrId: userId } });
        this.eventEmitter.emit(ASSIGNEE_EVENT, {
          type: NOTIFICATION_TYPE.NOTE_ASSIGNED,
          resourceType: NOTIFICATION_RESOURCE_TYPE.MEETING_NOTE,
          resourceId: saved.mtnId,
          resourceTitle: saved.mtnTitle,
          senderId: userId,
          senderName: sender?.usrName || 'Unknown',
          recipientIds: Array.from(recipientSet),
          entityId: entityId || '',
          role: ASSIGNEE_ROLE.PARTICIPANT,
        } as AssigneeAssignedEvent);
      }
    }

    const loaded = await this.noteRepository.findOne({
      where: { mtnId: saved.mtnId },
      relations: this.fullRelations,
    });
    return MeetingNoteMapper.toResponse(loaded!);
  }

  async updateMeetingNote(id: string, dto: UpdateMeetingNoteRequest, userId: string): Promise<MeetingNoteResponse> {
    const entity = await this.noteRepository.findOne({
      where: { mtnId: id },
      relations: this.fullRelations,
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.MEETING_NOTE_NOT_FOUND.message);
    }
    if (entity.usrId !== userId) {
      throw new ForbiddenException(ERROR_CODE.MEETING_NOTE_ACCESS_DENIED.message);
    }

    if (dto.type !== undefined) entity.mtnType = dto.type;
    if (dto.title !== undefined) entity.mtnTitle = dto.title;
    if (dto.content !== undefined) entity.mtnContent = dto.content;
    if (dto.meeting_date !== undefined) {
      if (entity.mtnType !== 'MEMO') {
        entity.mtnMeetingDate = new Date(dto.meeting_date);
      }
    }
    if (dto.visibility !== undefined) entity.mtnVisibility = dto.visibility;
    if (dto.department !== undefined) entity.mtnUnit = dto.department;
    if (dto.group_id !== undefined) entity.mtnCellId = dto.group_id || null;
    if (dto.assignee_id !== undefined) entity.mtnAssigneeId = dto.assignee_id || null;
    if (dto.folder_id !== undefined) entity.mtnFolderId = dto.folder_id || null;

    const saved = await this.noteRepository.save(entity);

    // Sync child relations if provided
    if (dto.participant_ids !== undefined) await this.syncParticipants(id, dto.participant_ids);
    if (dto.project_ids !== undefined) await this.syncProjects(id, dto.project_ids);
    if (dto.issue_ids !== undefined) await this.syncIssues(id, dto.issue_ids);

    // Auto-create issue from note if requested
    if (dto.create_issue) {
      const createdIssue = await this.issueService.createIssue(
        {
          type: dto.create_issue_type || 'TASK',
          title: saved.mtnTitle,
          description: saved.mtnContent,
          severity: dto.create_issue_severity || 'MINOR',
          project_id: dto.create_issue_project_id,
          source_meeting_note_title: saved.mtnTitle,
        } as any,
        userId,
        entity.entId!,
      );
      // Link the created issue to this note (merge with existing)
      const currentIssueLinks = await this.issueRepo.find({ where: { mtnId: id } });
      const currentIds = currentIssueLinks.map((l) => l.issId);
      if (!currentIds.includes(createdIssue.issueId)) {
        await this.syncIssues(id, [...currentIds, createdIssue.issueId]);
      }
    }

    await this.translationService.markStale('MEETING_NOTE', saved.mtnId);

    // Sync wiki links on content change
    if (dto.content !== undefined && entity.entId) {
      await this.noteLinkService.parseAndSaveLinks(saved.mtnId, saved.mtnContent, entity.entId).catch(() => {});
    }

    // Update FTS search vector on title/content change
    if (dto.title !== undefined || dto.content !== undefined) {
      this.updateSearchVector(saved.mtnId, saved.mtnTitle, saved.mtnContent).catch(() => {});
    }

    this.eventEmitter.emit(MODULE_DATA_EVENTS.UPDATED, {
      module: 'meeting-notes',
      type: 'NOTE',
      refId: saved.mtnId,
      title: saved.mtnTitle,
      content: [saved.mtnTitle, saved.mtnContent].filter(Boolean).join(' '),
      ownerId: userId,
      visibility: saved.mtnVisibility,
      cellId: saved.mtnCellId,
    });

    // Emit notifications for new assignee/participants
    {
      const recipientSet = new Set<string>();
      // Assignee changed?
      if (dto.assignee_id !== undefined && dto.assignee_id && dto.assignee_id !== userId
          && dto.assignee_id !== entity.mtnAssigneeId) {
        recipientSet.add(dto.assignee_id);
      }
      // New participants?
      if (dto.participant_ids !== undefined) {
        const existingIds = (entity.participants || []).map((p) => p.usrId);
        dto.participant_ids.forEach((id) => {
          if (id !== userId && !existingIds.includes(id)) recipientSet.add(id);
        });
      }
      if (recipientSet.size > 0) {
        const sender = await this.userRepository.findOne({ where: { usrId: userId } });
        this.eventEmitter.emit(ASSIGNEE_EVENT, {
          type: NOTIFICATION_TYPE.NOTE_ASSIGNED,
          resourceType: NOTIFICATION_RESOURCE_TYPE.MEETING_NOTE,
          resourceId: saved.mtnId,
          resourceTitle: saved.mtnTitle,
          senderId: userId,
          senderName: sender?.usrName || 'Unknown',
          recipientIds: Array.from(recipientSet),
          entityId: entity.entId || '',
          role: ASSIGNEE_ROLE.PARTICIPANT,
        } as AssigneeAssignedEvent);
      }
    }

    const loaded = await this.noteRepository.findOne({
      where: { mtnId: id },
      relations: this.fullRelations,
    });
    const commentCount = await this.commentRepo.count({ where: { mtnId: id } });
    const ratingStats = await this.getRatingStats([id]);
    const myRatings = await this.getMyRatings([id], userId);

    return MeetingNoteMapper.toResponse(loaded!, {
      commentCount,
      avgRating: ratingStats[id]?.avg || null,
      ratingCount: ratingStats[id]?.count || 0,
      myRating: myRatings[id] || null,
    });
  }

  async deleteMeetingNote(id: string, userId: string): Promise<void> {
    const entity = await this.noteRepository.findOne({ where: { mtnId: id } });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.MEETING_NOTE_NOT_FOUND.message);
    }
    if (entity.usrId !== userId) {
      throw new ForbiddenException(ERROR_CODE.MEETING_NOTE_ACCESS_DENIED.message);
    }

    await this.noteRepository.softRemove(entity);
  }

  // ─── Participants sync ───────────────────────────────────────
  private async syncParticipants(noteId: string, userIds: string[]): Promise<void> {
    await this.participantRepo.delete({ mtnId: noteId });
    if (userIds.length === 0) return;
    const entities = userIds.map((uid) =>
      this.participantRepo.create({ mtnId: noteId, usrId: uid }),
    );
    await this.participantRepo.save(entities);
  }

  // ─── Projects sync ──────────────────────────────────────────
  private async syncProjects(noteId: string, projectIds: string[]): Promise<void> {
    await this.projectRepo.delete({ mtnId: noteId });
    if (projectIds.length === 0) return;
    const entities = projectIds.map((pid) =>
      this.projectRepo.create({ mtnId: noteId, pjtId: pid }),
    );
    await this.projectRepo.save(entities);
  }

  // ─── Issues sync ────────────────────────────────────────────
  private async syncIssues(noteId: string, issueIds: string[]): Promise<void> {
    await this.issueRepo.delete({ mtnId: noteId });
    if (issueIds.length === 0) return;
    const entities = issueIds.map((iid) =>
      this.issueRepo.create({ mtnId: noteId, issId: iid }),
    );
    await this.issueRepo.save(entities);
  }

  // ─── Comments ────────────────────────────────────────────────
  async getComments(noteId: string): Promise<MeetingNoteCommentResponse[]> {
    const comments = await this.commentRepo.find({
      where: { mtnId: noteId, mncParentId: IsNull() },
      relations: ['author', 'replies', 'replies.author'],
      order: { mncCreatedAt: 'ASC' },
    });
    return comments.map((c) => ({
      ...MeetingNoteMapper.toCommentResponse(c),
      replies: (c.replies || [])
        .sort((a, b) => a.mncCreatedAt.getTime() - b.mncCreatedAt.getTime())
        .map(MeetingNoteMapper.toCommentResponse),
    }));
  }

  async addComment(noteId: string, userId: string, content: string, parentId?: string): Promise<MeetingNoteCommentResponse> {
    const note = await this.noteRepository.findOne({ where: { mtnId: noteId } });
    if (!note) throw new NotFoundException(ERROR_CODE.MEETING_NOTE_NOT_FOUND.message);

    // Reply validation: only 1 depth
    if (parentId) {
      const parentComment = await this.commentRepo.findOne({ where: { mncId: parentId } });
      if (!parentComment) throw new NotFoundException('Parent comment not found');
      if (parentComment.mncParentId) {
        throw new BadRequestException('Nested replies are not allowed');
      }
    }

    const comment = this.commentRepo.create({
      mtnId: noteId,
      mncAuthorId: userId,
      mncContent: content,
      mncParentId: parentId || null,
    });
    const saved = await this.commentRepo.save(comment);
    const loaded = await this.commentRepo.findOne({
      where: { mncId: saved.mncId },
      relations: ['author'],
    });

    this.eventEmitter.emit('meeting-note.comment.created', {
      noteId,
      commentId: saved.mncId,
      authorId: userId,
      noteOwnerId: note.usrId,
    });

    // 멘션 감지 및 알림 발행
    const entityUsers = await this.userRepository.find({
      where: { usrCompanyId: note.entId as any },
      select: ['usrId', 'usrName'],
    });
    const mentionedIds = extractMentionedUserIds(content, entityUsers, userId);
    if (mentionedIds.length > 0) {
      this.eventEmitter.emit(MENTION_EVENT, {
        resourceType: NOTIFICATION_RESOURCE_TYPE.MEETING_NOTE,
        resourceId: noteId,
        resourceTitle: note.mtnTitle,
        commentId: saved.mncId,
        senderId: userId,
        senderName: loaded?.author?.usrName || '',
        recipientIds: mentionedIds,
        entityId: note.entId,
      });
    }

    return MeetingNoteMapper.toCommentResponse(loaded!);
  }

  async deleteComment(noteId: string, commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { mncId: commentId, mtnId: noteId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.mncAuthorId !== userId) {
      throw new ForbiddenException('Only the comment author can delete');
    }
    await this.commentRepo.softRemove(comment);
  }

  // ─── Ratings ─────────────────────────────────────────────────
  async upsertRating(noteId: string, userId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

    const note = await this.noteRepository.findOne({ where: { mtnId: noteId } });
    if (!note) throw new NotFoundException(ERROR_CODE.MEETING_NOTE_NOT_FOUND.message);

    // 자기 평가 방지: 작성자는 자신의 노트에 별점을 줄 수 없음
    if (note.usrId === userId) {
      throw new ForbiddenException('Cannot rate your own content');
    }

    const existing = await this.ratingRepo.findOne({
      where: { mtnId: noteId, usrId: userId },
    });

    if (existing) {
      existing.mnrRating = rating;
      await this.ratingRepo.save(existing);
    } else {
      const entity = this.ratingRepo.create({
        mtnId: noteId,
        usrId: userId,
        mnrRating: rating,
      });
      await this.ratingRepo.save(entity);
    }
  }

  async deleteRating(noteId: string, userId: string): Promise<void> {
    const existing = await this.ratingRepo.findOne({
      where: { mtnId: noteId, usrId: userId },
    });
    if (existing) {
      await this.ratingRepo.remove(existing);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────
  private async getCommentCounts(noteIds: string[]): Promise<Record<string, number>> {
    if (noteIds.length === 0) return {};
    const rows = await this.commentRepo
      .createQueryBuilder('c')
      .select('c.mtn_id', 'noteId')
      .addSelect('COUNT(*)::int', 'count')
      .where('c.mtn_id IN (:...noteIds)', { noteIds })
      .andWhere('c.mnc_deleted_at IS NULL')
      .groupBy('c.mtn_id')
      .getRawMany();
    const map: Record<string, number> = {};
    rows.forEach((r) => { map[r.noteId] = r.count; });
    return map;
  }

  private async getRatingStats(noteIds: string[]): Promise<Record<string, { avg: number; count: number }>> {
    if (noteIds.length === 0) return {};
    const rows = await this.ratingRepo
      .createQueryBuilder('r')
      .select('r.mtn_id', 'noteId')
      .addSelect('AVG(r.mnr_rating)::float', 'avg')
      .addSelect('COUNT(*)::int', 'count')
      .where('r.mtn_id IN (:...noteIds)', { noteIds })
      .groupBy('r.mtn_id')
      .getRawMany();
    const map: Record<string, { avg: number; count: number }> = {};
    rows.forEach((r) => {
      map[r.noteId] = { avg: Math.round(r.avg * 10) / 10, count: r.count };
    });
    return map;
  }

  private async getMyRatings(noteIds: string[], userId: string): Promise<Record<string, number>> {
    if (noteIds.length === 0) return {};
    const rows = await this.ratingRepo
      .createQueryBuilder('r')
      .select('r.mtn_id', 'noteId')
      .addSelect('r.mnr_rating', 'rating')
      .where('r.mtn_id IN (:...noteIds)', { noteIds })
      .andWhere('r.usr_id = :userId', { userId })
      .getRawMany();
    const map: Record<string, number> = {};
    rows.forEach((r) => { map[r.noteId] = r.rating; });
    return map;
  }

  // ─── Folders ─────────────────────────────────────────────────
  async getFolders(userId: string, entityId?: string): Promise<any[]> {
    const qb = this.folderRepo
      .createQueryBuilder('folder')
      .where('folder.usrId = :userId', { userId });

    if (entityId) {
      qb.andWhere('folder.entId = :entityId', { entityId });
    }

    qb.orderBy('folder.mnfSortOrder', 'ASC').addOrderBy('folder.mnfCreatedAt', 'ASC');

    const folders = await qb.getMany();

    // Batch count notes per folder
    const folderIds = folders.map((f) => f.mnfId);
    let noteCounts: Record<string, number> = {};
    if (folderIds.length > 0) {
      const rows = await this.noteRepository
        .createQueryBuilder('n')
        .select('n.mtn_folder_id', 'folderId')
        .addSelect('COUNT(*)::int', 'count')
        .where('n.mtn_folder_id IN (:...folderIds)', { folderIds })
        .andWhere('n.mtn_deleted_at IS NULL')
        .groupBy('n.mtn_folder_id')
        .getRawMany();
      rows.forEach((r) => { noteCounts[r.folderId] = r.count; });
    }

    return folders.map((f) => ({
      folderId: f.mnfId,
      name: f.mnfName,
      color: f.mnfColor,
      sortOrder: f.mnfSortOrder,
      noteCount: noteCounts[f.mnfId] || 0,
      createdAt: f.mnfCreatedAt.toISOString(),
    }));
  }

  async createFolder(dto: CreateFolderRequest, userId: string, entityId?: string) {
    const entity = this.folderRepo.create({
      entId: entityId || null,
      usrId: userId,
      mnfName: dto.name,
      mnfColor: dto.color || null,
      mnfSortOrder: dto.sort_order ?? 0,
    });
    const saved = await this.folderRepo.save(entity);
    return {
      folderId: saved.mnfId,
      name: saved.mnfName,
      color: saved.mnfColor,
      sortOrder: saved.mnfSortOrder,
      noteCount: 0,
      createdAt: saved.mnfCreatedAt.toISOString(),
    };
  }

  async updateFolder(folderId: string, dto: UpdateFolderRequest, userId: string) {
    const entity = await this.folderRepo.findOne({ where: { mnfId: folderId } });
    if (!entity) throw new NotFoundException('Folder not found');
    if (entity.usrId !== userId) throw new ForbiddenException('Only the folder owner can edit');

    if (dto.name !== undefined) entity.mnfName = dto.name;
    if (dto.color !== undefined) entity.mnfColor = dto.color || null;
    if (dto.sort_order !== undefined) entity.mnfSortOrder = dto.sort_order;

    const saved = await this.folderRepo.save(entity);
    return {
      folderId: saved.mnfId,
      name: saved.mnfName,
      color: saved.mnfColor,
      sortOrder: saved.mnfSortOrder,
      createdAt: saved.mnfCreatedAt.toISOString(),
    };
  }

  async deleteFolder(folderId: string, userId: string): Promise<void> {
    const entity = await this.folderRepo.findOne({ where: { mnfId: folderId } });
    if (!entity) throw new NotFoundException('Folder not found');
    if (entity.usrId !== userId) throw new ForbiddenException('Only the folder owner can delete');

    // Move notes in this folder to uncategorized
    await this.noteRepository
      .createQueryBuilder()
      .update(MeetingNoteEntity)
      .set({ mtnFolderId: null })
      .where('mtnFolderId = :folderId', { folderId })
      .execute();

    await this.folderRepo.softRemove(entity);
  }
}
