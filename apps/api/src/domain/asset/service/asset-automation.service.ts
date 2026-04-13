import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetRequestEntity } from '../entity/asset-request.entity';
import { AssetEntity } from '../entity/asset.entity';
import { AssetRequestLogEntity } from '../entity/asset-request-log.entity';
import { MailService } from '../../../infrastructure/external/mail/mail.service';
import { TodoService } from '../../todo/service/todo.service';

@Injectable()
export class AssetAutomationService {
  private readonly logger = new Logger(AssetAutomationService.name);
  private isCronRunning = false;

  constructor(
    @InjectRepository(AssetRequestEntity)
    private readonly requestRepository: Repository<AssetRequestEntity>,
    @InjectRepository(AssetEntity)
    private readonly assetRepository: Repository<AssetEntity>,
    @InjectRepository(AssetRequestLogEntity)
    private readonly requestLogRepository: Repository<AssetRequestLogEntity>,
    private readonly mailService: MailService,
    private readonly todoService: TodoService,
  ) {}

  @Cron('0 */30 * * * *')
  async processAssetRequestAutomation(): Promise<void> {
    if (this.isCronRunning) {
      return;
    }
    this.isCronRunning = true;

    try {
      await this.activateStartedRequests();
      await this.completeOrMarkDelayedRequests();
      await this.sendEndingSoonReminders(3, 'AUTO_REMINDER_D3');
      await this.sendEndingSoonReminders(1, 'AUTO_REMINDER_D1');
      await this.sendOverdueReminders();
    } catch (error) {
      this.logger.error(`Asset automation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isCronRunning = false;
    }
  }

  private async activateStartedRequests(): Promise<void> {
    const now = new Date();
    const targets = await this.requestRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.asset', 'asset')
      .where('req.asrStatus = :status', { status: 'FINAL_APPROVED' })
      .andWhere('req.asrStartAt <= :now', { now })
      .andWhere('req.asrEndAt > :now', { now })
      .andWhere('req.asrDeletedAt IS NULL')
      .getMany();

    for (const request of targets) {
      const fromStatus = request.asrStatus;
      request.asrStatus = 'IN_USE';
      await this.requestRepository.save(request);
      await this.logMarker(request, fromStatus, 'IN_USE', 'AUTO_START');

      if (request.astId) {
        await this.assetRepository.update({ astId: request.astId }, { astStatus: 'IN_USE' });
      }
    }
  }

  private async completeOrMarkDelayedRequests(): Promise<void> {
    const now = new Date();
    const targets = await this.requestRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.asset', 'asset')
      .where('req.asrStatus IN (:...statuses)', { statuses: ['IN_USE', 'FINAL_APPROVED'] })
      .andWhere('req.asrEndAt <= :now', { now })
      .andWhere('req.asrDeletedAt IS NULL')
      .getMany();

    for (const request of targets) {
      const fromStatus = request.asrStatus;
      const isMeetingReservation = request.asrRequestType === 'MEETING_ROOM_RESERVATION';
      const isReturned = !!request.asrReturnedAt;

      if (isMeetingReservation || isReturned) {
        request.asrStatus = 'COMPLETED';
        await this.requestRepository.save(request);
        await this.logMarker(request, fromStatus, 'COMPLETED', 'AUTO_END');

        if (request.astId) {
          const nextStatus = await this.resolveNextAssetStatus(request.astId);
          await this.assetRepository.update({ astId: request.astId }, { astStatus: nextStatus });
        }
      } else {
        request.asrStatus = 'RETURN_DELAYED';
        await this.requestRepository.save(request);
        await this.logMarker(request, fromStatus, 'RETURN_DELAYED', 'AUTO_OVERDUE');
      }
    }
  }

  private async sendEndingSoonReminders(days: number, marker: string): Promise<void> {
    const range = this.getTargetDayRange(days);
    const targets = await this.requestRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.requester', 'requester')
      .where('req.asrStatus IN (:...statuses)', { statuses: ['FINAL_APPROVED', 'IN_USE'] })
      .andWhere('req.asrEndAt >= :start', { start: range.start })
      .andWhere('req.asrEndAt <= :end', { end: range.end })
      .andWhere('req.asrDeletedAt IS NULL')
      .getMany();

    for (const request of targets) {
      const alreadySent = await this.hasMarker(request.asrId, marker);
      if (alreadySent) {
        continue;
      }

      const title = `[AMB] 자산 사용 종료 ${days}일 전 안내 (${request.asrRequestNo})`;
      const description = `신청번호 ${request.asrRequestNo}의 사용 종료일이 ${days}일 남았습니다. 종료일: ${request.asrEndAt.toISOString()}`;

      await this.sendEmailToRequester(request, title, description);
      await this.createTodoForRequester(request, title, description, 'ASSET,REMINDER');
      await this.logMarker(request, request.asrStatus, request.asrStatus, marker);
    }
  }

  private async sendOverdueReminders(): Promise<void> {
    const now = new Date();
    const targets = await this.requestRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.requester', 'requester')
      .where('req.asrStatus = :status', { status: 'RETURN_DELAYED' })
      .andWhere('req.asrEndAt < :now', { now })
      .andWhere('req.asrReturnedAt IS NULL')
      .andWhere('req.asrDeletedAt IS NULL')
      .getMany();

    for (const request of targets) {
      const marker = `AUTO_OVERDUE_NOTICE_${request.asrEndAt.toISOString().slice(0, 10)}`;
      const alreadySent = await this.hasMarker(request.asrId, marker);
      if (alreadySent) {
        continue;
      }

      const title = `[AMB] 자산 반납 지연 안내 (${request.asrRequestNo})`;
      const description = `신청번호 ${request.asrRequestNo}의 사용 종료일(${request.asrEndAt.toISOString()})이 지났습니다. 반납 처리가 필요합니다.`;

      await this.sendEmailToRequester(request, title, description);
      await this.createTodoForRequester(request, title, description, 'ASSET,OVERDUE');
      await this.logMarker(request, request.asrStatus, request.asrStatus, marker);
    }
  }

  private async resolveNextAssetStatus(assetId: string): Promise<string> {
    const now = new Date();

    const activeInUse = await this.requestRepository
      .createQueryBuilder('req')
      .where('req.astId = :assetId', { assetId })
      .andWhere('req.asrStatus = :status', { status: 'IN_USE' })
      .andWhere('req.asrEndAt > :now', { now })
      .andWhere('req.asrDeletedAt IS NULL')
      .getCount();

    if (activeInUse > 0) {
      return 'IN_USE';
    }

    const reserved = await this.requestRepository
      .createQueryBuilder('req')
      .where('req.astId = :assetId', { assetId })
      .andWhere('req.asrStatus = :status', { status: 'FINAL_APPROVED' })
      .andWhere('req.asrEndAt > :now', { now })
      .andWhere('req.asrDeletedAt IS NULL')
      .getCount();

    if (reserved > 0) {
      return 'RESERVED';
    }

    return 'STORED';
  }

  private getTargetDayRange(days: number): { start: Date; end: Date } {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const start = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0, 0, 0, 0);
    const end = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  private async hasMarker(requestId: string, marker: string): Promise<boolean> {
    const count = await this.requestLogRepository.count({
      where: {
        asrId: requestId,
        arlReason: marker,
      },
    });
    return count > 0;
  }

  private async logMarker(
    request: AssetRequestEntity,
    fromStatus: string | null,
    toStatus: string,
    marker: string,
  ): Promise<void> {
    await this.requestLogRepository.save(
      this.requestLogRepository.create({
        asrId: request.asrId,
        arlChangedBy: request.asrRequesterId,
        arlFromStatus: fromStatus,
        arlToStatus: toStatus,
        arlReason: marker,
      }),
    );
  }

  private async sendEmailToRequester(
    request: AssetRequestEntity,
    subject: string,
    message: string,
  ): Promise<void> {
    const requester = request.requester;
    const to = requester?.usrCompanyEmail || requester?.usrEmail;
    if (!to) {
      return;
    }

    try {
      await this.mailService.sendRawEmail({
        to: [to],
        subject,
        html: `<div style="font-family: Arial, sans-serif;"><p>${message}</p></div>`,
      });
    } catch (error) {
      this.logger.warn(`Asset automation email failed (${request.asrId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createTodoForRequester(
    request: AssetRequestEntity,
    title: string,
    description: string,
    tags: string,
  ): Promise<void> {
    try {
      await this.todoService.createTodo(
        {
          title,
          description,
          status: 'SCHEDULED',
          due_date: new Date().toISOString(),
          tags,
          visibility: 'PRIVATE',
        },
        request.asrRequesterId,
        request.entId,
      );
    } catch (error) {
      this.logger.warn(`Asset automation todo failed (${request.asrId}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}