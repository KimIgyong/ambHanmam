import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetRequestEntity } from '../entity/asset-request.entity';
import { MeetingReservationEntity } from '../entity/meeting-reservation.entity';
import { AssetApprovalHistoryEntity } from '../entity/asset-approval-history.entity';
import { AssetRequestLogEntity } from '../entity/asset-request-log.entity';
import { AssetEntity } from '../entity/asset.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { CreateAssetRequestRequest } from '../dto/request/create-asset-request.request';
import { UpdateAssetRequestRequest } from '../dto/request/update-asset-request.request';
import { ApproveAssetRequestRequest } from '../dto/request/approve-asset-request.request';
import { AssetRequestMapper } from '../mapper/asset-request.mapper';
import { AssetRequestResponse } from '../dto/response/asset-request.response';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { MailService } from '../../../infrastructure/external/mail/mail.service';
import { SystemParamService } from '../../hr/service/system-param.service';
import { TodoService } from '../../todo/service/todo.service';

const BLOCKED_ASSET_STATUSES = ['REPAIRING', 'DISPOSAL_PENDING', 'DISPOSED'];
const RESERVED_STATUSES_FOR_OVERLAP = ['SUBMITTED', 'L1_APPROVED', 'FINAL_APPROVED', 'IN_USE', 'RETURN_DELAYED'];

@Injectable()
export class AssetRequestService {
  private readonly logger = new Logger(AssetRequestService.name);

  constructor(
    @InjectRepository(AssetRequestEntity)
    private readonly requestRepository: Repository<AssetRequestEntity>,
    @InjectRepository(MeetingReservationEntity)
    private readonly meetingReservationRepository: Repository<MeetingReservationEntity>,
    @InjectRepository(AssetApprovalHistoryEntity)
    private readonly approvalHistoryRepository: Repository<AssetApprovalHistoryEntity>,
    @InjectRepository(AssetRequestLogEntity)
    private readonly requestLogRepository: Repository<AssetRequestLogEntity>,
    @InjectRepository(AssetEntity)
    private readonly assetRepository: Repository<AssetEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly mailService: MailService,
    private readonly systemParamService: SystemParamService,
    private readonly todoService: TodoService,
  ) {}

  private async isL1ApprovalEnabled(): Promise<boolean> {
    const param = await this.systemParamService.getParamValue('ASSET_L1_APPROVAL_ENABLED');
    if (param === null || param === undefined) {
      return true;
    }
    return String(param).toLowerCase() === 'true';
  }

  private async sendRejectNotificationEmail(
    request: AssetRequestEntity,
    rejectReason: string,
  ): Promise<void> {
    const requester = request.requester;
    const to = requester?.usrCompanyEmail || requester?.usrEmail;
    if (!to) {
      this.logger.warn(`Reject notification skipped: requester email not found for request ${request.asrId}`);
      return;
    }

    const subject = `[AMB] 자산 신청 반려 안내 (${request.asrRequestNo})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <h3>자산 신청이 반려되었습니다.</h3>
        <p><strong>신청번호:</strong> ${request.asrRequestNo}</p>
        <p><strong>신청유형:</strong> ${request.asrRequestType}</p>
        <p><strong>사용기간:</strong> ${request.asrStartAt.toISOString()} ~ ${request.asrEndAt.toISOString()}</p>
        <p><strong>반려 사유:</strong> ${rejectReason}</p>
      </div>
    `;

    try {
      await this.mailService.sendRawEmail({
        to: [to],
        subject,
        html,
      });
    } catch (error) {
      this.logger.warn(`Reject notification email failed for request ${request.asrId}: ${error}`);
    }
  }

  private async createRejectNotificationTodo(
    request: AssetRequestEntity,
    rejectReason: string,
  ): Promise<void> {
    const requesterId = request.asrRequesterId;
    if (!requesterId) {
      this.logger.warn(`Reject notification todo skipped: requester id missing for request ${request.asrId}`);
      return;
    }

    const dueDate = new Date().toISOString();
    const title = `자산 신청 반려: ${request.asrRequestNo}`;
    const description = `신청번호 ${request.asrRequestNo} (${request.asrRequestType}) 이(가) 반려되었습니다. 사유: ${rejectReason}`;

    try {
      await this.todoService.createTodo(
        {
          title,
          description,
          status: 'SCHEDULED',
          due_date: dueDate,
          tags: 'ASSET,REJECTED',
          visibility: 'PRIVATE',
        },
        requesterId,
        request.entId,
      );
    } catch (error) {
      this.logger.warn(`Reject notification todo failed for request ${request.asrId}: ${error}`);
    }
  }

