import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseAttachmentEntity } from '../entity/expense-attachment.entity';
import { ExpenseRequestEntity } from '../entity/expense-request.entity';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import * as path from 'path';
import * as fs from 'fs';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword', 'application/vnd.ms-excel',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class ExpenseAttachmentService {
  constructor(
    @InjectRepository(ExpenseAttachmentEntity)
    private readonly repo: Repository<ExpenseAttachmentEntity>,
    @InjectRepository(ExpenseRequestEntity)
    private readonly requestRepo: Repository<ExpenseRequestEntity>,
  ) {}

  async uploadFile(
    requestId: string,
    file: Express.Multer.File,
    user: UserPayload,
    entityId: string,
  ): Promise<ExpenseAttachmentEntity> {
    await this.checkRequest(requestId, entityId);

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new ForbiddenException('허용되지 않는 파일 형식입니다. (PDF, 이미지, Excel, Word만 허용)');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new ForbiddenException('파일 크기는 10MB를 초과할 수 없습니다.');
    }

    const storageKey = `expense-attachments/${requestId}/${Date.now()}_${path.basename(file.originalname)}`;
    // Multer/busboy decodes filename as latin1, corrupting UTF-8 chars
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8').normalize('NFC');

    const attachment = this.repo.create({
      exrId: requestId,
      eatType: 'FILE',
      eatFileName: originalName,
      eatFileSize: file.size,
      eatMimeType: file.mimetype,
      eatStorageKey: storageKey,
      eatUploaderId: user.userId,
    });

    return this.repo.save(attachment);
  }

  async addLink(
    requestId: string,
    url: string,
    title: string | undefined,
    user: UserPayload,
    entityId: string,
  ): Promise<ExpenseAttachmentEntity> {
    await this.checkRequest(requestId, entityId);

    const attachment = this.repo.create({
      exrId: requestId,
      eatType: 'LINK',
      eatLinkUrl: url,
      eatLinkTitle: title || null,
      eatUploaderId: user.userId,
    });

    return this.repo.save(attachment);
  }

  async remove(attachmentId: string, user: UserPayload, entityId: string): Promise<void> {
    const attachment = await this.repo.findOne({
      where: { eatId: attachmentId },
      relations: ['request'],
    });
    if (!attachment) throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    if (attachment.request.entId !== entityId) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    await this.repo.softDelete(attachmentId);
  }

  private async checkRequest(requestId: string, entityId: string) {
    const req = await this.requestRepo.findOne({ where: { exrId: requestId, entId: entityId } });
    if (!req) throw new NotFoundException('지출결의서를 찾을 수 없습니다.');
  }
}
