import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { InsuranceParamsKrEntity } from '../entity/insurance-params-kr.entity';
import { HrEntityEntity } from '../entity/hr-entity.entity';
import { UpdateInsuranceParamsKrRequest } from '../dto/request/update-insurance-params-kr.request';
import { HrInsuranceParamsKrResponse } from '@amb/types';

@Injectable()
export class InsuranceParamsKrService implements OnModuleInit {
  constructor(
    @InjectRepository(InsuranceParamsKrEntity)
    private readonly paramsRepo: Repository<InsuranceParamsKrEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultParams();
  }

  async getParams(entityId: string): Promise<HrInsuranceParamsKrResponse[]> {
    const entities = await this.paramsRepo.find({
      where: { entId: entityId },
      order: { ikrEffectiveFrom: 'DESC' },
    });
    return entities.map(this.toResponse);
  }

  async getCurrentParams(entityId: string, date: string): Promise<InsuranceParamsKrEntity | null> {
    return this.paramsRepo.findOne({
      where: {
        entId: entityId,
        ikrEffectiveFrom: LessThanOrEqual(date) as any,
        ikrEffectiveTo: Or(IsNull(), MoreThanOrEqual(date)) as any,
      },
      order: { ikrEffectiveFrom: 'DESC' },
    });
  }

  async createOrUpdate(entityId: string, dto: UpdateInsuranceParamsKrRequest): Promise<HrInsuranceParamsKrResponse> {
    const entity = this.paramsRepo.create({
      entId: entityId,
      ikrEffectiveFrom: dto.effective_from,
      ikrEffectiveTo: dto.effective_to || undefined,
      ikrPensionRate: dto.pension_rate,
      ikrPensionEmp: dto.pension_emp,
      ikrPensionUpper: dto.pension_upper,
      ikrPensionLower: dto.pension_lower,
      ikrHealthRate: dto.health_rate,
      ikrHealthEmp: dto.health_emp,
      ikrLongtermRate: dto.longterm_rate,
      ikrEmployRate: dto.employ_rate,
      ikrEmployEmp: dto.employ_emp,
    } as DeepPartial<InsuranceParamsKrEntity>);

    const saved: InsuranceParamsKrEntity = await this.paramsRepo.save(entity as InsuranceParamsKrEntity);
    return this.toResponse(saved);
  }

  async deleteParam(id: string, entityId: string): Promise<void> {
    const entity = await this.paramsRepo.findOne({
      where: { ikrId: id, entId: entityId },
    });
    if (!entity) {
      throw new NotFoundException('Insurance parameter not found.');
    }
    await this.paramsRepo.remove(entity);
  }

  private toResponse(entity: InsuranceParamsKrEntity): HrInsuranceParamsKrResponse {
    return {
      id: entity.ikrId,
      effectiveFrom: entity.ikrEffectiveFrom,
      effectiveTo: entity.ikrEffectiveTo || null,
      pensionRate: Number(entity.ikrPensionRate),
      pensionEmp: Number(entity.ikrPensionEmp),
      pensionUpper: Number(entity.ikrPensionUpper),
      pensionLower: Number(entity.ikrPensionLower),
      healthRate: Number(entity.ikrHealthRate),
      healthEmp: Number(entity.ikrHealthEmp),
      longtermRate: Number(entity.ikrLongtermRate),
      employRate: Number(entity.ikrEmployRate),
      employEmp: Number(entity.ikrEmployEmp),
    };
  }

  private async seedDefaultParams() {
    const krEntity = await this.entityRepo.findOne({ where: { entCountry: 'KR' } });
    if (!krEntity) return;

    const existing = await this.paramsRepo.findOne({ where: { entId: krEntity.entId } });
    if (existing) return;

    await this.paramsRepo.save(this.paramsRepo.create({
      entId: krEntity.entId,
      ikrEffectiveFrom: '2026-01-01',
      ikrEffectiveTo: undefined,
      ikrPensionRate: 9.5,
      ikrPensionEmp: 4.75,
      ikrPensionUpper: 6370000,
      ikrPensionLower: 400000,
      ikrHealthRate: 7.19,
      ikrHealthEmp: 3.595,
      ikrLongtermRate: 13.14,
      ikrEmployRate: 1.8,
      ikrEmployEmp: 0.9,
    } as DeepPartial<InsuranceParamsKrEntity>) as InsuranceParamsKrEntity);
  }
}