  private generateRequestNo(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const rnd = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `ARQ-${y}${m}${day}-${rnd}`;
  }

  private validateDateRange(startAt: Date, endAt: Date): void {
    if (startAt >= endAt) {
      throw new BadRequestException('Start time must be earlier than end time.');
    }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (startAt < todayStart) {
      throw new BadRequestException('Past date request is not allowed.');
    }
  }

  private async getAssetOrThrow(assetId: string, entityId: string): Promise<AssetEntity> {
    const asset = await this.assetRepository.findOne({ where: { astId: assetId, entId: entityId } });
    if (!asset) {
      throw new NotFoundException(ERROR_CODE.ASSET_NOT_FOUND.message);
    }
    return asset;
  }

  private async validateAssetStatus(asset: AssetEntity): Promise<void> {
    if (BLOCKED_ASSET_STATUSES.includes(asset.astStatus)) {
      throw new BadRequestException('Asset is not available for request in current status.');
    }
  }

  private async validateOverlap(
    assetId: string,
    startAt: Date,
    endAt: Date,
    excludeRequestId?: string,
  ): Promise<void> {
    const qb = this.requestRepository
      .createQueryBuilder('req')
      .where('req.astId = :assetId', { assetId })
      .andWhere('req.asrStatus IN (:...statuses)', { statuses: RESERVED_STATUSES_FOR_OVERLAP })
      .andWhere('req.asrStartAt < :endAt', { endAt })
      .andWhere('req.asrEndAt > :startAt', { startAt })
      .andWhere('req.asrDeletedAt IS NULL');

    if (excludeRequestId) {
      qb.andWhere('req.asrId != :excludeRequestId', { excludeRequestId });
    }

    const count = await qb.getCount();
    if (count > 0) {
      throw new BadRequestException('Requested period overlaps with approved or in-use request.');
    }
  }

  private async validateDuplicateByRequester(
    requesterId: string,
    assetId: string | null,
    startAt: Date,
    endAt: Date,
    excludeRequestId?: string,
  ): Promise<void> {
    if (!assetId) return;

    const qb = this.requestRepository
      .createQueryBuilder('req')
      .where('req.asrRequesterId = :requesterId', { requesterId })
      .andWhere('req.astId = :assetId', { assetId })
      .andWhere('req.asrStartAt = :startAt', { startAt })
      .andWhere('req.asrEndAt = :endAt', { endAt })
      .andWhere('req.asrDeletedAt IS NULL');

    if (excludeRequestId) {
      qb.andWhere('req.asrId != :excludeRequestId', { excludeRequestId });
    }

    const count = await qb.getCount();
    if (count > 0) {
      throw new BadRequestException('Duplicate request by same user and period is not allowed.');
    }
  }

  private async logStatusChange(
    requestId: string,
    changedBy: string,
    fromStatus: string | null,
    toStatus: string,
    reason?: string,
  ): Promise<void> {
    await this.requestLogRepository.save(
      this.requestLogRepository.create({
        asrId: requestId,
        arlChangedBy: changedBy,
        arlFromStatus: fromStatus,
        arlToStatus: toStatus,
        arlReason: reason || null,
      }),
    );
  }

