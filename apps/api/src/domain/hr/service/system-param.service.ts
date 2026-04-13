import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, LessThanOrEqual, IsNull, MoreThanOrEqual } from 'typeorm';
import { SystemParamEntity } from '../entity/system-param.entity';
import { HolidayEntity } from '../entity/holiday.entity';
import { UpdateSystemParamRequest } from '../dto/request/update-system-param.request';
import { CreateHolidayRequest } from '../dto/request/create-holiday.request';
import { PayrollMapper } from '../mapper/payroll.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { HrSystemParamResponse, HrHolidayResponse } from '@amb/types';

@Injectable()
export class SystemParamService {
  constructor(
    @InjectRepository(SystemParamEntity)
    private readonly paramRepo: Repository<SystemParamEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepo: Repository<HolidayEntity>,
  ) {}

  // --- System Parameters ---

  async getAllParams(entityId?: string): Promise<HrSystemParamResponse[]> {
    const qb = this.paramRepo.createQueryBuilder('p')
      .orderBy('p.hspParamKey', 'ASC')
      .addOrderBy('p.hspEffectiveFrom', 'DESC');
    if (entityId) {
      qb.where('p.entId = :entityId', { entityId });
    }
    const entities = await qb.getMany();
    return entities.map(PayrollMapper.toSystemParamResponse);
  }

  async getCurrentParams(entityId?: string): Promise<HrSystemParamResponse[]> {
    const today = new Date().toISOString().split('T')[0];
    const qb = this.paramRepo
      .createQueryBuilder('p')
      .where('p.hspEffectiveFrom <= :today', { today })
      .andWhere('(p.hspEffectiveTo IS NULL OR p.hspEffectiveTo >= :today)', { today })
      .orderBy('p.hspParamKey', 'ASC');
    if (entityId) {
      qb.andWhere('p.entId = :entityId', { entityId });
    }
    const entities = await qb.getMany();
    return entities.map(PayrollMapper.toSystemParamResponse);
  }

  async getParamValue(key: string, date?: string): Promise<string | null> {
    const refDate = date || new Date().toISOString().split('T')[0];
    const entity = await this.paramRepo
      .createQueryBuilder('p')
      .where('p.hspParamKey = :key', { key })
      .andWhere('p.hspEffectiveFrom <= :date', { date: refDate })
      .andWhere('(p.hspEffectiveTo IS NULL OR p.hspEffectiveTo >= :date)', { date: refDate })
      .orderBy('p.hspEffectiveFrom', 'DESC')
      .getOne();
    return entity ? entity.hspParamValue : null;
  }

  async getParamMap(date?: string): Promise<Record<string, string>> {
    const params = date
      ? await this.getParamsForDate(date)
      : await this.getCurrentParams();
    const map: Record<string, string> = {};
    for (const p of params) {
      if (!map[p.paramKey]) {
        map[p.paramKey] = p.paramValue;
      }
    }
    return map;
  }

  private async getParamsForDate(date: string): Promise<HrSystemParamResponse[]> {
    const entities = await this.paramRepo
      .createQueryBuilder('p')
      .where('p.hspEffectiveFrom <= :date', { date })
      .andWhere('(p.hspEffectiveTo IS NULL OR p.hspEffectiveTo >= :date)', { date })
      .orderBy('p.hspParamKey', 'ASC')
      .addOrderBy('p.hspEffectiveFrom', 'DESC')
      .getMany();
    return entities.map(PayrollMapper.toSystemParamResponse);
  }

  async upsertParam(entityId: string, dto: UpdateSystemParamRequest): Promise<HrSystemParamResponse> {
    const entity = this.paramRepo.create({
      entId: entityId,
      hspParamKey: dto.param_key,
      hspParamValue: dto.param_value,
      hspEffectiveFrom: dto.effective_from,
      hspEffectiveTo: dto.effective_to || undefined,
      hspDescription: dto.description || undefined,
    } as DeepPartial<SystemParamEntity>);
    const saved: SystemParamEntity = await this.paramRepo.save(entity as SystemParamEntity);
    return PayrollMapper.toSystemParamResponse(saved);
  }

  // --- Holidays ---

  async getHolidays(entityId: string, year: number): Promise<HrHolidayResponse[]> {
    const entities = await this.holidayRepo.find({
      where: { holYear: year, entId: entityId },
      order: { holDate: 'ASC' },
    });
    return entities.map(PayrollMapper.toHolidayResponse);
  }

  async createHoliday(entityId: string, dto: CreateHolidayRequest): Promise<HrHolidayResponse> {
    const existing = await this.holidayRepo.findOne({ where: { holDate: dto.date, entId: entityId } });
    if (existing) {
      throw new ConflictException('Holiday already exists for this date.');
    }
    const entity = this.holidayRepo.create({
      entId: entityId,
      holDate: dto.date,
      holName: dto.name,
      holNameVi: dto.name_vi || undefined,
      holYear: dto.year,
    } as DeepPartial<HolidayEntity>);
    const saved: HolidayEntity = await this.holidayRepo.save(entity as HolidayEntity);
    return PayrollMapper.toHolidayResponse(saved);
  }

  async deleteHoliday(entityId: string, id: string): Promise<void> {
    const entity = await this.holidayRepo.findOne({ where: { holId: id, entId: entityId } });
    if (!entity) {
      throw new NotFoundException('Holiday not found.');
    }
    await this.holidayRepo.remove(entity);
  }

  async getHolidayDatesForMonth(year: number, month: number): Promise<string[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const entities = await this.holidayRepo
      .createQueryBuilder('h')
      .where('h.holDate >= :startDate AND h.holDate < :endDate', { startDate, endDate })
      .getMany();
    return entities.map((e) => e.holDate);
  }
}
