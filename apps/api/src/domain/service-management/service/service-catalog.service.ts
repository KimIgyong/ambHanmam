import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { SvcServiceEntity } from '../entity/service.entity';
import { SvcPlanEntity } from '../entity/service-plan.entity';
import { SvcSubscriptionEntity } from '../entity/subscription.entity';
import { CreateServiceRequest } from '../dto/request/create-service.request';
import { UpdateServiceRequest } from '../dto/request/update-service.request';
import { CreatePlanRequest } from '../dto/request/create-plan.request';
import { UpdatePlanRequest } from '../dto/request/update-plan.request';
import { ServiceMapper } from '../mapper/service.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { SvcServiceResponse, SvcPlanResponse } from '@amb/types';

@Injectable()
export class ServiceCatalogService {
  constructor(
    @InjectRepository(SvcServiceEntity)
    private readonly serviceRepo: Repository<SvcServiceEntity>,
    @InjectRepository(SvcPlanEntity)
    private readonly planRepo: Repository<SvcPlanEntity>,
    @InjectRepository(SvcSubscriptionEntity)
    private readonly subscriptionRepo: Repository<SvcSubscriptionEntity>,
  ) {}

  async findAll(params?: { status?: string; category?: string }): Promise<SvcServiceResponse[]> {
    const qb = this.serviceRepo.createQueryBuilder('svc');

    if (params?.status) {
      qb.andWhere('svc.svcStatus = :status', { status: params.status });
    }
    if (params?.category) {
      qb.andWhere('svc.svcCategory = :category', { category: params.category });
    }

    qb.orderBy('svc.svcSortOrder', 'ASC');
    const entities = await qb.getMany();

    const results: SvcServiceResponse[] = [];
    for (const entity of entities) {
      const planCount = await this.planRepo.count({ where: { svcId: entity.svcId } });
      const activeSubscriptionCount = await this.subscriptionRepo.count({
        where: { svcId: entity.svcId, subStatus: 'ACTIVE' },
      });
      results.push(ServiceMapper.toResponse(entity, { planCount, activeSubscriptionCount }));
    }
    return results;
  }

