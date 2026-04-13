import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, Between } from 'typeorm';
import { HrOtRecordResponse, HrOtMonthlySummary } from '@amb/types';
import { OtRecordEntity } from '../entity/ot-record.entity';
import { EmployeeEntity } from '../entity/employee.entity';
import { TimesheetMapper } from '../mapper/timesheet.mapper';
import { CreateOtRecordRequest } from '../dto/request/create-ot-record.request';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class OtRecordService {
  constructor(
    @InjectRepository(OtRecordEntity)
    private readonly otRepo: Repository<OtRecordEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  async getMonthlyOtRecords(entityId: string, year: number, month: number): Promise<HrOtMonthlySummary[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const employees = await this.employeeRepo.find({
      where: [
        { empStatus: 'OFFICIAL', entId: entityId },
        { empStatus: 'PROBATION', entId: entityId },
      ],
      order: { empCode: 'ASC' },
    });

    const empIds = employees.map((e) => e.empId);
    let records: OtRecordEntity[] = [];
    if (empIds.length > 0) {
      records = await this.otRepo
        .createQueryBuilder('otr')
        .leftJoinAndSelect('otr.employee', 'emp')
        .where('otr.emp_id IN (:...empIds)', { empIds })
        .andWhere('otr.otr_date >= :startDate', { startDate })
        .andWhere('otr.otr_date <= :endDate', { endDate })
        .andWhere('otr.otr_deleted_at IS NULL')
        .orderBy('otr.otr_date', 'ASC')
        .getMany();
    }

    const grouped = new Map<string, OtRecordEntity[]>();
    for (const record of records) {
      if (!grouped.has(record.empId)) {
        grouped.set(record.empId, []);
      }
      grouped.get(record.empId)!.push(record);
    }

    return employees.map((emp) => {
      const empRecords = grouped.get(emp.empId) || [];
      const totalActualHours = empRecords.reduce((sum, r) => sum + Number(r.otrActualHours), 0);
      const totalConvertedHours = empRecords.reduce((sum, r) => sum + Number(r.otrConvertedHours), 0);

      return {
        employeeId: emp.empId,
        employeeCode: emp.empCode,
        employeeName: emp.empFullName,
        department: emp.empDepartment,
        totalActualHours,
        totalConvertedHours,
        records: empRecords.map(TimesheetMapper.toOtRecordResponse),
      };
    });
  }

  async createOtRecord(entityId: string, dto: CreateOtRecordRequest): Promise<HrOtRecordResponse> {
    const employee = await this.employeeRepo.findOne({ where: { empId: dto.employee_id, entId: entityId } });
    if (!employee) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    const record = this.otRepo.create({
      empId: dto.employee_id,
      otrDate: dto.date,
      otrTimeStart: dto.time_start,
      otrTimeEnd: dto.time_end,
      otrProjectDescription: dto.project_description || undefined,
      otrType: dto.ot_type,
      otrActualHours: dto.actual_hours,
      otrConvertedHours: dto.converted_hours,
      otrApprovalStatus: 'PENDING',
    } as DeepPartial<OtRecordEntity>);

    const saved: OtRecordEntity = await this.otRepo.save(record as OtRecordEntity);
    saved.employee = employee;
    return TimesheetMapper.toOtRecordResponse(saved);
  }

  async updateOtRecord(entityId: string, id: string, dto: Partial<CreateOtRecordRequest>): Promise<HrOtRecordResponse> {
    const record = await this.otRepo.findOne({ where: { otrId: id }, relations: ['employee'] });
    if (!record || record.employee?.entId !== entityId) {
      throw new NotFoundException(ERROR_CODE.HR_OT_RECORD_NOT_FOUND.message);
    }

    if (dto.date) record.otrDate = dto.date;
    if (dto.time_start) record.otrTimeStart = dto.time_start;
    if (dto.time_end) record.otrTimeEnd = dto.time_end;
    if (dto.project_description !== undefined) record.otrProjectDescription = dto.project_description || undefined as any;
    if (dto.ot_type) record.otrType = dto.ot_type;
    if (dto.actual_hours !== undefined) record.otrActualHours = dto.actual_hours;
    if (dto.converted_hours !== undefined) record.otrConvertedHours = dto.converted_hours;

    const saved = await this.otRepo.save(record);
    return TimesheetMapper.toOtRecordResponse(saved);
  }

  async deleteOtRecord(entityId: string, id: string): Promise<void> {
    const record = await this.otRepo.findOne({ where: { otrId: id }, relations: ['employee'] });
    if (!record || record.employee?.entId !== entityId) {
      throw new NotFoundException(ERROR_CODE.HR_OT_RECORD_NOT_FOUND.message);
    }
    await this.otRepo.softRemove(record);
  }

  async approveOtRecord(entityId: string, id: string, userId: string, status: 'APPROVED' | 'REJECTED'): Promise<HrOtRecordResponse> {
    const record = await this.otRepo.findOne({ where: { otrId: id }, relations: ['employee'] });
    if (!record || record.employee?.entId !== entityId) {
      throw new NotFoundException(ERROR_CODE.HR_OT_RECORD_NOT_FOUND.message);
    }

    if (record.otrApprovalStatus !== 'PENDING') {
      throw new BadRequestException('OT record is already processed.');
    }

    record.otrApprovalStatus = status;
    record.otrApprovedBy = userId;
    const saved = await this.otRepo.save(record);
    return TimesheetMapper.toOtRecordResponse(saved);
  }
}
