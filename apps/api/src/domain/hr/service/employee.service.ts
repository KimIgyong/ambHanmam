import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { EmployeeEntity } from '../entity/employee.entity';
import { DependentEntity } from '../entity/dependent.entity';
import { SalaryHistoryEntity } from '../entity/salary-history.entity';
import { HrEntityEntity } from '../entity/hr-entity.entity';
import { CreateEmployeeRequest } from '../dto/request/create-employee.request';
import { UpdateEmployeeRequest } from '../dto/request/update-employee.request';
import { CreateDependentRequest } from '../dto/request/create-dependent.request';
import { CreateSalaryRequest } from '../dto/request/create-salary.request';
import { EmployeeMapper } from '../mapper/employee.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { HrEmployeeResponse, HrDependentResponse, HrSalaryHistoryResponse } from '@amb/types';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(DependentEntity)
    private readonly dependentRepo: Repository<DependentEntity>,
    @InjectRepository(SalaryHistoryEntity)
    private readonly salaryHistoryRepo: Repository<SalaryHistoryEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
  ) {}

  async getEmployees(entityId: string, status?: string, department?: string): Promise<HrEmployeeResponse[]> {
    const qb = this.employeeRepo
      .createQueryBuilder('emp')
      .leftJoinAndSelect('emp.dependents', 'dep', 'dep.dep_deleted_at IS NULL')
      .leftJoinAndSelect('emp.hrEntity', 'ent')
      .where('emp.entId = :entityId', { entityId });

    if (status) {
      qb.andWhere('emp.empStatus = :status', { status });
    }
    if (department) {
      qb.andWhere('emp.empDepartment = :department', { department });
    }

    qb.orderBy('emp.empCode', 'ASC');

    const entities = await qb.getMany();
    return entities.map(EmployeeMapper.toResponse);
  }

  async getEmployeeById(id: string, entityId: string): Promise<HrEmployeeResponse> {
    const entity = await this.employeeRepo.findOne({
      where: { empId: id, entId: entityId },
      relations: ['dependents', 'hrEntity'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }
    return EmployeeMapper.toResponse(entity);
  }

  private async generateEmployeeCode(entityId: string): Promise<string> {
    const entity = await this.entityRepo.findOne({ where: { entId: entityId } });
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }
    const entCode = entity.entCode; // e.g. "KR01"

    const result = await this.employeeRepo
      .createQueryBuilder('emp')
      .select('MAX(emp.empCode)', 'maxCode')
      .where('emp.entId = :entityId', { entityId })
      .andWhere('emp.empCode LIKE :prefix', { prefix: `${entCode}%` })
      .getRawOne();

    let nextSeq = 1;
    if (result?.maxCode) {
      const seqPart = result.maxCode.substring(entCode.length);
      const parsed = parseInt(seqPart, 10);
      if (!isNaN(parsed)) {
        nextSeq = parsed + 1;
      }
    }

    return `${entCode}${String(nextSeq).padStart(4, '0')}`;
  }

  async createEmployee(entityId: string, dto: CreateEmployeeRequest): Promise<HrEmployeeResponse> {
    // Auto-generate employee_code if not provided
    if (!dto.employee_code) {
      dto.employee_code = await this.generateEmployeeCode(entityId);
    }

    // Check duplicate employee code within entity
    const existingCode = await this.employeeRepo.findOne({
      where: { empCode: dto.employee_code, entId: entityId },
    });
    if (existingCode) {
      throw new ConflictException(ERROR_CODE.HR_EMPLOYEE_DUPLICATE_CODE.message);
    }

    // Check duplicate CCCD within entity
    if (dto.cccd_number) {
      const existingCccd = await this.employeeRepo.findOne({
        where: { empCccdNumber: dto.cccd_number, entId: entityId },
      });
      if (existingCccd) {
        throw new ConflictException(ERROR_CODE.HR_EMPLOYEE_DUPLICATE_CCCD.message);
      }
    }

    const entity = this.employeeRepo.create({
      empCode: dto.employee_code,
      empFullName: dto.full_name,
      empNationality: dto.nationality,
      empCccdNumber: dto.cccd_number,
      empTaxCode: dto.tax_code || undefined,
      empSiNumber: dto.si_number || undefined,
      empHospitalCode: dto.hospital_code || undefined,
      empStartDate: dto.start_date,
      empStatus: dto.status,
      empContractType: dto.contract_type || 'EMPLOYEE',
      empDepartment: dto.department,
      empPosition: dto.position,
      empRegion: dto.region,
      empSalaryType: dto.salary_type,
      empWorkSchedule: dto.work_schedule,
      empMemo: dto.memo || undefined,
      entId: entityId,
    } as DeepPartial<EmployeeEntity>);

    const saved: EmployeeEntity = await this.employeeRepo.save(entity as EmployeeEntity);
    saved.dependents = [];
    return EmployeeMapper.toResponse(saved);
  }

  async updateEmployee(id: string, entityId: string, dto: UpdateEmployeeRequest): Promise<HrEmployeeResponse> {
    const entity = await this.employeeRepo.findOne({
      where: { empId: id, entId: entityId },
      relations: ['dependents'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    if (dto.full_name !== undefined) entity.empFullName = dto.full_name;
    if (dto.nationality !== undefined) entity.empNationality = dto.nationality;
    if (dto.cccd_number !== undefined) entity.empCccdNumber = dto.cccd_number;
    if (dto.tax_code !== undefined) entity.empTaxCode = dto.tax_code;
    if (dto.si_number !== undefined) entity.empSiNumber = dto.si_number;
    if (dto.hospital_code !== undefined) entity.empHospitalCode = dto.hospital_code;
    if (dto.start_date !== undefined) entity.empStartDate = dto.start_date;
    if (dto.end_date !== undefined) entity.empEndDate = dto.end_date;
    if (dto.status !== undefined) entity.empStatus = dto.status;
    if (dto.contract_type !== undefined) entity.empContractType = dto.contract_type;
    if (dto.department !== undefined) entity.empDepartment = dto.department;
    if (dto.position !== undefined) entity.empPosition = dto.position;
    if (dto.region !== undefined) entity.empRegion = dto.region;
    if (dto.salary_type !== undefined) entity.empSalaryType = dto.salary_type;
    if (dto.work_schedule !== undefined) entity.empWorkSchedule = dto.work_schedule;
    if (dto.memo !== undefined) entity.empMemo = dto.memo;

    const saved = await this.employeeRepo.save(entity);
    return EmployeeMapper.toResponse(saved);
  }

  async linkUser(empId: string, entityId: string, usrId: string): Promise<HrEmployeeResponse> {
    const entity = await this.employeeRepo.findOne({
      where: { empId, entId: entityId },
      relations: ['dependents', 'hrEntity'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }
    entity.usrId = usrId;
    const saved = await this.employeeRepo.save(entity);
    return EmployeeMapper.toResponse(saved);
  }

  async unlinkUser(empId: string, entityId: string): Promise<HrEmployeeResponse> {
    const entity = await this.employeeRepo.findOne({
      where: { empId, entId: entityId },
      relations: ['dependents', 'hrEntity'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }
    entity.usrId = null;
    const saved = await this.employeeRepo.save(entity);
    return EmployeeMapper.toResponse(saved);
  }

  async getAvailableEmployees(entityIds: string[]): Promise<HrEmployeeResponse[]> {
    if (entityIds.length === 0) return [];
    const qb = this.employeeRepo
      .createQueryBuilder('emp')
      .leftJoinAndSelect('emp.dependents', 'dep', 'dep.dep_deleted_at IS NULL')
      .leftJoinAndSelect('emp.hrEntity', 'ent')
      .where('emp.entId IN (:...entityIds)', { entityIds })
      .andWhere('emp.usrId IS NULL')
      .orderBy('emp.empCode', 'ASC');
    const entities = await qb.getMany();
    return entities.map(EmployeeMapper.toResponse);
  }

  async deleteEmployee(id: string, entityId: string): Promise<void> {
    const entity = await this.employeeRepo.findOne({ where: { empId: id, entId: entityId } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }
    await this.employeeRepo.softRemove(entity);
  }

  // --- Dependents ---

  async getDependents(employeeId: string, entityId: string): Promise<HrDependentResponse[]> {
    const employee = await this.employeeRepo.findOne({ where: { empId: employeeId, entId: entityId } });
    if (!employee) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    const entities = await this.dependentRepo.find({
      where: { empId: employeeId },
      order: { depEffectiveFrom: 'ASC' },
    });
    return entities.map(EmployeeMapper.toDependentResponse);
  }

  async createDependent(employeeId: string, entityId: string, dto: CreateDependentRequest): Promise<HrDependentResponse> {
    const employee = await this.employeeRepo.findOne({ where: { empId: employeeId, entId: entityId } });
    if (!employee) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    const entity = this.dependentRepo.create({
      empId: employeeId,
      depName: dto.name,
      depRelationship: dto.relationship,
      depDateOfBirth: dto.date_of_birth,
      depCccdNumber: dto.cccd_number || undefined,
      depTaxCode: dto.tax_code || undefined,
      depEffectiveFrom: dto.effective_from,
      depEffectiveTo: dto.effective_to || undefined,
    } as DeepPartial<DependentEntity>);

    const saved: DependentEntity = await this.dependentRepo.save(entity as DependentEntity);
    return EmployeeMapper.toDependentResponse(saved);
  }

  async updateDependent(depId: string, entityId: string, dto: CreateDependentRequest): Promise<HrDependentResponse> {
    const entity = await this.dependentRepo.findOne({ where: { depId } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_DEPENDENT_NOT_FOUND.message);
    }

    // Verify employee belongs to entity
    const employee = await this.employeeRepo.findOne({ where: { empId: entity.empId, entId: entityId } });
    if (!employee) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    entity.depName = dto.name;
    entity.depRelationship = dto.relationship;
    entity.depDateOfBirth = dto.date_of_birth;
    entity.depCccdNumber = dto.cccd_number || undefined as any;
    entity.depTaxCode = dto.tax_code || undefined as any;
    entity.depEffectiveFrom = dto.effective_from;
    entity.depEffectiveTo = dto.effective_to || undefined as any;

    const saved = await this.dependentRepo.save(entity);
    return EmployeeMapper.toDependentResponse(saved);
  }

  async deleteDependent(depId: string, entityId: string): Promise<void> {
    const entity = await this.dependentRepo.findOne({ where: { depId } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_DEPENDENT_NOT_FOUND.message);
    }

    // Verify employee belongs to entity
    const employee = await this.employeeRepo.findOne({ where: { empId: entity.empId, entId: entityId } });
    if (!employee) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    await this.dependentRepo.softRemove(entity);
  }

  // --- Salary History ---

  async getSalaryHistory(employeeId: string, entityId: string): Promise<HrSalaryHistoryResponse[]> {
    const employee = await this.employeeRepo.findOne({ where: { empId: employeeId, entId: entityId } });
    if (!employee) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    const entities = await this.salaryHistoryRepo.find({
      where: { empId: employeeId },
      order: { slhEffectiveDate: 'DESC' },
    });
    return entities.map(EmployeeMapper.toSalaryHistoryResponse);
  }

  async createSalaryHistory(employeeId: string, entityId: string, dto: CreateSalaryRequest): Promise<HrSalaryHistoryResponse> {
    const employee = await this.employeeRepo.findOne({ where: { empId: employeeId, entId: entityId } });
    if (!employee) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    const entity = this.salaryHistoryRepo.create({
      empId: employeeId,
      slhBaseSalaryVnd: dto.base_salary_vnd,
      slhBaseSalaryKrw: dto.base_salary_krw || 0,
      slhBaseSalaryUsd: dto.base_salary_usd || 0,
      slhExchangeRateKrw: dto.exchange_rate_krw || 1,
      slhExchangeRateUsd: dto.exchange_rate_usd || 1,
      slhMealAllowance: dto.meal_allowance || 0,
      slhCskhAllowance: dto.cskh_allowance || 0,
      slhFuelAllowance: dto.fuel_allowance || 0,
      slhParkingAllowance: dto.parking_allowance || 0,
      slhOtherAllowance: dto.other_allowance || 0,
      slhEffectiveDate: dto.effective_date,
    });

    const saved = await this.salaryHistoryRepo.save(entity);
    return EmployeeMapper.toSalaryHistoryResponse(saved);
  }
}