  async createDraft(
    dto: CreateAssetRequestRequest,
    userId: string,
    entityId: string,
  ): Promise<AssetRequestResponse> {
    const startAt = new Date(dto.start_at);
    const endAt = new Date(dto.end_at);
    this.validateDateRange(startAt, endAt);

    let asset: AssetEntity | null = null;
    if (dto.asset_id) {
      asset = await this.getAssetOrThrow(dto.asset_id, entityId);
      await this.validateAssetStatus(asset);
      await this.validateOverlap(asset.astId, startAt, endAt);
    }

    await this.validateDuplicateByRequester(userId, dto.asset_id || null, startAt, endAt);

    if (dto.request_type === 'MEETING_ROOM_RESERVATION') {
      if (!dto.meeting_title || !dto.attendee_count || !dto.meeting_type) {
        throw new BadRequestException('Meeting room reservation requires title, attendee_count, and meeting_type.');
      }
    }

    const request = await this.requestRepository.save(
      this.requestRepository.create({
        entId: entityId,
        asrRequestNo: this.generateRequestNo(),
        asrRequesterId: userId,
        asrRequestType: dto.request_type,
        asrAssetSelectMode: dto.asset_select_mode,
        astId: dto.asset_id || null,
        asrAssetCategory: dto.asset_category || null,
        asrPurpose: dto.purpose,
        asrStartAt: startAt,
        asrEndAt: endAt,
        asrPlace: dto.place || null,
        asrStatus: 'DRAFT',
      }),
    );

    if (dto.request_type === 'MEETING_ROOM_RESERVATION') {
      await this.meetingReservationRepository.save(
        this.meetingReservationRepository.create({
          asrId: request.asrId,
          mtrTitle: dto.meeting_title!,
          mtrAttendeeCount: dto.attendee_count!,
          mtrMeetingType: dto.meeting_type!,
          mtrStartAt: startAt,
          mtrEndAt: endAt,
          mtrRequiredEquipments: dto.required_equipments || null,
        }),
      );
    }

    await this.logStatusChange(request.asrId, userId, null, 'DRAFT', 'Draft created');

    const loaded = await this.requestRepository.findOne({
      where: { asrId: request.asrId },
      relations: ['requester', 'asset'],
    });

    return AssetRequestMapper.toResponse(loaded!);
  }

  async updateDraft(
    requestId: string,
    dto: UpdateAssetRequestRequest,
    userId: string,
    entityId: string,
  ): Promise<AssetRequestResponse> {
    const entity = await this.requestRepository.findOne({ where: { asrId: requestId, entId: entityId } });
    if (!entity) throw new NotFoundException('Asset request not found.');
    if (entity.asrRequesterId !== userId) throw new ForbiddenException('Only requester can edit this request.');
    if (entity.asrStatus !== 'DRAFT') throw new BadRequestException('Only DRAFT request can be updated.');

    const startAt = dto.start_at ? new Date(dto.start_at) : entity.asrStartAt;
    const endAt = dto.end_at ? new Date(dto.end_at) : entity.asrEndAt;
    this.validateDateRange(startAt, endAt);

    const nextAssetId = dto.asset_id !== undefined ? dto.asset_id || null : entity.astId;
    if (nextAssetId) {
      const asset = await this.getAssetOrThrow(nextAssetId, entityId);
      await this.validateAssetStatus(asset);
      await this.validateOverlap(nextAssetId, startAt, endAt, requestId);
    }
    await this.validateDuplicateByRequester(userId, nextAssetId, startAt, endAt, requestId);

    if (dto.request_type !== undefined) entity.asrRequestType = dto.request_type;
    if (dto.asset_select_mode !== undefined) entity.asrAssetSelectMode = dto.asset_select_mode;
    if (dto.asset_id !== undefined) entity.astId = dto.asset_id || null;
    if (dto.asset_category !== undefined) entity.asrAssetCategory = dto.asset_category || null;
    if (dto.purpose !== undefined) entity.asrPurpose = dto.purpose;
    entity.asrStartAt = startAt;
    entity.asrEndAt = endAt;
    if (dto.place !== undefined) entity.asrPlace = dto.place || null;

    const saved = await this.requestRepository.save(entity);

    if (saved.asrRequestType === 'MEETING_ROOM_RESERVATION') {
      const meeting = await this.meetingReservationRepository.findOne({ where: { asrId: saved.asrId } });
      if (meeting) {
        if (dto.meeting_title !== undefined) meeting.mtrTitle = dto.meeting_title;
        if (dto.attendee_count !== undefined) meeting.mtrAttendeeCount = dto.attendee_count as number;
        if (dto.meeting_type !== undefined) meeting.mtrMeetingType = dto.meeting_type;
        meeting.mtrStartAt = startAt;
        meeting.mtrEndAt = endAt;
        if (dto.required_equipments !== undefined) meeting.mtrRequiredEquipments = dto.required_equipments || null;
        await this.meetingReservationRepository.save(meeting);
      }
    }

    const loaded = await this.requestRepository.findOne({
      where: { asrId: saved.asrId },
      relations: ['requester', 'asset'],
    });

    return AssetRequestMapper.toResponse(loaded!);
  }

