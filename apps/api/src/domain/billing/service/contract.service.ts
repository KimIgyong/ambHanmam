import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository, DeepPartial } from 'typeorm';
import { ContractEntity } from '../entity/contract.entity';
import { ContractMilestoneEntity } from '../entity/contract-milestone.entity';
import { ContractHistoryEntity } from '../entity/contract-history.entity';
import { PaymentScheduleEntity } from '../entity/payment-schedule.entity';
import { PartnerEntity } from '../entity/partner.entity';
import { CreateContractRequest } from '../dto/request/create-contract.request';
import { UpdateContractRequest } from '../dto/request/update-contract.request';
import { ContractMapper } from '../mapper/contract.mapper';
import { BilContractResponse } from '@amb/types';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE', 'TERMINATED'],
  ACTIVE: ['EXPIRING', 'ENDED', 'RENEWED', 'TERMINATED', 'LIQUIDATED'],
  EXPIRING: ['RENEWED', 'EXPIRED', 'ENDED', 'TERMINATED', 'LIQUIDATED'],
  EXPIRED: ['RENEWED', 'ENDED'],
  ENDED: ['LIQUIDATED'],
  RENEWED: [],
  TERMINATED: [],
  LIQUIDATED: [],
};

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(ContractMilestoneEntity)
    private readonly milestoneRepo: Repository<ContractMilestoneEntity>,
    @InjectRepository(ContractHistoryEntity)
    private readonly historyRepo: Repository<ContractHistoryEntity>,
    @InjectRepository(PaymentScheduleEntity)
    private readonly scheduleRepo: Repository<PaymentScheduleEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepo: Repository<PartnerEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(
    entityId: string,
    query?: { direction?: string; category?: string; type?: string; status?: string; partner_id?: string; search?: string; page?: number; size?: number },
  ) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query?.size) || 50));

    const qb = this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.partner', 'p')
      .leftJoinAndSelect('c.milestones', 'm')
      .leftJoinAndSelect('c.paymentSchedules', 'ps')
      .where('c.entId = :entityId', { entityId })
      .orderBy('c.ctrCreatedAt', 'DESC')
      .addOrderBy('m.mstSeq', 'ASC');

    if (query?.direction) qb.andWhere('c.ctrDirection = :direction', { direction: query.direction });
    if (query?.category) qb.andWhere('c.ctrCategory = :category', { category: query.category });
    if (query?.type) qb.andWhere('c.ctrType = :type', { type: query.type });
    if (query?.status) qb.andWhere('c.ctrStatus = :status', { status: query.status });
    if (query?.partner_id) qb.andWhere('c.ptnId = :partnerId', { partnerId: query.partner_id });
    if (query?.search) {
      qb.andWhere('(c.ctrTitle ILIKE :search OR p.ptnCompanyName ILIKE :search OR p.ptnCode ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.skip((page - 1) * size).take(size);
    const [contracts, totalCount] = await qb.getManyAndCount();
    const totalPages = Math.ceil(totalCount / size);

    return {
      data: contracts.map(ContractMapper.toResponse),
      pagination: { page, size, totalCount, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    };
  }

  async findById(id: string, entityId: string): Promise<BilContractResponse> {
    const contract = await this.contractRepo.findOne({
      where: { ctrId: id, entId: entityId },
      relations: ['partner', 'milestones', 'paymentSchedules'],
      order: { milestones: { mstSeq: 'ASC' }, paymentSchedules: { pmsSeq: 'ASC' } },
    });
    if (!contract) {
      throw new NotFoundException(ERROR_CODE.CONTRACT_NOT_FOUND.message);
    }
    return ContractMapper.toResponse(contract);
  }

  async create(dto: CreateContractRequest, entityId: string): Promise<BilContractResponse> {
    const partner = await this.partnerRepo.findOne({ where: { ptnId: dto.partner_id, entId: entityId } });
    if (!partner) {
      throw new NotFoundException(ERROR_CODE.PARTNER_NOT_FOUND.message);
    }

    const contract = this.contractRepo.create({
      entId: entityId,
      ptnId: dto.partner_id,
      ctrDirection: dto.direction,
      ctrCategory: dto.category,
      ctrType: dto.type,
      ctrTitle: dto.title,
      ctrDescription: dto.description || null,
      ctrStartDate: dto.start_date,
      ctrEndDate: dto.end_date || null,
      ctrAmount: dto.amount || 0,
      ctrCurrency: dto.currency || partner.ptnDefaultCurrency,
      ctrAutoRenew: dto.auto_renew || false,
      ctrBillingDay: dto.billing_day || null,
      ctrBillingPeriod: dto.billing_period || null,
      ctrAutoGenerate: dto.auto_generate || false,
      ctrUnitPrice: dto.unit_price || null,
      ctrUnitDesc: dto.unit_desc || null,
      ctrPredecessorId: dto.predecessor_id || null,
      ctrNote: dto.note || null,
      ctrGsheetUrl: dto.gsheet_url || null,
      ctrGsheetTabPattern: dto.gsheet_tab_pattern || null,
      ctrAssignedUserId: dto.assigned_user_id || null,
      ctrPaymentType: dto.payment_type || null,
      ctrBillingAmount: dto.billing_amount ?? null,
    } as DeepPartial<ContractEntity>);

    const saved: ContractEntity = await this.contractRepo.save(contract as ContractEntity);

    if (dto.milestones?.length) {
      const milestones = dto.milestones.map((m) =>
        this.milestoneRepo.create({
          ctrId: saved.ctrId,
          mstSeq: m.seq,
          mstLabel: m.label,
          mstPercentage: m.percentage,
          mstAmount: m.amount,
          mstDueDate: m.due_date || null,
        } as DeepPartial<ContractMilestoneEntity>),
      );
      await this.milestoneRepo.save(milestones as ContractMilestoneEntity[]);
    }

    if (dto.payment_schedules?.length) {
      const schedules = dto.payment_schedules.map((s) =>
        this.scheduleRepo.create({
          ctrId: saved.ctrId,
          pmsSeq: s.seq,
          pmsBillingDate: s.billing_date,
          pmsBillingPeriod: s.billing_period || null,
          pmsAmount: s.amount,
        } as DeepPartial<PaymentScheduleEntity>),
      );
      await this.scheduleRepo.save(schedules as PaymentScheduleEntity[]);
    }

    this.eventEmitter.emit('module.data.created', {
      module: 'billing',
      type: 'DOC',
      refId: saved.ctrId,
      title: saved.ctrTitle,
      content: [saved.ctrTitle, saved.ctrDescription, saved.ctrNote, saved.ctrCategory, partner.ptnCompanyName].filter(Boolean).join(' '),
      ownerId: saved.ctrAssignedUserId || '',
      entityId,
    });

    return this.findById(saved.ctrId, entityId);
  }

  async update(id: string, dto: UpdateContractRequest, entityId: string, changedBy?: string): Promise<BilContractResponse> {
    const contract = await this.contractRepo.findOne({
      where: { ctrId: id, entId: entityId },
      relations: ['milestones', 'paymentSchedules'],
    });
    if (!contract) {
      throw new NotFoundException(ERROR_CODE.CONTRACT_NOT_FOUND.message);
    }

    // Track changes for audit history
    const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];
    const track = (field: string, oldVal: unknown, newVal: unknown) => {
      const o = oldVal == null ? null : String(oldVal);
      const n = newVal == null ? null : String(newVal);
      if (o !== n) changes.push({ field, oldValue: o, newValue: n });
    };

    if (dto.status && dto.status !== contract.ctrStatus) {
      const allowed = VALID_TRANSITIONS[contract.ctrStatus] || [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(ERROR_CODE.CONTRACT_INVALID_TRANSITION.message);
      }
      track('status', contract.ctrStatus, dto.status);
      contract.ctrStatus = dto.status;
    }

    if (dto.title !== undefined) { track('title', contract.ctrTitle, dto.title); contract.ctrTitle = dto.title; }
    if (dto.description !== undefined) { track('description', contract.ctrDescription, dto.description); contract.ctrDescription = dto.description; }
    if (dto.end_date !== undefined) { track('end_date', contract.ctrEndDate, dto.end_date); contract.ctrEndDate = dto.end_date; }
    if (dto.amount !== undefined) { track('amount', contract.ctrAmount, dto.amount); contract.ctrAmount = dto.amount; }
    if (dto.currency !== undefined) { track('currency', contract.ctrCurrency, dto.currency); contract.ctrCurrency = dto.currency; }
    if (dto.auto_renew !== undefined) { track('auto_renew', contract.ctrAutoRenew, dto.auto_renew); contract.ctrAutoRenew = dto.auto_renew; }
    if (dto.billing_day !== undefined) { track('billing_day', contract.ctrBillingDay, dto.billing_day); contract.ctrBillingDay = dto.billing_day; }
    if (dto.billing_period !== undefined) { track('billing_period', contract.ctrBillingPeriod, dto.billing_period); contract.ctrBillingPeriod = dto.billing_period; }
    if (dto.auto_generate !== undefined) { track('auto_generate', contract.ctrAutoGenerate, dto.auto_generate); contract.ctrAutoGenerate = dto.auto_generate; }
    if (dto.unit_price !== undefined) { track('unit_price', contract.ctrUnitPrice, dto.unit_price); contract.ctrUnitPrice = dto.unit_price; }
    if (dto.unit_desc !== undefined) { track('unit_desc', contract.ctrUnitDesc, dto.unit_desc); contract.ctrUnitDesc = dto.unit_desc; }
    if (dto.note !== undefined) { track('note', contract.ctrNote, dto.note); contract.ctrNote = dto.note; }
    if (dto.gsheet_url !== undefined) { track('gsheet_url', contract.ctrGsheetUrl, dto.gsheet_url); contract.ctrGsheetUrl = dto.gsheet_url; }
    if (dto.gsheet_tab_pattern !== undefined) { track('gsheet_tab_pattern', contract.ctrGsheetTabPattern, dto.gsheet_tab_pattern); contract.ctrGsheetTabPattern = dto.gsheet_tab_pattern; }
    if (dto.assigned_user_id !== undefined) { track('assigned_user_id', contract.ctrAssignedUserId, dto.assigned_user_id); contract.ctrAssignedUserId = dto.assigned_user_id; }
    if (dto.payment_type !== undefined) { track('payment_type', contract.ctrPaymentType, dto.payment_type); contract.ctrPaymentType = dto.payment_type; }
    if (dto.billing_amount !== undefined) { track('billing_amount', contract.ctrBillingAmount, dto.billing_amount); contract.ctrBillingAmount = dto.billing_amount; }

    await this.contractRepo.save(contract);

    // Save audit history
    if (changes.length > 0) {
      const historyEntries = changes.map((c) =>
        this.historyRepo.create({
          ctrId: id,
          entId: entityId,
          hstField: c.field,
          hstOldValue: c.oldValue,
          hstNewValue: c.newValue,
          hstChangedBy: changedBy || null,
        } as DeepPartial<ContractHistoryEntity>),
      );
      await this.historyRepo.save(historyEntries as ContractHistoryEntity[]);
    }

    if (changes.length > 0) {
      this.eventEmitter.emit('module.data.updated', {
        module: 'billing',
        type: 'DOC',
        refId: id,
        title: contract.ctrTitle,
        content: [contract.ctrTitle, contract.ctrDescription, contract.ctrNote, contract.ctrCategory].filter(Boolean).join(' '),
        ownerId: changedBy || contract.ctrAssignedUserId || '',
        entityId,
      });
    }

    if (dto.milestones !== undefined) {
      await this.milestoneRepo.delete({ ctrId: id });
      if (dto.milestones.length) {
        const milestones = dto.milestones.map((m) =>
          this.milestoneRepo.create({
            ctrId: id,
            mstSeq: m.seq,
            mstLabel: m.label,
            mstPercentage: m.percentage,
            mstAmount: m.amount,
            mstDueDate: m.due_date || null,
            mstStatus: m.status || 'PENDING',
          } as DeepPartial<ContractMilestoneEntity>),
        );
        await this.milestoneRepo.save(milestones as ContractMilestoneEntity[]);
      }
    }

    if (dto.payment_schedules !== undefined) {
      await this.scheduleRepo.delete({ ctrId: id });
      if (dto.payment_schedules.length) {
        const schedules = dto.payment_schedules.map((s) =>
          this.scheduleRepo.create({
            ctrId: id,
            pmsSeq: s.seq,
            pmsBillingDate: s.billing_date,
            pmsBillingPeriod: s.billing_period || null,
            pmsAmount: s.amount,
            pmsStatus: s.status || 'PENDING',
          } as DeepPartial<PaymentScheduleEntity>),
        );
        await this.scheduleRepo.save(schedules as PaymentScheduleEntity[]);
      }
    }

    return this.findById(id, entityId);
  }

  async findHistory(id: string, entityId: string) {
    const contract = await this.contractRepo.findOne({ where: { ctrId: id, entId: entityId } });
    if (!contract) {
      throw new NotFoundException(ERROR_CODE.CONTRACT_NOT_FOUND.message);
    }

    const history = await this.historyRepo.find({
      where: { ctrId: id, entId: entityId },
      order: { hstChangedAt: 'DESC' },
    });

    return history.map((h) => ({
      id: h.hstId,
      field: h.hstField,
      oldValue: h.hstOldValue,
      newValue: h.hstNewValue,
      changedBy: h.hstChangedBy,
      changedAt: h.hstChangedAt,
    }));
  }

  async findExpiring(entityId: string, days: number = 30) {
    const today = new Date().toISOString().substring(0, 10);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const endDate = futureDate.toISOString().substring(0, 10);

    const contracts = await this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.partner', 'p')
      .where('c.entId = :entityId', { entityId })
      .andWhere('c.ctrStatus IN (:...statuses)', { statuses: ['ACTIVE', 'EXPIRING'] })
      .andWhere('c.ctrEndDate IS NOT NULL')
      .andWhere('c.ctrEndDate >= :today AND c.ctrEndDate <= :endDate', { today, endDate })
      .orderBy('c.ctrEndDate', 'ASC')
      .getMany();

    return contracts.map((c) => {
      const daysRemaining = Math.ceil(
        (new Date(c.ctrEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      return {
        contractId: c.ctrId,
        title: c.ctrTitle,
        partnerName: c.partner?.ptnCompanyName || '',
        partnerCode: c.partner?.ptnCode || '',
        direction: c.ctrDirection,
        endDate: c.ctrEndDate,
        amount: Number(c.ctrAmount),
        currency: c.ctrCurrency,
        autoRenew: c.ctrAutoRenew,
        daysRemaining,
        urgency: daysRemaining <= 7 ? 'CRITICAL' : daysRemaining <= 14 ? 'HIGH' : daysRemaining <= 30 ? 'MEDIUM' : 'LOW',
      };
    });
  }

  async delete(id: string, entityId: string): Promise<void> {
    const contract = await this.contractRepo.findOne({ where: { ctrId: id, entId: entityId } });
    if (!contract) {
      throw new NotFoundException(ERROR_CODE.CONTRACT_NOT_FOUND.message);
    }
    await this.contractRepo.softRemove(contract);
  }

  async renewContract(id: string, entityId: string): Promise<BilContractResponse> {
    const old = await this.contractRepo.findOne({
      where: { ctrId: id, entId: entityId },
      relations: ['milestones'],
    });
    if (!old) {
      throw new NotFoundException(ERROR_CODE.CONTRACT_NOT_FOUND.message);
    }

    const allowed = VALID_TRANSITIONS[old.ctrStatus] || [];
    if (!allowed.includes('RENEWED')) {
      throw new BadRequestException(ERROR_CODE.CONTRACT_INVALID_TRANSITION.message);
    }

    old.ctrStatus = 'RENEWED';
    await this.contractRepo.save(old);

    const newStartDate = old.ctrEndDate || old.ctrStartDate;
    const newContract = this.contractRepo.create({
      entId: entityId,
      ptnId: old.ptnId,
      ctrDirection: old.ctrDirection,
      ctrCategory: old.ctrCategory,
      ctrType: old.ctrType,
      ctrTitle: old.ctrTitle,
      ctrDescription: old.ctrDescription,
      ctrStartDate: newStartDate,
      ctrEndDate: undefined,
      ctrAmount: old.ctrAmount,
      ctrCurrency: old.ctrCurrency,
      ctrAutoRenew: old.ctrAutoRenew,
      ctrBillingDay: old.ctrBillingDay,
      ctrBillingPeriod: old.ctrBillingPeriod,
      ctrAutoGenerate: old.ctrAutoGenerate,
      ctrUnitPrice: old.ctrUnitPrice,
      ctrUnitDesc: old.ctrUnitDesc,
      ctrPredecessorId: old.ctrId,
      ctrPaymentType: old.ctrPaymentType,
      ctrBillingAmount: old.ctrBillingAmount,
      ctrNote: undefined,
    } as DeepPartial<ContractEntity>);

    const saved: ContractEntity = await this.contractRepo.save(newContract as ContractEntity);
    return this.findById(saved.ctrId, entityId);
  }
}
