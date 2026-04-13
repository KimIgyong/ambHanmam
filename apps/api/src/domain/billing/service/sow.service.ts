import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { SowEntity } from '../entity/sow.entity';
import { ContractEntity } from '../entity/contract.entity';
import { CreateSowRequest } from '../dto/request/create-sow.request';
import { UpdateSowRequest } from '../dto/request/update-sow.request';
import { SowMapper } from '../mapper/sow.mapper';
import { BilSowResponse } from '@amb/types';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SIGNED', 'IN_PROGRESS'],
  SIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['ACCEPTED'],
  ACCEPTED: [],
};

@Injectable()
export class SowService {
  constructor(
    @InjectRepository(SowEntity)
    private readonly sowRepo: Repository<SowEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
  ) {}

  async findAll(
    entityId: string,
    query?: { status?: string; contract_id?: string; search?: string; partner_id?: string },
  ): Promise<BilSowResponse[]> {
    const qb = this.sowRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.contract', 'c')
      .leftJoinAndSelect('c.partner', 'p')
      .where('s.entId = :entityId', { entityId })
      .orderBy('s.sowCreatedAt', 'DESC');

    if (query?.status) qb.andWhere('s.sowStatus = :status', { status: query.status });
    if (query?.contract_id) qb.andWhere('s.ctrId = :contractId', { contractId: query.contract_id });
    if (query?.partner_id) qb.andWhere('c.ptnId = :partnerId', { partnerId: query.partner_id });
    if (query?.search) {
      qb.andWhere('(s.sowTitle ILIKE :search OR c.ctrTitle ILIKE :search OR p.ptnCompanyName ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const sows = await qb.getMany();
    return sows.map(SowMapper.toResponse);
  }

  async findById(id: string, entityId: string): Promise<BilSowResponse> {
    const sow = await this.sowRepo.findOne({
      where: { sowId: id, entId: entityId },
      relations: ['contract', 'contract.partner'],
    });
    if (!sow) {
      throw new NotFoundException(ERROR_CODE.SOW_NOT_FOUND.message);
    }
    return SowMapper.toResponse(sow);
  }

  async create(dto: CreateSowRequest, entityId: string): Promise<BilSowResponse> {
    const contract = await this.contractRepo.findOne({
      where: { ctrId: dto.contract_id, entId: entityId },
    });
    if (!contract) {
      throw new NotFoundException(ERROR_CODE.CONTRACT_NOT_FOUND.message);
    }

    const sow = this.sowRepo.create({
      ctrId: dto.contract_id,
      entId: entityId,
      sowTitle: dto.title,
      sowDescription: dto.description || null,
      sowPeriodStart: dto.period_start,
      sowPeriodEnd: dto.period_end,
      sowAmount: dto.amount || 0,
      sowCurrency: dto.currency || contract.ctrCurrency,
      sowNote: dto.note || null,
    } as DeepPartial<SowEntity>);

    const saved: SowEntity = await this.sowRepo.save(sow as SowEntity);
    return this.findById(saved.sowId, entityId);
  }

  async update(id: string, dto: UpdateSowRequest, entityId: string): Promise<BilSowResponse> {
    const sow = await this.sowRepo.findOne({ where: { sowId: id, entId: entityId } });
    if (!sow) {
      throw new NotFoundException(ERROR_CODE.SOW_NOT_FOUND.message);
    }

    if (dto.status && dto.status !== sow.sowStatus) {
      const allowed = VALID_TRANSITIONS[sow.sowStatus] || [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(ERROR_CODE.SOW_INVALID_TRANSITION.message);
      }
      sow.sowStatus = dto.status;
    }

    if (dto.title !== undefined) sow.sowTitle = dto.title;
    if (dto.description !== undefined) sow.sowDescription = dto.description;
    if (dto.period_start !== undefined) sow.sowPeriodStart = dto.period_start;
    if (dto.period_end !== undefined) sow.sowPeriodEnd = dto.period_end;
    if (dto.amount !== undefined) sow.sowAmount = dto.amount;
    if (dto.currency !== undefined) sow.sowCurrency = dto.currency;
    if (dto.note !== undefined) sow.sowNote = dto.note;

    await this.sowRepo.save(sow);
    return this.findById(id, entityId);
  }

  async delete(id: string, entityId: string): Promise<void> {
    const sow = await this.sowRepo.findOne({ where: { sowId: id, entId: entityId } });
    if (!sow) {
      throw new NotFoundException(ERROR_CODE.SOW_NOT_FOUND.message);
    }
    await this.sowRepo.softRemove(sow);
  }
}