  async submit(
    requestId: string,
    userId: string,
    entityId: string,
  ): Promise<AssetRequestResponse> {
    const entity = await this.requestRepository.findOne({
      where: { asrId: requestId, entId: entityId },
      relations: ['asset', 'requester'],
    });
    if (!entity) throw new NotFoundException('Asset request not found.');
    if (entity.asrRequesterId !== userId) throw new ForbiddenException('Only requester can submit this request.');
    if (entity.asrStatus !== 'DRAFT') throw new BadRequestException('Only DRAFT request can be submitted.');

    if (entity.astId) {
      await this.validateAssetStatus(entity.asset!);
      await this.validateOverlap(entity.astId, entity.asrStartAt, entity.asrEndAt, entity.asrId);
    }

    const fromStatus = entity.asrStatus;
    entity.asrStatus = 'SUBMITTED';
    const saved = await this.requestRepository.save(entity);
    await this.logStatusChange(saved.asrId, userId, fromStatus, 'SUBMITTED', 'Submitted for approval');

    return AssetRequestMapper.toResponse(saved);
  }

  async cancel(
    requestId: string,
    userId: string,
    entityId: string,
  ): Promise<void> {
    const entity = await this.requestRepository.findOne({ where: { asrId: requestId, entId: entityId } });
    if (!entity) throw new NotFoundException('Asset request not found.');
    if (entity.asrRequesterId !== userId) throw new ForbiddenException('Only requester can cancel this request.');
    if (entity.asrStatus !== 'SUBMITTED') throw new BadRequestException('Only submitted request can be cancelled.');

    const fromStatus = entity.asrStatus;
    entity.asrStatus = 'CANCELLED';
    await this.requestRepository.save(entity);
    await this.logStatusChange(entity.asrId, userId, fromStatus, 'CANCELLED', 'Requester cancelled');
  }

  async getMyRequests(
    userId: string,
    entityId: string,
    filters?: { status?: string; request_type?: string },
  ): Promise<AssetRequestResponse[]> {
    const qb = this.requestRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.requester', 'requester')
      .leftJoinAndSelect('req.asset', 'asset')
      .where('req.entId = :entityId', { entityId })
      .andWhere('req.asrRequesterId = :userId', { userId })
      .andWhere('req.asrDeletedAt IS NULL')
      .orderBy('req.asrCreatedAt', 'DESC');

    if (filters?.status) qb.andWhere('req.asrStatus = :status', { status: filters.status });
    if (filters?.request_type) qb.andWhere('req.asrRequestType = :requestType', { requestType: filters.request_type });

    const entities = await qb.getMany();
    return entities.map(AssetRequestMapper.toResponse);
  }

  async getRequestById(
    requestId: string,
    userId: string,
    role: string,
    entityId: string,
  ): Promise<AssetRequestResponse> {
    const entity = await this.requestRepository.findOne({
      where: { asrId: requestId, entId: entityId },
      relations: ['requester', 'asset'],
    });
    if (!entity) throw new NotFoundException('Asset request not found.');

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return AssetRequestMapper.toResponse(entity);
    if (entity.asrRequesterId === userId) return AssetRequestMapper.toResponse(entity);

    const me = await this.userRepository.findOne({ where: { usrId: userId } });
    if (role === 'MANAGER' && me?.usrUnit && entity.requester?.usrUnit === me.usrUnit) {
      return AssetRequestMapper.toResponse(entity);
    }

    throw new ForbiddenException('Access denied for this request.');
  }

  async getApprovalRequests(
    userId: string,
    role: string,
    entityId: string,
    filters?: { status?: string; request_type?: string },
  ): Promise<AssetRequestResponse[]> {
    const qb = this.requestRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.requester', 'requester')
      .leftJoinAndSelect('req.asset', 'asset')
      .where('req.entId = :entityId', { entityId })
      .andWhere('req.asrDeletedAt IS NULL')
      .andWhere('req.asrStatus IN (:...statuses)', { statuses: ['SUBMITTED', 'L1_APPROVED'] })
      .orderBy('req.asrCreatedAt', 'DESC');

    if (filters?.status) qb.andWhere('req.asrStatus = :status', { status: filters.status });
    if (filters?.request_type) qb.andWhere('req.asrRequestType = :requestType', { requestType: filters.request_type });

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      const entities = await qb.getMany();
      return entities.map(AssetRequestMapper.toResponse);
    }

