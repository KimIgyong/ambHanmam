import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, LessThanOrEqual } from 'typeorm';
import { SvcSubscriptionEntity } from '../entity/subscription.entity';
import { SvcSubscriptionHistoryEntity } from '../entity/subscription-history.entity';
import { CreateSubscriptionRequest } from '../dto/request/create-subscription.request';
import { UpdateSubscriptionRequest } from '../dto/request/update-subscription.request';
import { SubscriptionMapper } from '../mapper/subscription.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { SvcSubscriptionResponse, SvcSubscriptionHistoryResponse } from '@amb/types';

const VALID_TRANSITIONS: Record<string, string[]> = {
  TRIAL: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['SUSPENDED', 'EXPIRING', 'CANCELLED'],
  SUSPENDED: ['ACTIVE', 'CANCELLED'],
  EXPIRING: ['ACTIVE', 'EXPIRED'],
  EXPIRED: ['ACTIVE'],
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SvcSubscriptionEntity)
    private readonly subscriptionRepo: Repository<SvcSubscriptionEntity>,
    @InjectRepository(SvcSubscriptionHistoryEntity)
    private readonly historyRepo: Repository<SvcSubscriptionHistoryEntity>,
  ) {}

  private async addHistory(subId: string, action: string, userId?: string, field?: string, oldValue?: string, newValue?: string, note?: string) {
    const history = this.historyRepo.create({
      subId,
      sbhAction: action,
      sbhField: field || undefined,
      sbhOldValue: oldValue || undefined,
      sbhNewValue: newValue || undefined,
      sbhChangedBy: userId || undefined,
      sbhNote: note || undefined,
    } as DeepPartial<SvcSubscriptionHistoryEntity>);
    await this.historyRepo.save(history as SvcSubscriptionHistoryEntity);
  }

  async findAll(params?: {
    service?: string; status?: string; client?: string; expiring?: string;
  }): Promise<SvcSubscriptionResponse[]> {
    const qb = this.subscriptionRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.client', 'client')
      .leftJoinAndSelect('sub.service', 'service')
      .leftJoinAndSelect('sub.plan', 'plan');

    if (params?.service) {
      qb.andWhere('sub.svcId = :service', { service: params.service });
    }
    if (params?.status) {
      qb.andWhere('sub.subStatus = :status', { status: params.status });
    }
    if (params?.client) {
      qb.andWhere('sub.cliId = :client', { client: params.client });
    }
    if (params?.expiring === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      qb.andWhere('sub.subEndDate IS NOT NULL')
        .andWhere('sub.subEndDate <= :expDate', { expDate: thirtyDaysFromNow.toISOString().split('T')[0] })
        .andWhere('sub.subStatus IN (:...activeStatuses)', { activeStatuses: ['ACTIVE', 'EXPIRING'] });
    }

    qb.orderBy('sub.subCreatedAt', 'DESC');
    const entities = await qb.getMany();
    return entities.map(SubscriptionMapper.toResponse);
  }

  async findById(id: string): Promise<SvcSubscriptionResponse> {
    const entity = await this.subscriptionRepo.findOne({
      where: { subId: id },
      relations: ['client', 'service', 'plan'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SUBSCRIPTION_NOT_FOUND.message);
    }

    const history = await this.historyRepo.find({
      where: { subId: id },
      order: { sbhCreatedAt: 'DESC' },
    });

    const response = SubscriptionMapper.toResponse(entity);
    response.history = history.map(SubscriptionMapper.historyToResponse);
    return response;
  }

  async create(dto: CreateSubscriptionRequest, userId: string): Promise<SvcSubscriptionResponse> {
    const entity = this.subscriptionRepo.create({
      cliId: dto.client_id,
      svcId: dto.service_id,
      splId: dto.plan_id || undefined,
      subStatus: dto.status || 'ACTIVE',
      subStartDate: dto.start_date,
      subEndDate: dto.end_date || undefined,
      subTrialEndDate: dto.trial_end_date || undefined,
      subBillingCycle: dto.billing_cycle || undefined,
      subPrice: dto.price ?? undefined,
      subCurrency: dto.currency || 'USD',
      subDiscountRate: dto.discount_rate ?? 0,
      subMaxUsers: dto.max_users || undefined,
      subActualUsers: dto.actual_users ?? 0,
      subContractId: dto.contract_id || undefined,
      subAutoRenew: dto.auto_renew ?? true,
      subNote: dto.note || undefined,
    } as DeepPartial<SvcSubscriptionEntity>);

    const saved: SvcSubscriptionEntity = await this.subscriptionRepo.save(entity as SvcSubscriptionEntity);
    await this.addHistory(saved.subId, 'CREATED', userId);

    // Reload with relations
    const full = await this.subscriptionRepo.findOne({
      where: { subId: saved.subId },
      relations: ['client', 'service', 'plan'],
    });
    return SubscriptionMapper.toResponse(full!);
  }

  async update(id: string, dto: UpdateSubscriptionRequest, userId: string): Promise<SvcSubscriptionResponse> {
    const entity = await this.subscriptionRepo.findOne({
      where: { subId: id },
      relations: ['client', 'service', 'plan'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SUBSCRIPTION_NOT_FOUND.message);
    }

    if (dto.plan_id !== undefined && dto.plan_id !== entity.splId) {
      await this.addHistory(id, 'PLAN_CHANGED', userId, 'plan_id', entity.splId, dto.plan_id);
      entity.splId = dto.plan_id;
    }
    if (dto.price !== undefined && dto.price !== Number(entity.subPrice)) {
      await this.addHistory(id, 'PRICE_CHANGED', userId, 'price', String(entity.subPrice), String(dto.price));
      entity.subPrice = dto.price;
    }

    if (dto.end_date !== undefined) entity.subEndDate = dto.end_date;
    if (dto.trial_end_date !== undefined) entity.subTrialEndDate = dto.trial_end_date;
    if (dto.billing_cycle !== undefined) entity.subBillingCycle = dto.billing_cycle;
    if (dto.currency !== undefined) entity.subCurrency = dto.currency;
    if (dto.discount_rate !== undefined) entity.subDiscountRate = dto.discount_rate;
    if (dto.max_users !== undefined) entity.subMaxUsers = dto.max_users;
    if (dto.actual_users !== undefined) entity.subActualUsers = dto.actual_users;
    if (dto.contract_id !== undefined) entity.subContractId = dto.contract_id;
    if (dto.auto_renew !== undefined) entity.subAutoRenew = dto.auto_renew;
    if (dto.note !== undefined) entity.subNote = dto.note;

    const saved = await this.subscriptionRepo.save(entity);
    const full = await this.subscriptionRepo.findOne({
      where: { subId: saved.subId },
      relations: ['client', 'service', 'plan'],
    });
    return SubscriptionMapper.toResponse(full!);
  }

  async cancel(id: string, reason: string, userId: string): Promise<SvcSubscriptionResponse> {
    const entity = await this.subscriptionRepo.findOne({
      where: { subId: id },
      relations: ['client', 'service', 'plan'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SUBSCRIPTION_NOT_FOUND.message);
    }

    const allowed = VALID_TRANSITIONS[entity.subStatus];
    if (!allowed || !allowed.includes('CANCELLED')) {
      throw new BadRequestException(ERROR_CODE.SUBSCRIPTION_CANNOT_CANCEL.message);
    }

    const prevStatus = entity.subStatus;
    entity.subStatus = 'CANCELLED';
    entity.subCancelledAt = new Date();
    entity.subCancellationReason = reason;

    await this.subscriptionRepo.save(entity);
    await this.addHistory(id, 'CANCELLED', userId, 'status', prevStatus, 'CANCELLED', reason);

    return SubscriptionMapper.toResponse(entity);
  }

  async suspend(id: string, userId: string): Promise<SvcSubscriptionResponse> {
    return this.transitionStatus(id, 'SUSPENDED', userId);
  }

  async resume(id: string, userId: string): Promise<SvcSubscriptionResponse> {
    return this.transitionStatus(id, 'ACTIVE', userId, 'RESUMED');
  }

  async renew(id: string, userId: string): Promise<SvcSubscriptionResponse> {
    return this.transitionStatus(id, 'ACTIVE', userId, 'RENEWED');
  }

  private async transitionStatus(
    id: string,
    newStatus: string,
    userId: string,
    action?: string,
  ): Promise<SvcSubscriptionResponse> {
    const entity = await this.subscriptionRepo.findOne({
      where: { subId: id },
      relations: ['client', 'service', 'plan'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SUBSCRIPTION_NOT_FOUND.message);
    }

    const allowed = VALID_TRANSITIONS[entity.subStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(ERROR_CODE.SUBSCRIPTION_INVALID_TRANSITION.message);
    }

    const prevStatus = entity.subStatus;
    entity.subStatus = newStatus;
    await this.subscriptionRepo.save(entity);

    await this.addHistory(id, action || newStatus, userId, 'status', prevStatus, newStatus);

    return SubscriptionMapper.toResponse(entity);
  }

  async findHistory(subscriptionId: string): Promise<SvcSubscriptionHistoryResponse[]> {
    const history = await this.historyRepo.find({
      where: { subId: subscriptionId },
      order: { sbhCreatedAt: 'DESC' },
    });
    return history.map(SubscriptionMapper.historyToResponse);
  }

  async findExpiring(days: number = 30): Promise<SvcSubscriptionResponse[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const entities = await this.subscriptionRepo.find({
      where: {
        subEndDate: LessThanOrEqual(targetDate.toISOString().split('T')[0]),
        subStatus: 'ACTIVE',
      },
      relations: ['client', 'service', 'plan'],
      order: { subEndDate: 'ASC' },
    });

    return entities.map(SubscriptionMapper.toResponse);
  }
}
