import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ExpenseRequestEntity } from '../entity/expense-request.entity';
import { ExpenseRequestItemEntity } from '../entity/expense-request-item.entity';
import { ExpenseAttachmentEntity } from '../entity/expense-attachment.entity';
import { CreateExpenseRequestDto } from '../dto/create-expense-request.dto';
import { UpdateExpenseRequestDto } from '../dto/update-expense-request.dto';
import { QueryExpenseRequestDto } from '../dto/query-expense-request.dto';
import { ExpenseNumberService } from './expense-number.service';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { UserEntity } from '../../auth/entity/user.entity';

const STATUS_ORDER = ['DRAFT', 'PENDING', 'APPROVED_L1', 'APPROVED', 'EXECUTED', 'REJECTED', 'CANCELLED'];

@Injectable()
export class ExpenseRequestService {
  constructor(
    @InjectRepository(ExpenseRequestEntity)
    private readonly repo: Repository<ExpenseRequestEntity>,
    @InjectRepository(ExpenseRequestItemEntity)
    private readonly itemRepo: Repository<ExpenseRequestItemEntity>,
    @InjectRepository(ExpenseAttachmentEntity)
    private readonly attachRepo: Repository<ExpenseAttachmentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
    private readonly numberService: ExpenseNumberService,
  ) {}

  private mapToListItem(entity: ExpenseRequestEntity, requesterName: string) {
    return {
      id: entity.exrId,
      requestNumber: entity.exrNumber,
      title: entity.exrTitle,
      type: entity.exrType,
      frequency: entity.exrFrequency,
      category: entity.exrCategory,
      status: entity.exrStatus,
      totalAmount: Number(entity.exrTotalAmount ?? 0),
      currency: entity.exrCurrency,
      requestDate: entity.exrExpenseDate,
      isRecurring: entity.exrFrequency === 'RECURRING',
      recurringType: entity.exrPeriod ?? 'NONE',
      requesterId: entity.exrRequesterId,
      requesterName,
      approver1Id: entity.exrApprover1Id,
      approver2Id: entity.exrApprover2Id,
      createdAt: entity.exrCreatedAt,
      updatedAt: entity.exrUpdatedAt,
    };
  }

  async findAll(entityId: string, user: UserPayload, query: QueryExpenseRequestDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.repo.createQueryBuilder('e')
      .where('e.entId = :entityId', { entityId })
      .orderBy('e.exrCreatedAt', 'DESC')
      .skip(skip)
      .take(limit);

    // view=my: 본인 작성 건만 조회  
    if (query.view === 'my') {
      qb.andWhere('e.exrRequesterId = :myUid', { myUid: user.userId });
    } else {
      // MEMBER는 자신이 작성했거나 승인자인 건만 조회
      const roleLevel = { VIEWER: 1, MEMBER: 2, MANAGER: 3, MASTER: 4, ADMIN: 5, SUPER_ADMIN: 6 }[user.role] || 1;
      if (roleLevel <= 2) {
        qb.andWhere('(e.exrRequesterId = :uid OR e.exrApprover1Id = :uid OR e.exrApprover2Id = :uid)', {
          uid: user.userId,
        });
      }
    }

    if (query.status) qb.andWhere('e.exrStatus = :status', { status: query.status });
    if (query.category) qb.andWhere('e.exrCategory = :category', { category: query.category });
    if (query.frequency) qb.andWhere('e.exrFrequency = :frequency', { frequency: query.frequency });
    if (query.requester_id) qb.andWhere('e.exrRequesterId = :rid', { rid: query.requester_id });
    if (query.keyword) {
      qb.andWhere('e.exrTitle ILIKE :kw', { kw: `%${query.keyword}%` });
    }
    if (query.year_month) {
      const [y, m] = query.year_month.split('-');
      const start = `${y}-${m}-01`;
      const end = new Date(Number(y), Number(m), 0).toISOString().split('T')[0];
      qb.andWhere('e.exrExpenseDate BETWEEN :start AND :end', { start, end });
    }

    const [data, total] = await qb.getManyAndCount();

    // requester 이름 일괄 조회
    const requesterIds = [...new Set(data.map((e) => e.exrRequesterId))];
    const users = requesterIds.length
      ? await this.userRepo.find({ where: { usrId: In(requesterIds) }, select: ['usrId', 'usrName'] })
      : [];
    const userMap = new Map(users.map((u) => [u.usrId, u.usrName]));

    const mappedData = data.map((e) => this.mapToListItem(e, userMap.get(e.exrRequesterId) ?? ''));
    return { data: mappedData, total, page, limit };
  }