    if (role === 'MANAGER') {
      const me = await this.userRepository.findOne({ where: { usrId: userId } });
      if (!me?.usrUnit) return [];
      qb.andWhere('requester.usrUnit = :dept', { dept: me.usrUnit });
      const entities = await qb.getMany();
      return entities.map(AssetRequestMapper.toResponse);
    }

    return [];
  }

  async approveOrReject(
    requestId: string,
    dto: ApproveAssetRequestRequest,
    userId: string,
    role: string,
    entityId: string,
  ): Promise<AssetRequestResponse> {
    if (role !== 'MANAGER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only MANAGER or ADMIN can process approvals.');
    }

    const entity = await this.requestRepository.findOne({
      where: { asrId: requestId, entId: entityId },
      relations: ['requester', 'asset'],
    });
    if (!entity) throw new NotFoundException('Asset request not found.');

    const l1Enabled = await this.isL1ApprovalEnabled();

    if (l1Enabled && role === 'MANAGER' && entity.asrStatus === 'L1_APPROVED') {
      throw new ForbiddenException('Manager cannot perform final approval when L1 approval is enabled.');
    }

    if (!['SUBMITTED', 'L1_APPROVED'].includes(entity.asrStatus)) {
      throw new BadRequestException('Request cannot be approved/rejected in current status.');
    }

    if (dto.action === 'REJECT') {
      if (!dto.reject_reason) {
        throw new BadRequestException('Reject reason is required.');
      }
      const fromStatus = entity.asrStatus;
      entity.asrStatus = 'REJECTED';
      await this.requestRepository.save(entity);

      await this.approvalHistoryRepository.save(
        this.approvalHistoryRepository.create({
          asrId: entity.asrId,
          aahStep: l1Enabled && role === 'MANAGER' && fromStatus === 'SUBMITTED' ? 'L1' : 'FINAL',
          aahStatus: 'REJECTED',
          aahApproverId: userId,
          aahComment: dto.reject_reason,
        }),
      );
      await this.logStatusChange(entity.asrId, userId, fromStatus, 'REJECTED', dto.reject_reason);
      await this.sendRejectNotificationEmail(entity, dto.reject_reason);
      await this.createRejectNotificationTodo(entity, dto.reject_reason);
      return AssetRequestMapper.toResponse(entity);
    }

    if (entity.asrAssetSelectMode === 'CATEGORY_ONLY' && !entity.astId) {
      if (!dto.assign_asset_id) {
        throw new BadRequestException('Asset assignment is required for CATEGORY_ONLY request approval.');
      }
      const assignedAsset = await this.getAssetOrThrow(dto.assign_asset_id, entityId);
      await this.validateAssetStatus(assignedAsset);
      await this.validateOverlap(assignedAsset.astId, entity.asrStartAt, entity.asrEndAt, entity.asrId);
      entity.astId = assignedAsset.astId;
      entity.asset = assignedAsset;
    }

    const fromStatus = entity.asrStatus;
    if (l1Enabled && role === 'MANAGER' && entity.asrStatus === 'SUBMITTED') {
      entity.asrStatus = 'L1_APPROVED';
    } else {
      entity.asrStatus = 'FINAL_APPROVED';
      entity.asrFinalApproverId = userId;

      if (entity.asset) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const requestStart = new Date(entity.asrStartAt);
        const requestDay = new Date(requestStart.getFullYear(), requestStart.getMonth(), requestStart.getDate());
        entity.asset.astStatus = requestDay <= todayStart ? 'IN_USE' : 'RESERVED';
        await this.assetRepository.save(entity.asset);
      }
    }

    const saved = await this.requestRepository.save(entity);

    await this.approvalHistoryRepository.save(
      this.approvalHistoryRepository.create({
        asrId: saved.asrId,
        aahStep: l1Enabled && role === 'MANAGER' && fromStatus === 'SUBMITTED' ? 'L1' : 'FINAL',
        aahStatus: 'APPROVED',
        aahApproverId: userId,
        aahComment: dto.comment || null,
      }),
    );

    await this.logStatusChange(saved.asrId, userId, fromStatus, saved.asrStatus, dto.comment || 'Approved');

    return AssetRequestMapper.toResponse(saved);
  }
}
