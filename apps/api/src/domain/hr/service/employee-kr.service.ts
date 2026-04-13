import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { EmployeeKrEntity } from '../entity/employee-kr.entity';
import { EmployeeEntity } from '../entity/employee.entity';
import { CreateEmployeeKrRequest } from '../dto/request/create-employee-kr.request';
import { UpdateEmployeeKrRequest } from '../dto/request/update-employee-kr.request';
import { EmployeeKrMapper } from '../mapper/employee-kr.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { HrEmployeeKrResponse } from '@amb/types';

@Injectable()
export class EmployeeKrService {
  constructor(
    @InjectRepository(EmployeeKrEntity)
    private readonly ekrRepo: Repository<EmployeeKrEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  async getByEmployeeId(empId: string): Promise<HrEmployeeKrResponse | null> {
    const entity = await this.ekrRepo.findOne({ where: { empId } });
    if (!entity) return null;
    return EmployeeKrMapper.toResponse(entity);
  }

  async create(empId: string, dto: CreateEmployeeKrRequest): Promise<HrEmployeeKrResponse> {
    const employee = await this.employeeRepo.findOne({ where: { empId } });
    if (!employee) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    const existing = await this.ekrRepo.findOne({ where: { empId } });
    if (existing) {
      throw new ConflictException('KR employee info already exists.');
    }

    const entity = this.ekrRepo.create({
      empId,
      ekrEmployeeType: dto.employee_type,
      ekrResidentNo: dto.resident_no || undefined,
      ekrPensionNo: dto.pension_no || undefined,
      ekrHealthInsNo: dto.health_ins_no || undefined,
      ekrEmployInsNo: dto.employ_ins_no || undefined,
      ekrPensionExempt: dto.pension_exempt || false,
      ekrHealthExempt: dto.health_exempt || false,
      ekrEmployExempt: dto.employ_exempt || false,
      ekrTaxDependents: dto.tax_dependents || 1,
      ekrWithholdingRate: dto.withholding_rate || '100',
      ekrBankAccount: dto.bank_account || undefined,
    } as DeepPartial<EmployeeKrEntity>);

    const saved: EmployeeKrEntity = await this.ekrRepo.save(entity as EmployeeKrEntity);
    return EmployeeKrMapper.toResponse(saved);
  }

  async update(empId: string, dto: UpdateEmployeeKrRequest): Promise<HrEmployeeKrResponse> {
    const entity = await this.ekrRepo.findOne({ where: { empId } });
    if (!entity) {
      throw new NotFoundException('KR employee info not found.');
    }

    if (dto.employee_type !== undefined) entity.ekrEmployeeType = dto.employee_type;
    if (dto.resident_no !== undefined) entity.ekrResidentNo = dto.resident_no;
    if (dto.pension_no !== undefined) entity.ekrPensionNo = dto.pension_no;
    if (dto.health_ins_no !== undefined) entity.ekrHealthInsNo = dto.health_ins_no;
    if (dto.employ_ins_no !== undefined) entity.ekrEmployInsNo = dto.employ_ins_no;
    if (dto.pension_exempt !== undefined) entity.ekrPensionExempt = dto.pension_exempt;
    if (dto.health_exempt !== undefined) entity.ekrHealthExempt = dto.health_exempt;
    if (dto.employ_exempt !== undefined) entity.ekrEmployExempt = dto.employ_exempt;
    if (dto.tax_dependents !== undefined) entity.ekrTaxDependents = dto.tax_dependents;
    if (dto.withholding_rate !== undefined) entity.ekrWithholdingRate = dto.withholding_rate;
    if (dto.bank_account !== undefined) entity.ekrBankAccount = dto.bank_account;

    const saved = await this.ekrRepo.save(entity);
    return EmployeeKrMapper.toResponse(saved);
  }
}