  async findOne(id: string, entityId: string): Promise<ExpenseRequestEntity> {
    const entity = await this.repo.findOne({
      where: { exrId: id, entId: entityId },
      relations: ['items', 'approvals', 'attachments', 'executions'],
    });
    if (!entity) throw new NotFoundException(`지출결의서를 찾을 수 없습니다. (${id})`);
    return entity;
  }

  async findOneForApi(id: string, entityId: string) {
    const entity = await this.repo.findOne({
      where: { exrId: id, entId: entityId },
      relations: ['items', 'approvals', 'attachments', 'executions'],
    });
    if (!entity) throw new NotFoundException(`지출결의서를 찾을 수 없습니다. (${id})`);

    // 사용자 이름 일괄 조회
    const userIds = [
      entity.exrRequesterId,
      entity.exrApprover1Id,
      entity.exrApprover2Id,
      ...entity.approvals.map((a) => a.eapApproverId),
      ...(entity.executions?.map((e) => e.exdExecutorId) ?? []),
    ].filter(Boolean) as string[];
    const uniqueIds = [...new Set(userIds)];
    const users = uniqueIds.length
      ? await this.userRepo.find({ where: { usrId: In(uniqueIds) }, select: ['usrId', 'usrName'] })
      : [];
    const userMap = new Map(users.map((u) => [u.usrId, u.usrName]));

    // 승인 목록 (실제 레코드 + 대기 중인 승인자)
    const approvals: object[] = [];
    for (const level of [1, 2]) {
      const approverId = level === 1 ? entity.exrApprover1Id : entity.exrApprover2Id;
      if (!approverId) continue;
      const record = entity.approvals.find((a) => a.eapLevel === level);
      if (record) {
        approvals.push({
          id: record.eapId,
          approvalStep: record.eapLevel,
          approverId: record.eapApproverId,
          approverName: userMap.get(record.eapApproverId) ?? '',
          status: record.eapAction,
          comment: record.eapComment,
          isSelfApproval: record.eapIsSelfApproval,
          decidedAt: record.eapActionedAt?.toISOString() ?? null,
        });
      } else {
        approvals.push({
          id: `pending-${level}`,
          approvalStep: level,
          approverId,
          approverName: userMap.get(approverId) ?? '',
          status: 'PENDING',
          comment: null,
          isSelfApproval: approverId === entity.exrRequesterId,
          decidedAt: null,
        });
      }
    }

    const exec = entity.executions?.[0] ?? null;

    return {
      id: entity.exrId,
      requestNumber: entity.exrNumber,
      title: entity.exrTitle,
      type: entity.exrType,
      frequency: entity.exrFrequency,
      category: entity.exrCategory,
      status: entity.exrStatus,
      totalAmount: Number(entity.exrTotalAmount ?? 0),
      currency: entity.exrCurrency,
      requestDate: entity.exrExpenseDate,
      requiredDate: entity.exrEndDate ?? null,
      isRecurring: entity.exrFrequency === 'RECURRING',
      recurringType: entity.exrPeriod ?? 'NONE',
      requesterId: entity.exrRequesterId,
      requesterName: userMap.get(entity.exrRequesterId) ?? '',
      approver1Id: entity.exrApprover1Id,
      approver2Id: entity.exrApprover2Id,
      parentRequestId: entity.exrParentId,
      memo: entity.exrDescription,
      reason: entity.exrReason,
      period: entity.exrPeriod,
      startDate: entity.exrStartDate,
      endDate: entity.exrEndDate,
      paymentDay: entity.exrPaymentDay,
      items: (entity.items ?? []).map((it) => ({
        id: it.eriId,
        name: it.eriName,
        category: 'OTHER',
        quantity: Number(it.eriQuantity),
        unitPrice: Number(it.eriUnitPrice),
        amount: Number(it.eriQuantity) * Number(it.eriUnitPrice) + Number(it.eriTaxAmount ?? 0),
        description: it.eriNote,
      })),
      approvals,
      execution: exec
        ? {
            id: exec.exdId,
            executionDate: exec.exdExecutedAt,
            executionMethod: exec.exdMethod,
            totalAmount: Number(exec.exdAmount ?? 0),
            receiptType: exec.exdReceiptType,
            receiptUrl: exec.exdReceiptLinkUrl,
            memo: exec.exdNote,
            executedById: exec.exdExecutorId,
            executedByName: userMap.get(exec.exdExecutorId) ?? '',
            createdAt: exec.exdCreatedAt?.toISOString() ?? '',
          }
        : null,
      attachments: (entity.attachments ?? []).map((att) => ({
        id: att.eatId,
        fileName: att.eatFileName ?? att.eatLinkTitle,
        fileUrl: att.eatLinkUrl ?? '',
        fileSize: att.eatFileSize,
        mimeType: att.eatMimeType,
        isLink: att.eatType === 'LINK',
        createdAt: att.eatCreatedAt?.toISOString() ?? '',
      })),
      createdAt: entity.exrCreatedAt,
      updatedAt: entity.exrUpdatedAt,
    };
  }

