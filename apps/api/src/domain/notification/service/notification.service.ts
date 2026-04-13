import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entity/notification.entity';
import {
  NotificationMapper,
  NotificationResponse,
} from '../mapper/notification.mapper';
import {
  NotificationType,
  NotificationResourceType,
} from '../constant/notification-type.constant';

export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  message?: string;
  recipientId: string;
  senderId: string;
  resourceType: NotificationResourceType;
  resourceId: string;
  entityId: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  /**
   * 알림 생성 (단건)
   */
  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const notification = this.notificationRepo.create({
      ntfType: dto.type,
      ntfTitle: dto.title,
      ntfMessage: dto.message ?? null,
      ntfRecipientId: dto.recipientId,
      ntfSenderId: dto.senderId,
      ntfResourceType: dto.resourceType,
      ntfResourceId: dto.resourceId,
      entId: dto.entityId,
    });
    return this.notificationRepo.save(notification);
  }

  /**
   * 알림 대량 생성 (여러 수신자)
   */
  async createBulk(
    dtos: CreateNotificationDto[],
  ): Promise<NotificationEntity[]> {
    if (dtos.length === 0) return [];

    const entities = dtos.map((dto) =>
      this.notificationRepo.create({
        ntfType: dto.type,
        ntfTitle: dto.title,
        ntfMessage: dto.message ?? null,
        ntfRecipientId: dto.recipientId,
        ntfSenderId: dto.senderId,
        ntfResourceType: dto.resourceType,
        ntfResourceId: dto.resourceId,
        entId: dto.entityId,
      }),
    );
    return this.notificationRepo.save(entities);
  }

  /**
   * 사용자별 알림 목록 조회 (페이징)
   */
  async findByRecipient(
    recipientId: string,
    entityId: string,
    options?: {
      page?: number;
      limit?: number;
      isRead?: boolean;
      resourceType?: string;
    },
  ): Promise<{ data: NotificationResponse[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    const qb = this.notificationRepo
      .createQueryBuilder('ntf')
      .leftJoinAndSelect('ntf.sender', 'sender')
      .where('ntf.ntfRecipientId = :recipientId', { recipientId })
      .andWhere('ntf.entId = :entityId', { entityId })
      .andWhere('ntf.ntfDeletedAt IS NULL');

    if (options?.isRead !== undefined) {
      qb.andWhere('ntf.ntfIsRead = :isRead', { isRead: options.isRead });
    }

    if (options?.resourceType) {
      qb.andWhere('ntf.ntfResourceType = :resourceType', {
        resourceType: options.resourceType,
      });
    }

    qb.orderBy('ntf.ntfCreatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: NotificationMapper.toResponseList(entities),
      total,
    };
  }

  /**
   * 미읽음 카운트
   */
  async getUnreadCount(
    recipientId: string,
    entityId: string,
  ): Promise<number> {
    return this.notificationRepo.count({
      where: {
        ntfRecipientId: recipientId,
        entId: entityId,
        ntfIsRead: false,
      },
    });
  }

  /**
   * 단일 알림 읽음 처리
   */
  async markAsRead(
    ntfId: string,
    recipientId: string,
  ): Promise<void> {
    await this.notificationRepo.update(
      { ntfId, ntfRecipientId: recipientId },
      { ntfIsRead: true, ntfReadAt: new Date() },
    );
  }

  /**
   * 전체 읽음 처리
   */
  async markAllAsRead(
    recipientId: string,
    entityId: string,
  ): Promise<void> {
    await this.notificationRepo.update(
      {
        ntfRecipientId: recipientId,
        entId: entityId,
        ntfIsRead: false,
      },
      { ntfIsRead: true, ntfReadAt: new Date() },
    );
  }
}