  async findById(id: string): Promise<SvcServiceResponse> {
    const entity = await this.serviceRepo.findOne({ where: { svcId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SERVICE_NOT_FOUND.message);
    }
    const planCount = await this.planRepo.count({ where: { svcId: id } });
    const activeSubscriptionCount = await this.subscriptionRepo.count({
      where: { svcId: id, subStatus: 'ACTIVE' },
    });
    return ServiceMapper.toResponse(entity, { planCount, activeSubscriptionCount });
  }

  async create(dto: CreateServiceRequest): Promise<SvcServiceResponse> {
    const existing = await this.serviceRepo.findOne({ where: { svcCode: dto.code } });
    if (existing) {
      throw new ConflictException(ERROR_CODE.SERVICE_CODE_DUPLICATE.message);
    }

    const entity = this.serviceRepo.create({
      svcCode: dto.code,
      svcName: dto.name,
      svcNameKo: dto.name_ko || undefined,
      svcNameVi: dto.name_vi || undefined,
      svcDescription: dto.description || undefined,
      svcCategory: dto.category,
      svcIcon: dto.icon || undefined,
      svcColor: dto.color || undefined,
      svcWebsiteUrl: dto.website_url || undefined,
      svcLaunchDate: dto.launch_date || undefined,
      svcSortOrder: dto.sort_order ?? 0,
    } as DeepPartial<SvcServiceEntity>);

    const saved: SvcServiceEntity = await this.serviceRepo.save(entity as SvcServiceEntity);
    return ServiceMapper.toResponse(saved);
  }

  async update(id: string, dto: UpdateServiceRequest): Promise<SvcServiceResponse> {
    const entity = await this.serviceRepo.findOne({ where: { svcId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SERVICE_NOT_FOUND.message);
    }

    if (dto.name !== undefined) entity.svcName = dto.name;
    if (dto.name_ko !== undefined) entity.svcNameKo = dto.name_ko;
    if (dto.name_vi !== undefined) entity.svcNameVi = dto.name_vi;
    if (dto.description !== undefined) entity.svcDescription = dto.description;
    if (dto.category !== undefined) entity.svcCategory = dto.category;
    if (dto.icon !== undefined) entity.svcIcon = dto.icon;
    if (dto.color !== undefined) entity.svcColor = dto.color;
    if (dto.website_url !== undefined) entity.svcWebsiteUrl = dto.website_url;
    if (dto.status !== undefined) entity.svcStatus = dto.status;
    if (dto.launch_date !== undefined) entity.svcLaunchDate = dto.launch_date;
    if (dto.sort_order !== undefined) entity.svcSortOrder = dto.sort_order;

    const saved = await this.serviceRepo.save(entity);
    return ServiceMapper.toResponse(saved);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.serviceRepo.findOne({ where: { svcId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SERVICE_NOT_FOUND.message);
    }
    await this.serviceRepo.softRemove(entity);
  }

  // Plan methods
  async findPlans(serviceId: string): Promise<SvcPlanResponse[]> {
    const service = await this.serviceRepo.findOne({ where: { svcId: serviceId } });
    if (!service) {
      throw new NotFoundException(ERROR_CODE.SERVICE_NOT_FOUND.message);
    }
    const plans = await this.planRepo.find({
      where: { svcId: serviceId },
      order: { splSortOrder: 'ASC' },
    });
    return plans.map(ServiceMapper.planToResponse);
  }

  async createPlan(serviceId: string, dto: CreatePlanRequest): Promise<SvcPlanResponse> {
    const service = await this.serviceRepo.findOne({ where: { svcId: serviceId } });
    if (!service) {
      throw new NotFoundException(ERROR_CODE.SERVICE_NOT_FOUND.message);
    }

    const entity = this.planRepo.create({
      svcId: serviceId,
      splCode: dto.code,
      splName: dto.name,
      splDescription: dto.description || undefined,
      splBillingCycle: dto.billing_cycle || 'MONTHLY',
      splPrice: dto.price ?? 0,
      splCurrency: dto.currency || 'USD',
      splMaxUsers: dto.max_users || undefined,
      splFeaturesJson: dto.features_json || undefined,
      splIsActive: dto.is_active ?? true,
      splSortOrder: dto.sort_order ?? 0,
    } as DeepPartial<SvcPlanEntity>);

    const saved: SvcPlanEntity = await this.planRepo.save(entity as SvcPlanEntity);
    return ServiceMapper.planToResponse(saved);
  }

  async updatePlan(serviceId: string, planId: string, dto: UpdatePlanRequest): Promise<SvcPlanResponse> {
    const entity = await this.planRepo.findOne({ where: { splId: planId, svcId: serviceId } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SERVICE_PLAN_NOT_FOUND.message);
    }

    if (dto.name !== undefined) entity.splName = dto.name;
    if (dto.description !== undefined) entity.splDescription = dto.description;
    if (dto.billing_cycle !== undefined) entity.splBillingCycle = dto.billing_cycle;
    if (dto.price !== undefined) entity.splPrice = dto.price;
    if (dto.currency !== undefined) entity.splCurrency = dto.currency;
    if (dto.max_users !== undefined) entity.splMaxUsers = dto.max_users;
    if (dto.features_json !== undefined) entity.splFeaturesJson = dto.features_json;
    if (dto.is_active !== undefined) entity.splIsActive = dto.is_active;
    if (dto.sort_order !== undefined) entity.splSortOrder = dto.sort_order;

    const saved = await this.planRepo.save(entity);
    return ServiceMapper.planToResponse(saved);
  }

  async deletePlan(serviceId: string, planId: string): Promise<void> {
    const entity = await this.planRepo.findOne({ where: { splId: planId, svcId: serviceId } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SERVICE_PLAN_NOT_FOUND.message);
    }
    // Check if plan has active subscriptions
    const activeCount = await this.subscriptionRepo.count({
      where: { splId: planId, subStatus: 'ACTIVE' },
    });
    if (activeCount > 0) {
      throw new ConflictException(ERROR_CODE.SERVICE_PLAN_IN_USE.message);
    }
    await this.planRepo.remove(entity);
  }
}