  async create(dto: CreateExpenseRequestDto, user: UserPayload, entityId: string): Promise<ExpenseRequestEntity> {
    return this.dataSource.transaction(async (manager) => {
      const request = manager.create(ExpenseRequestEntity, {
        entId: entityId,
        exrRequesterId: user.userId,
        exrTitle: dto.title,
        exrType: dto.type as any,
        exrFrequency: (dto.frequency as any) || 'ONE_TIME',
        exrCategory: dto.category as any,
        exrExpenseDate: dto.expense_date,
        exrDescription: dto.description || null,
        exrReason: dto.reason || null,
        exrCurrency: dto.currency || 'VND',
        exrStatus: 'DRAFT',
        exrApprover1Id: dto.approver1_id || null,
        exrApprover2Id: dto.approver2_id || null,
        exrPeriod: (dto.period as any) || null,
        exrStartDate: dto.start_date || null,
        exrEndDate: dto.end_date || null,
        exrPaymentDay: dto.payment_day || null,
      });

      const saved = await manager.save(request);

      // 항목 저장
      if (dto.items?.length) {
        const items = dto.items.map((item, idx) =>
          manager.create(ExpenseRequestItemEntity, {
            exrId: saved.exrId,
            eriName: item.name,
            eriQuantity: item.quantity,
            eriUnitPrice: item.unit_price,
            eriTaxAmount: item.tax_amount || 0,
            eriCurrency: item.currency || dto.currency || 'VND',
            eriNote: item.note || null,
            eriSortOrder: item.sort_order ?? idx,
          }),
        );
        await manager.save(items);

        // 합계 업데이트
        const total = dto.items.reduce(
          (sum, i) => sum + i.unit_price * i.quantity + (i.tax_amount || 0),
          0,
        );
        await manager.update(ExpenseRequestEntity, saved.exrId, { exrTotalAmount: total });
        saved.exrTotalAmount = total;
      }

      return saved;
    });
  }

