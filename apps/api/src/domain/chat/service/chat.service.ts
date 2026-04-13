import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, map, finalize, tap } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnitCode } from '@amb/types';
import { ConversationEntity } from '../entity/conversation.entity';
import { MessageEntity } from '../entity/message.entity';
import { WorkItemEntity } from '../../acl/entity/work-item.entity';
import { IssueService } from '../../issues/service/issue.service';
import { MeetingNoteService } from '../../meeting-notes/service/meeting-note.service';
import { CreateConversationRequest } from '../dto/request/create-conversation.request';
import { ChatMapper } from '../mapper/chat.mapper';
import {
  ConversationResponse,
  ConversationDetailResponse,
  AdminConversationResponse,
  AdminConversationDetailResponse,
  AdminTimelineMessageResponse,
} from '../dto/response/chat.response';
import { AgentFactoryService } from '../../agent/service/agent-factory.service';
import { AutoTaggingService } from '../../kms/service/auto-tagging.service';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { MODULE_DATA_EVENTS } from '../../kms/event/module-data.event';
import { stripHtml } from '../../../global/util/sanitize.util';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(WorkItemEntity)
    private readonly workItemRepository: Repository<WorkItemEntity>,
    private readonly agentFactory: AgentFactoryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly autoTaggingService: AutoTaggingService,
    private readonly issueService: IssueService,
    private readonly meetingNoteService: MeetingNoteService,
  ) {}

  async getConversations(
    userId: string,
    page: number = 1,
    size: number = 20,
    entityId?: string,
  ): Promise<{ data: ConversationResponse[]; totalCount: number }> {
    const where: any = { usrId: userId };
    if (entityId) where.entId = entityId;

    const [conversations, totalCount] = await this.conversationRepository.findAndCount({
      where,
      order: { cvsUpdatedAt: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      data: conversations.map(ChatMapper.toConversationResponse),
      totalCount,
    };
  }

  async getConversationsByDepartment(
    userId: string,
    department: string,
    entityId?: string,
  ): Promise<ConversationResponse[]> {
    const where: any = { usrId: userId, cvsUnit: department };
    if (entityId) where.entId = entityId;

    const conversations = await this.conversationRepository.find({
      where,
      order: { cvsUpdatedAt: 'DESC' },
    });

    return conversations.map(ChatMapper.toConversationResponse);
  }

  async getConversationDetail(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDetailResponse> {
    const conversation = await this.conversationRepository.findOne({
      where: { cvsId: conversationId },
    });

    if (!conversation) {
      throw new BusinessException(
        ERROR_CODE.CONVERSATION_NOT_FOUND.code,
        ERROR_CODE.CONVERSATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    if (conversation.usrId !== userId) {
      throw new BusinessException(
        ERROR_CODE.CONVERSATION_ACCESS_DENIED.code,
        ERROR_CODE.CONVERSATION_ACCESS_DENIED.message,
        HttpStatus.FORBIDDEN,
      );
    }

    const messages = await this.messageRepository.find({
      where: { cvsId: conversationId },
      order: { msgOrder: 'ASC' },
    });

    return ChatMapper.toConversationDetailResponse(conversation, messages);
  }

  async createConversation(
    request: CreateConversationRequest,
    userId: string,
    entityId?: string,
  ): Promise<ConversationResponse> {
    const conversation = this.conversationRepository.create({
      entId: entityId || null,
      usrId: userId,
      cvsUnit: request.unit_code,
      cvsTitle: request.title,
      cvsMessageCount: 0,
    });

    const saved = await this.conversationRepository.save(conversation);
    return ChatMapper.toConversationResponse(saved);
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { cvsId: conversationId },
    });

    if (!conversation) {
      throw new BusinessException(
        ERROR_CODE.CONVERSATION_NOT_FOUND.code,
        ERROR_CODE.CONVERSATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    if (conversation.usrId !== userId) {
      throw new BusinessException(
        ERROR_CODE.CONVERSATION_ACCESS_DENIED.code,
        ERROR_CODE.CONVERSATION_ACCESS_DENIED.message,
        HttpStatus.FORBIDDEN,
      );
    }

    await this.conversationRepository.softDelete(conversationId);
  }

  async sendMessage(
    conversationId: string,
    content: string,
    userId: string,
    language?: string,
  ): Promise<Observable<MessageEvent>> {
    const conversation = await this.conversationRepository.findOne({
      where: { cvsId: conversationId },
    });

    if (!conversation) {
      throw new BusinessException(
        ERROR_CODE.CONVERSATION_NOT_FOUND.code,
        ERROR_CODE.CONVERSATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    if (conversation.usrId !== userId) {
      throw new BusinessException(
        ERROR_CODE.CONVERSATION_ACCESS_DENIED.code,
        ERROR_CODE.CONVERSATION_ACCESS_DENIED.message,
        HttpStatus.FORBIDDEN,
      );
    }

    // Save user message (strip HTML to prevent XSS)
    const sanitizedContent = stripHtml(content);
    const messageCount = conversation.cvsMessageCount;
    const userMessage = this.messageRepository.create({
      cvsId: conversationId,
      msgRole: 'user',
      msgContent: sanitizedContent,
      msgOrder: messageCount + 1,
    });
    await this.messageRepository.save(userMessage);

    // Get conversation history
    const history = await this.messageRepository.find({
      where: { cvsId: conversationId },
      order: { msgOrder: 'ASC' },
    });

    const agentMessages = history.map((msg) => ({
      role: msg.msgRole === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.msgRole === 'admin'
        ? `[Administrator]\n${msg.msgContent}`
        : msg.msgContent,
    }));

    // Stream AI response
    const agent = this.agentFactory.getAgent(conversation.cvsUnit as UnitCode);
    let fullContent = '';
    const usageContext = conversation.entId
      ? { entId: conversation.entId, usrId: userId, sourceType: 'CHAT', cvsId: conversationId }
      : undefined;

    return agent.chatStream(agentMessages, language, usageContext).pipe(
      tap((event) => {
        const parsed = JSON.parse(event.data);
        if (parsed.content) {
          fullContent += parsed.content;
        }
      }),
      finalize(async () => {
        if (fullContent) {
          // Save assistant message
          const assistantMessage = this.messageRepository.create({
            cvsId: conversationId,
            msgRole: 'assistant',
            msgContent: fullContent,
            msgOrder: messageCount + 2,
            msgTokenCount: Math.ceil(fullContent.length / 4),
          });
          await this.messageRepository.save(assistantMessage);

          // Update conversation
          await this.conversationRepository.update(conversationId, {
            cvsMessageCount: messageCount + 2,
          });

          // Emit KMS event for knowledge pipeline
          this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
            module: 'chat',
            type: 'CONVERSATION',
            refId: conversationId,
            title: conversation.cvsTitle,
            content: `${content}\n\n${fullContent}`,
            ownerId: userId,
            entityId: conversation.entId || undefined,
          });
        }
      }),
    );
  }

  // ── Admin Methods ──

  async getAdminConversations(
    filters: {
      entityId?: string;
      department?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    },
    page: number = 1,
    size: number = 20,
  ): Promise<{ data: AdminConversationResponse[]; totalCount: number }> {
    const qb = this.conversationRepository
      .createQueryBuilder('cvs')
      .leftJoinAndSelect('cvs.user', 'user')
      .leftJoinAndSelect('cvs.hrEntity', 'entity')
      .where('cvs.cvsDeletedAt IS NULL');

    if (filters.entityId) {
      qb.andWhere('cvs.entId = :entityId', { entityId: filters.entityId });
    }
    if (filters.department) {
      qb.andWhere('cvs.cvsUnit = :department', { department: filters.department });
    }
    if (filters.userId) {
      qb.andWhere('cvs.usrId = :userId', { userId: filters.userId });
    }
    if (filters.dateFrom) {
      qb.andWhere('cvs.cvsCreatedAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      qb.andWhere('cvs.cvsCreatedAt <= :dateTo', { dateTo: `${filters.dateTo} 23:59:59` });
    }
    if (filters.search) {
      qb.andWhere('(cvs.cvsTitle ILIKE :search OR user.usrName ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    qb.orderBy('cvs.cvsUpdatedAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);

    const [conversations, totalCount] = await qb.getManyAndCount();

    return {
      data: conversations.map(ChatMapper.toAdminConversationResponse),
      totalCount,
    };
  }

  async getAdminConversationDetail(
    conversationId: string,
  ): Promise<AdminConversationDetailResponse> {
    const conversation = await this.conversationRepository.findOne({
      where: { cvsId: conversationId },
      relations: ['user', 'hrEntity'],
    });

    if (!conversation) {
      throw new BusinessException(
        ERROR_CODE.CONVERSATION_NOT_FOUND.code,
        ERROR_CODE.CONVERSATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const messages = await this.messageRepository.find({
      where: { cvsId: conversationId },
      order: { msgOrder: 'ASC' },
    });

    return ChatMapper.toAdminConversationDetailResponse(conversation, messages);
  }

  async getAdminTimeline(
    filters: {
      entityId?: string;
      department?: string;
      conversationId?: string;
      search?: string;
    },
    page: number = 1,
    size: number = 20,
  ): Promise<{ data: AdminTimelineMessageResponse[]; totalCount: number }> {
    const qb = this.messageRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.conversation', 'cvs')
      .leftJoinAndSelect('cvs.user', 'user')
      .leftJoinAndSelect('cvs.hrEntity', 'entity')
      .where('cvs.cvsDeletedAt IS NULL');

    if (filters.entityId) {
      qb.andWhere('cvs.entId = :entityId', { entityId: filters.entityId });
    }
    if (filters.department) {
      qb.andWhere('cvs.cvsUnit = :department', { department: filters.department });
    }
    if (filters.conversationId) {
      qb.andWhere('msg.cvsId = :conversationId', { conversationId: filters.conversationId });
    }
    if (filters.search) {
      qb.andWhere(
        '(msg.msgContent ILIKE :search OR cvs.cvsTitle ILIKE :search OR user.usrName ILIKE :search OR user.usrEmail ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('msg.msgCreatedAt', 'DESC')
      .skip((page - 1) * size)
      .take(size);

    const [messages, totalCount] = await qb.getManyAndCount();

    return {
      data: messages.map(ChatMapper.toAdminTimelineMessageResponse),
      totalCount,
    };
  }

  async sendAdminMessage(conversationId: string, content: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { cvsId: conversationId },
    });

    if (!conversation) {
      throw new BusinessException(
        ERROR_CODE.CONVERSATION_NOT_FOUND.code,
        ERROR_CODE.CONVERSATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const sanitizedContent = stripHtml(content);
    const nextOrder = conversation.cvsMessageCount + 1;
    const message = this.messageRepository.create({
      cvsId: conversationId,
      msgRole: 'admin',
      msgContent: sanitizedContent,
      msgOrder: nextOrder,
      msgTokenCount: Math.ceil(sanitizedContent.length / 4),
    });
    const saved = await this.messageRepository.save(message);

    await this.conversationRepository.update(conversationId, {
      cvsMessageCount: nextOrder,
    });

    return ChatMapper.toMessageResponse(saved);
  }

  async convertToKnowledge(
    conversationId: string,
    request: { title: string; content: string; visibility?: string; type?: string },
    userId: string,
    entityId?: string,
  ): Promise<{ workItemId: string; isNew: boolean }> {
    const conversation = await this.conversationRepository.findOne({
      where: { cvsId: conversationId },
    });

    if (!conversation) {
      throw new BusinessException(
        ERROR_CODE.CONVERSATION_NOT_FOUND.code,
        ERROR_CODE.CONVERSATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    let workItem = await this.workItemRepository.findOne({
      where: { witModule: 'chat', witRefId: conversationId },
    });

    let isNew = false;
    if (!workItem) {
      isNew = true;
      workItem = this.workItemRepository.create({
        entId: entityId || conversation.entId || '',
        witType: request.type || 'DOC',
        witTitle: request.title,
        witOwnerId: userId,
        witVisibility: request.visibility || 'SHARED',
        witModule: 'chat',
        witRefId: conversationId,
        witContent: request.content,
      });
    } else {
      workItem.witTitle = request.title;
      workItem.witContent = request.content;
      if (request.visibility) workItem.witVisibility = request.visibility;
      if (request.type) workItem.witType = request.type;
    }

    const saved = await this.workItemRepository.save(workItem);

    // Async auto-tagging
    this.autoTaggingService.tagWorkItem(saved.witId).catch(() => {});

    return { workItemId: saved.witId, isNew };
  }

  async convertToIssue(
    conversationId: string,
    request: {
      title: string;
      description: string;
      type: string;
      severity: string;
      priority?: number;
      project_id?: string;
      source_message_id?: string;
    },
    userId: string,
    entityId?: string,
  ) {
    const conversation = await this.getConversationForAdminAction(conversationId);
    const sourceContent = await this.getSourceContent(conversationId, request.source_message_id);

    const issue = await this.issueService.createIssue(
      {
        type: request.type,
        title: request.title,
        description: this.buildIssueDescription(request.description, conversation, sourceContent),
        severity: request.severity,
        priority: request.priority || 3,
        project_id: request.project_id,
      },
      userId,
      entityId || conversation.entId || undefined,
    );

    return {
      issueId: issue.issueId,
      issueRefNumber: issue.refNumber,
    };
  }

  async convertToNote(
    conversationId: string,
    request: {
      title: string;
      content: string;
      type?: string;
      visibility?: string;
      project_ids?: string[];
      issue_ids?: string[];
      source_message_id?: string;
    },
    userId: string,
    entityId?: string,
  ) {
    const conversation = await this.getConversationForAdminAction(conversationId);
    const sourceContent = await this.getSourceContent(conversationId, request.source_message_id);

    const note = await this.meetingNoteService.createMeetingNote(
      {
        type: request.type || 'MEMO',
        title: request.title,
        content: this.buildNoteHtml(request.content, conversation, sourceContent),
        visibility: request.visibility || 'ENTITY',
        department: conversation.cvsUnit,
        project_ids: request.project_ids,
        issue_ids: request.issue_ids,
      },
      userId,
      entityId || conversation.entId || undefined,
    );

    return {
      meetingNoteId: note.meetingNoteId,
      title: note.title,
    };
  }

  private async getConversationForAdminAction(conversationId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { cvsId: conversationId },
      relations: ['user', 'hrEntity'],
    });

    if (!conversation) {
      throw new BusinessException(
        ERROR_CODE.CONVERSATION_NOT_FOUND.code,
        ERROR_CODE.CONVERSATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    return conversation;
  }

  private async getSourceContent(conversationId: string, sourceMessageId?: string): Promise<string> {
    if (sourceMessageId) {
      const sourceMessage = await this.messageRepository.findOne({
        where: { msgId: sourceMessageId, cvsId: conversationId },
      });
      if (sourceMessage) {
        return sourceMessage.msgContent;
      }
    }

    const messages = await this.messageRepository.find({
      where: { cvsId: conversationId },
      order: { msgOrder: 'ASC' },
    });

    return messages
      .map((message) => `[${message.msgRole}] ${message.msgContent}`)
      .join('\n\n');
  }

  private buildIssueDescription(
    description: string,
    conversation: ConversationEntity,
    sourceContent: string,
  ): string {
    const entityCode = conversation.hrEntity?.entCode || '';
    const entityName = conversation.hrEntity?.entName || '';
    const requesterEmail = conversation.user?.usrEmail || '';

    return [
      description.trim(),
      '',
      '---',
      'Support Meta',
      `Conversation ID: ${conversation.cvsId}`,
      `Entity Code: ${entityCode}`,
      `Entity Name: ${entityName}`,
      `Requester Email: ${requesterEmail}`,
      '',
      'Source Content',
      sourceContent,
    ].join('\n');
  }

  private buildNoteHtml(
    content: string,
    conversation: ConversationEntity,
    sourceContent: string,
  ): string {
    const entityCode = conversation.hrEntity?.entCode || '';
    const entityName = conversation.hrEntity?.entName || '';
    const requesterEmail = conversation.user?.usrEmail || '';
    const escapedContent = this.escapeHtml(content);
    const escapedSource = this.escapeHtml(sourceContent);

    return [
      `<p>${escapedContent.replace(/\n/g, '<br />')}</p>`,
      '<hr />',
      '<p><strong>Support Meta</strong></p>',
      `<p>Conversation ID: ${conversation.cvsId}<br />Entity Code: ${entityCode}<br />Entity Name: ${entityName}<br />Requester Email: ${requesterEmail}</p>`,
      '<p><strong>Source Content</strong></p>',
      `<pre>${escapedSource}</pre>`,
    ].join('');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
