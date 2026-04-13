import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository, DeepPartial, Brackets, In } from 'typeorm';
import { NoticeEntity } from '../entity/notice.entity';
import { NoticeAttachmentEntity } from '../entity/notice-attachment.entity';
import { NoticeReadEntity } from '../entity/notice-read.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { CreateNoticeRequest } from '../dto/request/create-notice.request';
import { UpdateNoticeRequest } from '../dto/request/update-notice.request';
import { NoticeMapper } from '../mapper/notice.mapper';
import { FileService } from '../../../infrastructure/file/file.service';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { NoticeResponse } from '@amb/types';
import { sanitizeRichHtml } from '../../../global/util/sanitize.util';
import { TranslationService } from '../../translation/service/translation.service';
import { CellAccessService } from '../../members/service/cell-access.service';
import { MODULE_DATA_EVENTS } from '../../kms/event/module-data.event';

@Injectable()
export class NoticeService {
  private readonly logger = new Logger(NoticeService.name);
  constructor(
    @InjectRepository(NoticeEntity)
    private readonly noticeRepository: Repository<NoticeEntity>,
    @InjectRepository(NoticeAttachmentEntity)
    private readonly attachmentRepository: Repository<NoticeAttachmentEntity>,
    @InjectRepository(NoticeReadEntity)
    private readonly readRepository: Repository<NoticeReadEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly fileService: FileService,
    private readonly eventEmitter: EventEmitter2,
    private readonly translationService: TranslationService,
    private readonly cellAccessService: CellAccessService,
  ) {}