  async update(id: string, dto: UpdateExpenseRequestDto, user: UserPayload, entityId: string): Promise<ExpenseRequestEntity> {
    const entity = await this.findOne(id, entityId);

    if (!['DRAFT', 'REJECTED'].includes(entity.exrStatus)) {
      throw new BadRequestException('DRAFT 또는 REJECTED 상태에서만 수정 가능합니다.');
    }
    if (entity.exrRequesterId !== user.userId) {
      throw new ForbiddenException('본인이 작성한 결의서만 수정할 수 있습니다.');
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.title !== undefined) entity.exrTitle = dto.title;
      if (dto.type !== undefined) entity.exrType = dto.type as any;
      if (dto.frequency !== undefined) entity.exrFrequency = dto.frequency as any;
      if (dto.category !== undefined) entity.exrCategory = dto.category as any;
      if (dto.expense_date !== undefined) entity.exrExpenseDate = dto.expense_date;
      if (dto.description !== undefined) entity.exrDescription = dto.description || null;
      if (dto.reason !== undefined) entity.exrReason = dto.reason || null;
      if (dto.currency !== undefined) entity.exrCurrency = dto.currency;
      if (dto.approver1_id !== undefined) entity.exrApprover1Id = dto.approver1_id || null;
      if (dto.approver2_id !== undefined) entity.exrApprover2Id = dto.approver2_id || null;
      if (dto.period !== undefined) entity.exrPeriod = (dto.period as any) || null;
      if (dto.start_date !== undefined) entity.exrStartDate = dto.start_date || null;
      if (dto.end_date !== undefined) entity.exrEndDate = dto.end_date || null;
      if (dto.payment_day !== undefined) entity.exrPaymentDay = dto.payment_day || null;

      if (dto.items?.length) {
        // 기존 항목 삭제 후 재생성
        await manager.delete(ExpenseRequestItemEntity, { exrId: id });
        const items = dto.items.map((item, idx) =>
          manager.create(ExpenseRequestItemEntity, {
            exrId: id,
            eriName: item.name,
            eriQuantity: item.quantity,
            eriUnitPrice: item.unit_price,
            eriTaxAmount: item.tax_amount || 0,
            eriCurrency: item.currency || entity.exrCurrency,
            eriNote: item.note || null,
            eriSortOrder: item.sort_order ?? idx,
          }),
        );
        await manager.save(items);

        entity.exrTotalAmount = dto.items.reduce(
          (sum, i) => sum + i.unit_price * i.quantity + (i.tax_amount || 0),
          0,
        );
      }

      return manager.save(entity);
    });
  }

  async remove(id: string, user: UserPayload, entityId: string): Promise<void> {
    const entity = await this.findOne(id, entityId);
    if (entity.exrStatus !== 'DRAFT') {
      throw new BadRequestException('DRAFT 상태에서만 삭제 가능합니다.');
    }
    if (entity.exrRequesterId !== user.userId) {
      throw new ForbiddenException('본인이 작성한 결의서만 삭제할 수 있습니다.');
    }
    await this.repo.softDelete(id);
  }

  async cancel(id: string, user: UserPayload, entityId: string): Promise<ExpenseRequestEntity> {
    const entity = await this.findOne(id, entityId);
    if (!['DRAFT', 'PENDING'].includes(entity.exrStatus)) {
      throw new BadRequestException('DRAFT 또는 PENDING 상태에서만 취소 가능합니다.');
    }
    if (entity.exrRequesterId !== user.userId) {
      throw new ForbiddenException('본인이 작성한 결의서만 취소할 수 있습니다.');
    }
    entity.exrStatus = 'CANCELLED';
    return this.repo.save(entity);
  }

  async getStats(entityId: string) {
    const qb = this.repo.createQueryBuilder('e').where('e.entId = :entityId', { entityId });
    const total = await qb.getCount();
    const byStatus = await qb
      .select('e.exrStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.exrStatus')
      .getRawMany();
    return { total, byStatus };
  }
}
