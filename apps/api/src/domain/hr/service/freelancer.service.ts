import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { FreelancerEntity } from '../entity/freelancer.entity';
import { CreateFreelancerRequest } from '../dto/request/create-freelancer.request';
import { UpdateFreelancerRequest } from '../dto/request/update-freelancer.request';
import { FreelancerMapper } from '../mapper/freelancer.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { HrFreelancerResponse } from '@amb/types';

@Injectable()
export class FreelancerService {
  constructor(
    @InjectRepository(FreelancerEntity)
    private readonly freelancerRepo: Repository<FreelancerEntity>,
  ) {}

  async getFreelancers(entityId: string): Promise<HrFreelancerResponse[]> {
    const entities = await this.freelancerRepo.find({
      where: { entId: entityId },
      order: { frlCode: 'ASC' },
    });
    return entities.map(FreelancerMapper.toResponse);
  }

  async getFreelancerById(id: string, entityId: string): Promise<HrFreelancerResponse> {
    const entity = await this.freelancerRepo.findOne({
      where: { frlId: id, entId: entityId },
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_FREELANCER_NOT_FOUND.message);
    }
    return FreelancerMapper.toResponse(entity);
  }

  async createFreelancer(entityId: string, dto: CreateFreelancerRequest): Promise<HrFreelancerResponse> {
    const existing = await this.freelancerRepo.findOne({
      where: { entId: entityId, frlCode: dto.code },
    });
    if (existing) {
      throw new ConflictException(ERROR_CODE.HR_FREELANCER_DUPLICATE_CODE.message);
    }

    const entity = this.freelancerRepo.create({
      entId: entityId,
      frlCode: dto.code,
      frlFullName: dto.full_name,
      frlResidentNo: dto.resident_no || undefined,
      frlNationality: dto.nationality || undefined,
      frlAddress: dto.address || undefined,
      frlPhone: dto.phone || undefined,
      frlContractStart: dto.contract_start || undefined,
      frlContractEnd: dto.contract_end || undefined,
      frlContractAmount: dto.contract_amount || 0,
      frlMonthlyAmount: dto.monthly_amount || 0,
      frlPaymentType: dto.payment_type || 'BUSINESS_INCOME',
      frlTaxRate: dto.tax_rate ?? 3.0,
    } as DeepPartial<FreelancerEntity>);

    const saved: FreelancerEntity = await this.freelancerRepo.save(entity as FreelancerEntity);
    return FreelancerMapper.toResponse(saved);
  }

  async updateFreelancer(id: string, entityId: string, dto: UpdateFreelancerRequest): Promise<HrFreelancerResponse> {
    const entity = await this.freelancerRepo.findOne({
      where: { frlId: id, entId: entityId },
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_FREELANCER_NOT_FOUND.message);
    }

    if (dto.full_name !== undefined) entity.frlFullName = dto.full_name;
    if (dto.resident_no !== undefined) entity.frlResidentNo = dto.resident_no;
    if (dto.nationality !== undefined) entity.frlNationality = dto.nationality;
    if (dto.address !== undefined) entity.frlAddress = dto.address;
    if (dto.phone !== undefined) entity.frlPhone = dto.phone;
    if (dto.contract_start !== undefined) entity.frlContractStart = dto.contract_start;
    if (dto.contract_end !== undefined) entity.frlContractEnd = dto.contract_end;
    if (dto.contract_amount !== undefined) entity.frlContractAmount = dto.contract_amount;
    if (dto.monthly_amount !== undefined) entity.frlMonthlyAmount = dto.monthly_amount;
    if (dto.payment_type !== undefined) entity.frlPaymentType = dto.payment_type;
    if (dto.tax_rate !== undefined) entity.frlTaxRate = dto.tax_rate;
    if (dto.status !== undefined) entity.frlStatus = dto.status;

    const saved = await this.freelancerRepo.save(entity);
    return FreelancerMapper.toResponse(saved);
  }

  async deleteFreelancer(id: string, entityId: string): Promise<void> {
    const entity = await this.freelancerRepo.findOne({
      where: { frlId: id, entId: entityId },
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_FREELANCER_NOT_FOUND.message);
    }
    await this.freelancerRepo.softRemove(entity);
  }
}