  private async getUserUnit(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { usrId: userId } });
    return user?.usrUnit || '';
  }

  async getNotices(userId: string, entityId?: string, query?: { page?: number; size?: number }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query?.size) || 50));
    const userUnit = await this.getUserUnit(userId);
    const userCellIds = await this.cellAccessService.getUserCellIds(userId);

    const qb = this.noticeRepository
      .createQueryBuilder('notice')
      .leftJoinAndSelect('notice.user', 'user')
      .leftJoinAndSelect('notice.attachments', 'attachments');

    if (entityId) {
      qb.where('notice.entId = :entityId', { entityId });
    }

    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where('notice.ntcVisibility = :public', { public: 'PUBLIC' })
          .orWhere(
            new Brackets((deptSub) => {
              deptSub
                .where('notice.ntcVisibility = :dept', { dept: 'UNIT' })
                .andWhere('notice.ntcUnit = :userDept', { userDept: userUnit });
            }),
          );
        if (userCellIds.length > 0) {
          sub.orWhere(
            new Brackets((grpSub) => {
              grpSub
                .where('notice.ntcVisibility = :group', { group: 'CELL' })
                .andWhere('notice.ntcCellId IN (:...userCellIds)', { userCellIds });
            }),
          );
        }
      }),
    );

    qb.orderBy('notice.ntcIsPinned', 'DESC')
      .addOrderBy('notice.ntcCreatedAt', 'DESC');

    qb.skip((page - 1) * size).take(size);
    const [entities, totalCount] = await qb.getManyAndCount();
    const totalPages = Math.ceil(totalCount / size);

    return {
      data: entities.map(NoticeMapper.toResponse),
      pagination: { page, size, totalCount, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    };
  }

  async getRecentNotices(userId: string, limit: number, entityId?: string): Promise<NoticeResponse[]> {
    const userUnit = await this.getUserUnit(userId);
    const userCellIds = await this.cellAccessService.getUserCellIds(userId);

    const qb = this.noticeRepository
      .createQueryBuilder('notice')
      .leftJoinAndSelect('notice.user', 'user')
      .leftJoinAndSelect('notice.attachments', 'attachments');

    if (entityId) {
      qb.where('notice.entId = :entityId', { entityId });
    }

    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where('notice.ntcVisibility = :public', { public: 'PUBLIC' })
          .orWhere(
            new Brackets((deptSub) => {
              deptSub
                .where('notice.ntcVisibility = :dept', { dept: 'UNIT' })
                .andWhere('notice.ntcUnit = :userDept', { userDept: userUnit });
            }),
          );
        if (userCellIds.length > 0) {
          sub.orWhere(
            new Brackets((grpSub) => {
              grpSub
                .where('notice.ntcVisibility = :group', { group: 'CELL' })
                .andWhere('notice.ntcCellId IN (:...userCellIds)', { userCellIds });
            }),
          );
        }
      }),
    );

    qb.orderBy('notice.ntcIsPinned', 'DESC')
      .addOrderBy('notice.ntcCreatedAt', 'DESC')
      .take(limit);

    const entities = await qb.getMany();
    return entities.map(NoticeMapper.toResponse);
  }

  async getNoticeById(id: string, userId: string): Promise<NoticeResponse> {
    const userUnit = await this.getUserUnit(userId);

    const entity = await this.noticeRepository.findOne({
      where: { ntcId: id },
      relations: ['user', 'attachments'],
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.NOTICE_NOT_FOUND.message);
    }

    const canAccess =
      entity.ntcVisibility === 'PUBLIC' ||
      (entity.ntcVisibility === 'UNIT' && entity.ntcUnit === userUnit) ||
      (entity.ntcVisibility === 'CELL' && entity.ntcCellId && await this.cellAccessService.isUserInCell(userId, entity.ntcCellId));

    if (!canAccess) {
      throw new ForbiddenException(ERROR_CODE.NOTICE_ACCESS_DENIED.message);
    }

    // Increment view count
    await this.noticeRepository.increment({ ntcId: id }, 'ntcViewCount', 1);
    entity.ntcViewCount += 1;

    // Upsert notice-read record
    const existingRead = await this.readRepository.findOne({
      where: { ntcId: id, usrId: userId },
    });
    if (!existingRead) {
      const readRecord = this.readRepository.create({
        ntcId: id,
        usrId: userId,
      });
      await this.readRepository.save(readRecord);
    }

    return NoticeMapper.toResponse(entity);
  }

  async createNotice(
    dto: CreateNoticeRequest,
    userId: string,
    files?: Express.Multer.File[],
    entityId?: string,
  ): Promise<NoticeResponse> {
    const notice = this.noticeRepository.create({
      entId: entityId || undefined,
      usrId: userId,
      ntcTitle: dto.title,
      ntcContent: sanitizeRichHtml(dto.content),
      ntcVisibility: dto.visibility || 'PUBLIC',
      ntcUnit: dto.department || undefined,
      ntcCellId: dto.group_id || undefined,
      ntcIsPinned: dto.is_pinned || false,
    } as DeepPartial<NoticeEntity>);

    const savedNotice: NoticeEntity = await this.noticeRepository.save(notice as NoticeEntity);

    if (files && files.length > 0) {
      const attachments: NoticeAttachmentEntity[] = [];

      for (const file of files) {
        const savedFile = await this.fileService.saveFile(file);
        const attachment = this.attachmentRepository.create({
          ntcId: savedNotice.ntcId,
          ntaOriginalName: savedFile.originalName,
          ntaStoredName: savedFile.storedName,
          ntaFileSize: savedFile.fileSize,
          ntaMimeType: savedFile.mimeType,
        });
        attachments.push(attachment);
      }

      await this.attachmentRepository.save(attachments);
    }

    const loaded = await this.noticeRepository.findOne({
      where: { ntcId: savedNotice.ntcId },
      relations: ['user', 'attachments'],
    });

    // 자동번역: 공지 생성 시 다른 언어로 비동기 번역 트리거
    this.triggerAutoTranslation(savedNotice.ntcId, userId, entityId).catch((err) =>
      this.logger.warn(`Auto-translation failed for notice ${savedNotice.ntcId}: ${err.message}`),
    );

    this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
      module: 'notice',
      type: 'DOC',
      refId: savedNotice.ntcId,
      title: savedNotice.ntcTitle,
      content: [savedNotice.ntcTitle, savedNotice.ntcContent].filter(Boolean).join(' '),
      ownerId: userId,
      entityId: entityId,
      visibility: savedNotice.ntcVisibility,
      cellId: savedNotice.ntcCellId,
    });

    return NoticeMapper.toResponse(loaded!);
  }

  async updateNotice(id: string, dto: UpdateNoticeRequest): Promise<NoticeResponse> {
    const entity = await this.noticeRepository.findOne({
      where: { ntcId: id },
      relations: ['user', 'attachments'],
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.NOTICE_NOT_FOUND.message);
    }

    if (dto.title !== undefined) entity.ntcTitle = dto.title;
    if (dto.content !== undefined) entity.ntcContent = sanitizeRichHtml(dto.content);
    if (dto.visibility !== undefined) entity.ntcVisibility = dto.visibility;
    if (dto.department !== undefined) entity.ntcUnit = dto.department;
    if (dto.group_id !== undefined) entity.ntcCellId = dto.group_id || undefined as any;
    if (dto.is_pinned !== undefined) entity.ntcIsPinned = dto.is_pinned;

    const saved = await this.noticeRepository.save(entity);

    // Mark existing translations as stale when source content changes
    await this.translationService.markStale('NOTICE', saved.ntcId);

    this.eventEmitter.emit(MODULE_DATA_EVENTS.UPDATED, {
      module: 'notice',
      type: 'DOC',
      refId: saved.ntcId,
      title: saved.ntcTitle,
      content: [saved.ntcTitle, saved.ntcContent].filter(Boolean).join(' '),
      ownerId: entity.usrId,
      visibility: saved.ntcVisibility,
      cellId: saved.ntcCellId,
    });

    return NoticeMapper.toResponse(saved);
  }

  async deleteNotice(id: string): Promise<void> {
    const entity = await this.noticeRepository.findOne({ where: { ntcId: id } });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.NOTICE_NOT_FOUND.message);
    }

    await this.noticeRepository.softRemove(entity);
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    const attachment = await this.attachmentRepository.findOne({
      where: { ntaId: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found.');
    }

    this.fileService.deleteFile(attachment.ntaStoredName);
    await this.attachmentRepository.remove(attachment);
  }

  /**
   * 공지 생성 후 자동으로 다른 언어로 번역 트리거 (fire-and-forget)
   * originalLang 이외의 모든 지원 언어로 번역합니다.
   */
  private async triggerAutoTranslation(noticeId: string, userId: string, entityId?: string): Promise<void> {
    const notice = await this.noticeRepository.findOne({ where: { ntcId: noticeId } });
    if (!notice) return;

    const originalLang = (notice as any).ntcOriginalLang || 'ko';
    const targetLangs = ['en', 'ko', 'vi'].filter((l) => l !== originalLang);

    for (const targetLang of targetLangs) {
      try {
        const dto = {
          source_type: 'NOTICE' as const,
          source_id: noticeId,
          source_fields: ['title', 'content'],
          target_lang: targetLang,
        };
        // Subscribe to drain the stream (fire-and-forget)
        await new Promise<void>((resolve, reject) => {
          const stream$ = this.translationService.translateStream(dto, userId, entityId);
          stream$.subscribe({
            complete: () => resolve(),
            error: (err) => reject(err),
          });
        });
        this.logger.log(`Auto-translated notice ${noticeId} to ${targetLang}`);
      } catch (err) {
        this.logger.warn(`Auto-translate notice ${noticeId} to ${targetLang} failed: ${err}`);
      }
    }
  }
}
