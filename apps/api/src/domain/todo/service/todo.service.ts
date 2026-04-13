import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository, DeepPartial, In } from 'typeorm';
import { TodoEntity } from '../entity/todo.entity';
import { TodoStatusLogEntity } from '../entity/todo-status-log.entity';
import { TodoCommentEntity } from '../entity/todo-comment.entity';
import { TodoParticipantEntity } from '../entity/todo-participant.entity';
import { TodoRatingEntity } from '../../activity-index/entity/todo-rating.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { UserCellEntity } from '../../members/entity/user-cell.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { CreateTodoRequest } from '../dto/request/create-todo.request';
import { UpdateTodoRequest } from '../dto/request/update-todo.request';
import { TodoMapper } from '../mapper/todo.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { TodoResponse, TodoStatusLogResponse, TodoCommentResponse } from '@amb/types';
import { TranslationService } from '../../translation/service/translation.service';
import { computeTodoStatus, computedToLegacyStatus } from '../utils/compute-todo-status.util';
import {
  ASSIGNEE_EVENT,
  NOTIFICATION_TYPE,
  NOTIFICATION_RESOURCE_TYPE,
  ASSIGNEE_ROLE,
  AssigneeAssignedEvent,
  MENTION_EVENT,
} from '../../notification/constant/notification-type.constant';
import { extractMentionedUserIds } from '../../notification/util/mention.util';

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);

  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
    @InjectRepository(TodoStatusLogEntity)
    private readonly statusLogRepository: Repository<TodoStatusLogEntity>,
    @InjectRepository(TodoCommentEntity)
    private readonly commentRepository: Repository<TodoCommentEntity>,
    @InjectRepository(TodoParticipantEntity)
    private readonly participantRepository: Repository<TodoParticipantEntity>,
    @InjectRepository(TodoRatingEntity)
    private readonly todoRatingRepository: Repository<TodoRatingEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userGroupRepository: Repository<UserCellEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly userUnitRoleRepository: Repository<UserUnitRoleEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly translationService: TranslationService,
  ) {}

  async getTodos(
    userId: string,
    filters?: { status?: string; date_from?: string; date_to?: string },
    entityId?: string,
  ): Promise<TodoResponse[]> {
    const qb = this.todoRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.issue', 'issue')
      .leftJoinAndSelect('todo.project', 'project')
      .leftJoinAndSelect('todo.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .where('todo.usrId = :userId', { userId });

    if (entityId) {
      qb.andWhere('todo.entId = :entityId', { entityId });
    }

    if (filters?.status) {
      qb.andWhere('todo.tdoStatus = :status', { status: filters.status });
    }
    if (filters?.date_from) {
      qb.andWhere('todo.tdoDueDate >= :dateFrom', { dateFrom: filters.date_from });
    }
    if (filters?.date_to) {
      qb.andWhere('todo.tdoDueDate <= :dateTo', { dateTo: filters.date_to });
    }

    qb.orderBy('todo.tdoDueDate', 'ASC').addOrderBy('todo.tdoCreatedAt', 'DESC');

    const entities = await qb.getMany();

    // commentCount 조회
    const todoIds = entities.map((e) => e.tdoId);
    const commentCounts = await this.getCommentCounts(todoIds);
    const ratingStats = await this.getRatingStats(todoIds);
    const myRatings = await this.getMyRatings(todoIds, userId);

    return entities.map((e) => TodoMapper.toResponse(e, commentCounts[e.tdoId] || 0, {
      avgRating: ratingStats[e.tdoId]?.avg || null,
      ratingCount: ratingStats[e.tdoId]?.count || 0,
      myRating: myRatings[e.tdoId] || null,
    }));
  }

  async getTodoById(todoId: string, userId: string): Promise<TodoResponse> {
    const entity = await this.todoRepository.findOne({
      where: { tdoId: todoId },
      relations: ['user', 'issue', 'project', 'participants', 'participants.user'],
    });
    if (!entity) throw new NotFoundException(ERROR_CODE.TODO_NOT_FOUND);

    // IDOR 방어: PRIVATE Todo는 소유자 또는 참여자만 조회 가능
    if (entity.tdoVisibility === 'PRIVATE') {
      const isOwner = entity.usrId === userId;
      const isParticipant = entity.participants?.some((p) => p.usrId === userId);
      if (!isOwner && !isParticipant) {
        throw new ForbiddenException('Access denied to this todo');
      }
    }

    const commentCounts = await this.getCommentCounts([todoId]);
    const ratingStats = await this.getRatingStats([todoId]);
    const myRatings = await this.getMyRatings([todoId], userId);
    return TodoMapper.toResponse(entity, commentCounts[todoId] || 0, {
      avgRating: ratingStats[todoId]?.avg || null,
      ratingCount: ratingStats[todoId]?.count || 0,
      myRating: myRatings[todoId] || null,
    });
  }

  async createTodo(dto: CreateTodoRequest, userId: string, entityId?: string): Promise<TodoResponse> {
    const now = new Date();
    const startDate = dto.start_date ? new Date(dto.start_date) : null;
    const dueDate = dto.due_date ? new Date(dto.due_date) : null;

    // 날짜 기반 computed status 계산 → 레거시 tdo_status 동기화
    const computed = computeTodoStatus({ completedAt: null, startDate, dueDate });
    const legacyStatus = computedToLegacyStatus(computed);

    const entity = this.todoRepository.create({
      entId: entityId || null,
      usrId: userId,
      tdoTitle: dto.title,
      tdoDescription: dto.description || undefined,
      tdoStatus: legacyStatus,
      tdoStartDate: startDate,
      tdoDueDate: dueDate,
      tdoTags: dto.tags || undefined,
      tdoStartedAt: legacyStatus === 'IN_PROGRESS' ? now : undefined,
      issId: dto.issue_id || null,
      pjtId: dto.project_id || null,
      tdoVisibility: dto.visibility || 'PRIVATE',
      tdoCellId: dto.group_id || null,
      tdoRecurrenceType: dto.recurrence_type || null,
      tdoRecurrenceDay: dto.recurrence_day ?? null,
    } as Partial<TodoEntity>);

    const saved = await this.todoRepository.save(entity);

    // Save participants
    if (dto.participant_ids?.length) {
      await this.syncParticipants(saved.tdoId, dto.participant_ids);
    }

    // 반복 할일이면 다음 건 자동 생성
    if (saved.tdoRecurrenceType) {
      await this.createNextRecurrence(saved, userId);
    }

    // Reload with participants
    const reloaded = await this.todoRepository.findOne({
      where: { tdoId: saved.tdoId },
      relations: ['issue', 'project', 'participants', 'participants.user'],
    });

    this.eventEmitter.emit('module.data.created', {
      module: 'todo',
      type: 'TODO',
      refId: saved.tdoId,
      title: saved.tdoTitle,
      content: [saved.tdoTitle, saved.tdoDescription, saved.tdoTags].filter(Boolean).join(' '),
      ownerId: userId,
      visibility: saved.tdoVisibility,
      cellId: saved.tdoCellId,
    });

    // Emit assignee notification for new participants
    if (dto.participant_ids?.length) {
      const recipientIds = dto.participant_ids.filter((id) => id !== userId);
      if (recipientIds.length > 0) {
        const sender = await this.userRepository.findOne({ where: { usrId: userId } });
        this.eventEmitter.emit(ASSIGNEE_EVENT, {
          type: NOTIFICATION_TYPE.TODO_ASSIGNED,
          resourceType: NOTIFICATION_RESOURCE_TYPE.TODO,
          resourceId: saved.tdoId,
          resourceTitle: saved.tdoTitle,
          senderId: userId,
          senderName: sender?.usrName || 'Unknown',
          recipientIds,
          entityId: entityId || '',
          role: ASSIGNEE_ROLE.PARTICIPANT,
        } as AssigneeAssignedEvent);
      }
    }

    return TodoMapper.toResponse(reloaded || saved);
  }

  async updateTodo(id: string, dto: UpdateTodoRequest, userId: string, userRole?: string): Promise<TodoResponse> {
    const entity = await this.todoRepository.findOne({ where: { tdoId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.TODO_NOT_FOUND.message);
    }
    if (entity.usrId !== userId && userRole !== 'MASTER') {
      throw new ForbiddenException(ERROR_CODE.TODO_ACCESS_DENIED.message);
    }

    // Status change detection and logging
    // 레거시 status 직접 변경: 완료/되돌리기 시에만 유효
    if (dto.status !== undefined && dto.status !== entity.tdoStatus) {
      const oldStatus = entity.tdoStatus;
      const newStatus = dto.status;
      const now = new Date();

      // Save status change log
      const log = this.statusLogRepository.create({
        tdoId: id,
        tslFromStatus: oldStatus,
        tslToStatus: newStatus,
        tslChangedBy: userId,
        tslChangedAt: now,
      });
      await this.statusLogRepository.save(log);

      // Track completion timestamp
      if (newStatus === 'COMPLETED') {
        entity.tdoCompletedAt = now;
        // 반복 할일 완료 시 다음 건 자동 생성
        if (entity.tdoRecurrenceType) {
          await this.createNextRecurrence(entity, userId);
        }
      } else if (oldStatus === 'COMPLETED') {
        entity.tdoCompletedAt = null;
      }

      // Track start timestamp (first time only)
      if (newStatus === 'IN_PROGRESS' && !entity.tdoStartedAt) {
        entity.tdoStartedAt = now;
      }

      entity.tdoStatus = newStatus;
      this.logger.log(`Todo ${id} status: ${oldStatus} → ${newStatus}`);
    }

    if (dto.title !== undefined) entity.tdoTitle = dto.title;
    if (dto.description !== undefined) entity.tdoDescription = dto.description;

    // start_date 변경
    if (dto.start_date !== undefined) {
      entity.tdoStartDate = dto.start_date ? new Date(dto.start_date) : null;
    }

    // Due date change detection and logging
    if (dto.due_date !== undefined) {
      const oldDueDate = entity.tdoDueDate
        ? (entity.tdoDueDate instanceof Date ? entity.tdoDueDate.toISOString().split('T')[0] : String(entity.tdoDueDate))
        : null;
      const newDueDate = dto.due_date;
      if (oldDueDate !== newDueDate) {
        const log = this.statusLogRepository.create({
          tdoId: id,
          tslFromStatus: `DUE:${oldDueDate || 'none'}`,
          tslToStatus: `DUE:${newDueDate}`,
          tslChangedBy: userId,
          tslChangedAt: new Date(),
          tslNote: dto.due_date_change_note || undefined,
        } as DeepPartial<any>);
        await this.statusLogRepository.save(log);
        this.logger.log(`Todo ${id} due_date: ${oldDueDate} → ${newDueDate}`);
      }
      entity.tdoDueDate = dto.due_date ? new Date(dto.due_date) : null;
    }
    if (dto.tags !== undefined) entity.tdoTags = dto.tags;
    if (dto.issue_id !== undefined) entity.issId = dto.issue_id || undefined as any;
    if (dto.project_id !== undefined) entity.pjtId = dto.project_id || undefined as any;
    if (dto.visibility !== undefined) entity.tdoVisibility = dto.visibility;
    if (dto.group_id !== undefined) entity.tdoCellId = dto.group_id || undefined as any;
    if (dto.recurrence_type !== undefined) entity.tdoRecurrenceType = dto.recurrence_type || undefined as any;
    if (dto.recurrence_day !== undefined) entity.tdoRecurrenceDay = dto.recurrence_day ?? undefined as any;

    // 날짜 변경 시 레거시 tdo_status 재계산 (직접 status 변경이 없었을 때만)
    if (dto.status === undefined && (dto.start_date !== undefined || dto.due_date !== undefined)) {
      const computed = computeTodoStatus({
        completedAt: entity.tdoCompletedAt,
        startDate: entity.tdoStartDate,
        dueDate: entity.tdoDueDate,
      });
      entity.tdoStatus = computedToLegacyStatus(computed);
    }

    const saved = await this.todoRepository.save(entity);

    // Get existing participants before sync (for notification filtering)
    const existingParticipants = await this.participantRepository.find({
      where: { tdoId: saved.tdoId },
    });
    const existingParticipantIds = existingParticipants.map((p) => p.usrId);

    // Sync participants
    if (dto.participant_ids !== undefined) {
      await this.syncParticipants(saved.tdoId, dto.participant_ids);

      // Emit notification only for newly added participants
      const newParticipantIds = (dto.participant_ids || [])
        .filter((id) => !existingParticipantIds.includes(id) && id !== userId);
      if (newParticipantIds.length > 0) {
        const sender = await this.userRepository.findOne({ where: { usrId: userId } });
        this.eventEmitter.emit(ASSIGNEE_EVENT, {
          type: NOTIFICATION_TYPE.TODO_ASSIGNED,
          resourceType: NOTIFICATION_RESOURCE_TYPE.TODO,
          resourceId: saved.tdoId,
          resourceTitle: saved.tdoTitle,
          senderId: userId,
          senderName: sender?.usrName || 'Unknown',
          recipientIds: newParticipantIds,
          entityId: entity.entId || '',
          role: ASSIGNEE_ROLE.PARTICIPANT,
        } as AssigneeAssignedEvent);
      }
    }

    // Mark existing translations as stale when source content changes
    await this.translationService.markStale('TODO', saved.tdoId);

    // Reload with participants
    const reloaded = await this.todoRepository.findOne({
      where: { tdoId: saved.tdoId },
      relations: ['issue', 'project', 'participants', 'participants.user'],
    });

    this.eventEmitter.emit('module.data.updated', {
      module: 'todo',
      type: 'TODO',
      refId: saved.tdoId,
      title: saved.tdoTitle,
      content: [saved.tdoTitle, saved.tdoDescription, saved.tdoTags].filter(Boolean).join(' '),
      ownerId: userId,
      visibility: saved.tdoVisibility,
      cellId: saved.tdoCellId,
    });

    return TodoMapper.toResponse(reloaded || saved);
  }

  async getStatusLogs(id: string, userId: string): Promise<TodoStatusLogResponse[]> {
    const entity = await this.todoRepository.findOne({ where: { tdoId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.TODO_NOT_FOUND.message);
    }

    const logs = await this.statusLogRepository.find({
      where: { tdoId: id },
      order: { tslChangedAt: 'DESC' },
    });
    return logs.map(TodoMapper.toStatusLogResponse);
  }

  async deleteTodo(id: string, userId: string, userRole?: string): Promise<void> {
    const entity = await this.todoRepository.findOne({ where: { tdoId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.TODO_NOT_FOUND.message);
    }
    if (entity.usrId !== userId && userRole !== 'MASTER') {
      throw new ForbiddenException(ERROR_CODE.TODO_ACCESS_DENIED.message);
    }

    await this.todoRepository.softRemove(entity);
  }

  async completeTodo(id: string, userId: string, userRole?: string): Promise<TodoResponse> {
    const entity = await this.todoRepository.findOne({
      where: { tdoId: id },
      relations: ['issue', 'project', 'participants', 'participants.user'],
    });
    if (!entity) throw new NotFoundException(ERROR_CODE.TODO_NOT_FOUND.message);
    if (entity.usrId !== userId && userRole !== 'MASTER') throw new ForbiddenException(ERROR_CODE.TODO_ACCESS_DENIED.message);

    if (entity.tdoCompletedAt) return TodoMapper.toResponse(entity);

    const now = new Date();
    const oldStatus = entity.tdoStatus;

    entity.tdoCompletedAt = now;
    entity.tdoStatus = 'COMPLETED';

    // 상태 변경 로그
    const log = this.statusLogRepository.create({
      tdoId: id,
      tslFromStatus: oldStatus,
      tslToStatus: 'COMPLETED',
      tslChangedBy: userId,
      tslChangedAt: now,
    });
    await this.statusLogRepository.save(log);

    // 반복 할일 완료 시 다음 건 자동 생성
    if (entity.tdoRecurrenceType) {
      await this.createNextRecurrence(entity, userId);
    }

    const saved = await this.todoRepository.save(entity);
    this.logger.log(`Todo ${id} completed`);
    return TodoMapper.toResponse(saved);
  }

  async reopenTodo(id: string, userId: string, userRole?: string): Promise<TodoResponse> {
    const entity = await this.todoRepository.findOne({
      where: { tdoId: id },
      relations: ['issue', 'project', 'participants', 'participants.user'],
    });
    if (!entity) throw new NotFoundException(ERROR_CODE.TODO_NOT_FOUND.message);
    if (entity.usrId !== userId && userRole !== 'MASTER') throw new ForbiddenException(ERROR_CODE.TODO_ACCESS_DENIED.message);

    if (!entity.tdoCompletedAt) return TodoMapper.toResponse(entity);

    const now = new Date();
    const oldStatus = entity.tdoStatus;

    entity.tdoCompletedAt = null;
    // computed status 기반으로 레거시 status 재계산
    const computed = computeTodoStatus({
      completedAt: null,
      startDate: entity.tdoStartDate,
      dueDate: entity.tdoDueDate,
    });
    entity.tdoStatus = computedToLegacyStatus(computed);

    const log = this.statusLogRepository.create({
      tdoId: id,
      tslFromStatus: oldStatus,
      tslToStatus: entity.tdoStatus,
      tslChangedBy: userId,
      tslChangedAt: now,
    });
    await this.statusLogRepository.save(log);

    const saved = await this.todoRepository.save(entity);
    this.logger.log(`Todo ${id} reopened → ${entity.tdoStatus}`);
    return TodoMapper.toResponse(saved);
  }

  // ──────── Unit Todos ────────

  async getUnitTodos(
    userId: string,
    filters?: { status?: string; date_from?: string; date_to?: string; search?: string },
    entityId?: string,
  ): Promise<TodoResponse[]> {
    // 1. 사용자가 속한 Unit ID 목록
    const myUnits = await this.userUnitRoleRepository.find({
      where: { usrId: userId },
      select: ['untId'],
    });

    if (myUnits.length === 0) {
      return [];
    }

    const unitIds = myUnits.map((u) => u.untId);

    // 2. 해당 Unit 전체 멤버 ID 수집
    const unitMembers = await this.userUnitRoleRepository.find({
      where: { untId: In(unitIds) },
      select: ['usrId'],
    });

    const userIds = [...new Set(unitMembers.map((m) => m.usrId))];

    if (userIds.length === 0) {
      return [];
    }

    // 3. 해당 멤버들의 할일 조회
    const qb = this.todoRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.user', 'user')
      .leftJoinAndSelect('todo.issue', 'issue')
      .leftJoinAndSelect('todo.project', 'project')
      .leftJoinAndSelect('todo.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .where('todo.usrId IN (:...userIds)', { userIds });

    if (entityId) {
      qb.andWhere('todo.entId = :entityId', { entityId });
    }

    if (filters?.status) {
      qb.andWhere('todo.tdoStatus = :status', { status: filters.status });
    }
    if (filters?.date_from) {
      qb.andWhere('todo.tdoDueDate >= :dateFrom', { dateFrom: filters.date_from });
    }
    if (filters?.date_to) {
      qb.andWhere('todo.tdoDueDate <= :dateTo', { dateTo: filters.date_to });
    }
    if (filters?.search) {
      qb.andWhere(
        '(user.usrName ILIKE :search OR todo.tdoTitle ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('user.usrName', 'ASC')
      .addOrderBy('todo.tdoDueDate', 'ASC')
      .addOrderBy('todo.tdoCreatedAt', 'DESC');

    const entities = await qb.getMany();

    const todoIds = entities.map((e) => e.tdoId);
    const commentCounts = await this.getCommentCounts(todoIds);

    return entities.map((e) => TodoMapper.toResponse(e, commentCounts[e.tdoId] || 0));
  }

  // ──────── Group Todos ────────

  async getGroupTodos(
    userId: string,
    filters?: { status?: string; date_from?: string; date_to?: string; search?: string },
    entityId?: string,
  ): Promise<TodoResponse[]> {
    // 1. 사용자가 속한 그룹 ID 목록
    const myGroups = await this.userGroupRepository.find({
      where: { usrId: userId },
      select: ['celId'],
    });

    if (myGroups.length === 0) {
      return [];
    }

    const groupIds = myGroups.map((g) => g.celId);

    // 2. 해당 셀 전체 멤버 ID 수집
    const groupMembers = await this.userGroupRepository.find({
      where: { celId: In(groupIds) },
      select: ['usrId'],
    });

    const userIds = [...new Set(groupMembers.map((m) => m.usrId))];

    if (userIds.length === 0) {
      return [];
    }

    // 3. 해당 멤버들의 할일 조회
    const qb = this.todoRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.user', 'user')
      .leftJoinAndSelect('todo.issue', 'issue')
      .leftJoinAndSelect('todo.project', 'project')
      .leftJoinAndSelect('todo.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .where('todo.usrId IN (:...userIds)', { userIds });

    if (entityId) {
      qb.andWhere('todo.entId = :entityId', { entityId });
    }

    if (filters?.status) {
      qb.andWhere('todo.tdoStatus = :status', { status: filters.status });
    }
    if (filters?.date_from) {
      qb.andWhere('todo.tdoDueDate >= :dateFrom', { dateFrom: filters.date_from });
    }
    if (filters?.date_to) {
      qb.andWhere('todo.tdoDueDate <= :dateTo', { dateTo: filters.date_to });
    }
    if (filters?.search) {
      qb.andWhere(
        '(user.usrName ILIKE :search OR todo.tdoTitle ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('user.usrName', 'ASC')
      .addOrderBy('todo.tdoDueDate', 'ASC')
      .addOrderBy('todo.tdoCreatedAt', 'DESC');

    const entities = await qb.getMany();

    const todoIds = entities.map((e) => e.tdoId);
    const commentCounts = await this.getCommentCounts(todoIds);

    return entities.map((e) => TodoMapper.toResponse(e, commentCounts[e.tdoId] || 0));
  }

  // ──────── Company Todos ────────

  async getCompanyTodos(
    userId: string,
    filters?: { status?: string; date_from?: string; date_to?: string; search?: string },
    entityId?: string,
  ): Promise<TodoResponse[]> {
    if (!entityId) {
      return [];
    }

    const qb = this.todoRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.user', 'user')
      .leftJoinAndSelect('todo.issue', 'issue')
      .leftJoinAndSelect('todo.project', 'project')
      .leftJoinAndSelect('todo.participants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .where('todo.entId = :entityId', { entityId });

    if (filters?.status) {
      qb.andWhere('todo.tdoStatus = :status', { status: filters.status });
    }
    if (filters?.date_from) {
      qb.andWhere('todo.tdoDueDate >= :dateFrom', { dateFrom: filters.date_from });
    }
    if (filters?.date_to) {
      qb.andWhere('todo.tdoDueDate <= :dateTo', { dateTo: filters.date_to });
    }
    if (filters?.search) {
      qb.andWhere(
        '(user.usrName ILIKE :search OR todo.tdoTitle ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('user.usrName', 'ASC')
      .addOrderBy('todo.tdoDueDate', 'ASC')
      .addOrderBy('todo.tdoCreatedAt', 'DESC');

    const entities = await qb.getMany();

    const todoIds = entities.map((e) => e.tdoId);
    const commentCounts = await this.getCommentCounts(todoIds);

    return entities.map((e) => TodoMapper.toResponse(e, commentCounts[e.tdoId] || 0));
  }

  // ──────── Todo Comments ────────

  async getTodoComments(todoId: string, userId: string): Promise<TodoCommentResponse[]> {
    await this.checkTodoAccess(todoId);

    const comments = await this.commentRepository.find({
      where: { tdoId: todoId },
      relations: ['author'],
      order: { tcmCreatedAt: 'ASC' },
    });

    return comments.map(TodoMapper.toCommentResponse);
  }

  async addTodoComment(todoId: string, content: string, userId: string): Promise<TodoCommentResponse> {
    const todo = await this.checkTodoAccess(todoId);

    // 본인 할일에는 코멘트 불가
    if (todo.usrId === userId) {
      throw new ForbiddenException(ERROR_CODE.TODO_CANNOT_COMMENT_OWN.message);
    }

    const comment = this.commentRepository.create({
      tdoId: todoId,
      tcmAuthorId: userId,
      tcmContent: content,
    });

    const saved = await this.commentRepository.save(comment);

    // author 관계 로드
    const withAuthor = await this.commentRepository.findOne({
      where: { tcmId: saved.tcmId },
      relations: ['author'],
    });

    // Emit comment event for notifications
    this.eventEmitter.emit('todo.comment.created', {
      todoId,
      todoTitle: todo.tdoTitle,
      todoOwnerId: todo.usrId,
      commentId: saved.tcmId,
      authorId: userId,
      authorName: withAuthor?.author?.usrName || '',
      content,
    });

    // 멘션 감지 및 알림 발행
    const entityUsers = await this.userRepository.find({
      where: { usrCompanyId: todo.entId! },
      select: ['usrId', 'usrName'],
    });
    const mentionedIds = extractMentionedUserIds(content, entityUsers, userId);
    if (mentionedIds.length > 0) {
      this.eventEmitter.emit(MENTION_EVENT, {
        resourceType: NOTIFICATION_RESOURCE_TYPE.TODO,
        resourceId: todoId,
        resourceTitle: todo.tdoTitle,
        commentId: saved.tcmId,
        senderId: userId,
        senderName: withAuthor?.author?.usrName || '',
        recipientIds: mentionedIds,
        entityId: todo.entId,
      });
    }

    return TodoMapper.toCommentResponse(withAuthor!);
  }

  async deleteTodoComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { tcmId: commentId } });
    if (!comment) {
      throw new NotFoundException(ERROR_CODE.TODO_COMMENT_NOT_FOUND.message);
    }
    // 본인 작성분만 삭제 가능
    if (comment.tcmAuthorId !== userId) {
      throw new ForbiddenException(ERROR_CODE.TODO_ACCESS_DENIED.message);
    }

    await this.commentRepository.softRemove(comment);
  }

  // ──────── Helpers ────────

  private async checkTodoAccess(todoId: string): Promise<TodoEntity> {
    const todo = await this.todoRepository.findOne({ where: { tdoId: todoId } });
    if (!todo) {
      throw new NotFoundException(ERROR_CODE.TODO_NOT_FOUND.message);
    }
    return todo;
  }

  private async getCommentCounts(todoIds: string[]): Promise<Record<string, number>> {
    if (todoIds.length === 0) return {};

    const counts = await this.commentRepository
      .createQueryBuilder('c')
      .select('c.tdo_id', 'tdoId')
      .addSelect('COUNT(*)', 'count')
      .where('c.tdo_id IN (:...todoIds)', { todoIds })
      .andWhere('c.tcm_deleted_at IS NULL')
      .groupBy('c.tdo_id')
      .getRawMany();

    const map: Record<string, number> = {};
    for (const row of counts) {
      map[row.tdoId] = parseInt(row.count, 10);
    }
    return map;
  }

  private async getRatingStats(todoIds: string[]): Promise<Record<string, { avg: number; count: number }>> {
    if (todoIds.length === 0) return {};

    const rows = await this.todoRatingRepository
      .createQueryBuilder('r')
      .select('r.tdo_id', 'tdoId')
      .addSelect('AVG(r.tdr_rating)', 'avg')
      .addSelect('COUNT(*)::int', 'count')
      .where('r.tdo_id IN (:...todoIds)', { todoIds })
      .groupBy('r.tdo_id')
      .getRawMany();

    const result: Record<string, { avg: number; count: number }> = {};
    for (const row of rows) {
      result[row.tdoId] = { avg: parseFloat(Number(row.avg).toFixed(1)), count: Number(row.count) };
    }
    return result;
  }

  private async getMyRatings(todoIds: string[], userId: string): Promise<Record<string, number>> {
    if (todoIds.length === 0) return {};

    const ratings = await this.todoRatingRepository.find({
      where: { tdoId: In(todoIds), usrId: userId },
    });

    const result: Record<string, number> = {};
    for (const r of ratings) {
      result[r.tdoId] = r.tdrRating;
    }
    return result;
  }

  private calculateNextDueDate(currentDueDate: Date, recurrenceType: string, recurrenceDay?: number | null): Date {
    const current = currentDueDate instanceof Date ? currentDueDate : new Date(currentDueDate);
    const next = new Date(current);

    switch (recurrenceType) {
      case 'DAILY':
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        next.setDate(next.getDate() + 7);
        break;
      case 'MONTHLY': {
        next.setMonth(next.getMonth() + 1);
        if (recurrenceDay) {
          const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          next.setDate(Math.min(recurrenceDay, maxDay));
        }
        break;
      }
      case 'YEARLY':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  private async createNextRecurrence(completedTodo: TodoEntity, userId: string): Promise<void> {
    // 중복 방지: 이미 이 할일에서 생성된 다음 건이 있는지 확인
    const existing = await this.todoRepository.findOne({
      where: { tdoParentId: completedTodo.tdoId },
      withDeleted: false,
    });
    if (existing) {
      this.logger.log(`Next recurrence already exists for todo ${completedTodo.tdoId}`);
      return;
    }

    // dueDate가 없으면 반복 생성 불가
    if (!completedTodo.tdoDueDate) {
      this.logger.warn(`Cannot create next recurrence for todo ${completedTodo.tdoId}: no due date`);
      return;
    }

    const nextDueDate = this.calculateNextDueDate(
      completedTodo.tdoDueDate,
      completedTodo.tdoRecurrenceType!,
      completedTodo.tdoRecurrenceDay,
    );

    // startDate도 동일 간격으로 이동
    let nextStartDate: Date | null = null;
    if (completedTodo.tdoStartDate) {
      nextStartDate = this.calculateNextDueDate(
        completedTodo.tdoStartDate,
        completedTodo.tdoRecurrenceType!,
        completedTodo.tdoRecurrenceDay,
      );
    }

    const computed = computeTodoStatus({ completedAt: null, startDate: nextStartDate, dueDate: nextDueDate });

    const nextTodo = this.todoRepository.create({
      entId: completedTodo.entId,
      usrId: completedTodo.usrId,
      tdoTitle: completedTodo.tdoTitle,
      tdoDescription: completedTodo.tdoDescription,
      tdoStatus: computedToLegacyStatus(computed),
      tdoStartDate: nextStartDate,
      tdoDueDate: nextDueDate,
      tdoTags: completedTodo.tdoTags,
      tdoVisibility: completedTodo.tdoVisibility,
      tdoCellId: completedTodo.tdoCellId,
      tdoOriginalLang: completedTodo.tdoOriginalLang,
      tdoRecurrenceType: completedTodo.tdoRecurrenceType,
      tdoRecurrenceDay: completedTodo.tdoRecurrenceDay,
      tdoParentId: completedTodo.tdoId,
      issId: completedTodo.issId,
      pjtId: completedTodo.pjtId,
    } as Partial<TodoEntity>);

    const saved = await this.todoRepository.save(nextTodo);

    // 참여자 복사
    const participants = await this.participantRepository.find({
      where: { tdoId: completedTodo.tdoId },
    });
    if (participants.length > 0) {
      const newParticipants = participants.map((p) =>
        this.participantRepository.create({ tdoId: saved.tdoId, usrId: p.usrId }),
      );
      await this.participantRepository.save(newParticipants);
    }

    // 검색 인덱싱 이벤트
    this.eventEmitter.emit('module.data.created', {
      module: 'todo',
      type: 'TODO',
      refId: saved.tdoId,
      title: saved.tdoTitle,
      content: [saved.tdoTitle, saved.tdoDescription, saved.tdoTags].filter(Boolean).join(' '),
      ownerId: userId,
      visibility: saved.tdoVisibility,
      cellId: saved.tdoCellId,
    });

    const dueDateStr = nextDueDate.toISOString().split('T')[0];
    this.logger.log(`Created next recurrence ${saved.tdoId} (due: ${dueDateStr}) from todo ${completedTodo.tdoId}`);
  }

  private async syncParticipants(todoId: string, participantIds: string[]): Promise<void> {
    // Remove existing participants
    await this.participantRepository.delete({ tdoId: todoId });

    // Insert new participants
    if (participantIds.length > 0) {
      const participants = participantIds.map((userId) =>
        this.participantRepository.create({ tdoId: todoId, usrId: userId }),
      );
      await this.participantRepository.save(participants);
    }
  }
}
