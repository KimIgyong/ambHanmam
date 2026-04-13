import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HrLeaveBalanceResponse } from '@amb/types';
import { LeaveBalanceEntity } from '../entity/leave-balance.entity';
import { EmployeeEntity } from '../entity/employee.entity';
import { TimesheetEntity } from '../entity/timesheet.entity';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeaveBalanceEntity)
    private readonly leaveRepo: Repository<LeaveBalanceEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(TimesheetEntity)
    private readonly timesheetRepo: Repository<TimesheetEntity>,
  ) {}

  async getLeaveBalances(entityId: string, year: number): Promise<HrLeaveBalanceResponse[]> {
    const employees = await this.employeeRepo.find({
      where: [
        { empStatus: 'OFFICIAL', entId: entityId },
        { empStatus: 'PROBATION', entId: entityId },
      ],
      order: { empCode: 'ASC' },
    });

    const empIds = employees.map((e) => e.empId);
    let balances: LeaveBalanceEntity[] = [];
    if (empIds.length > 0) {
      balances = await this.leaveRepo
        .createQueryBuilder('lvb')
        .where('lvb.empId IN (:...empIds)', { empIds })
        .andWhere('lvb.lvbYear = :year', { year })
        .getMany();
    }
    const balanceMap = new Map(balances.map((b) => [b.empId, b]));

    return employees.map((emp) => {
      const balance = balanceMap.get(emp.empId);
      const yearsOfService = this.calcYearsOfService(emp.empStartDate);

      return {
        leaveBalanceId: balance?.lvbId || '',
        employeeId: emp.empId,
        employeeCode: emp.empCode,
        employeeName: emp.empFullName,
        department: emp.empDepartment,
        year,
        entitlement: balance ? Number(balance.lvbEntitlement) : 0,
        used: balance ? Number(balance.lvbUsed) : 0,
        otConverted: balance ? Number(balance.lvbOtConverted) : 0,
        carryForward: balance ? Number(balance.lvbCarryForward) : 0,
        remaining: balance ? Number(balance.lvbRemaining) : 0,
        startDate: emp.empStartDate,
        yearsOfService,
      };
    });
  }

  async getEmployeeLeaveBalance(entityId: string, empId: string, year: number): Promise<HrLeaveBalanceResponse> {
    const emp = await this.employeeRepo.findOne({ where: { empId, entId: entityId } });
    if (!emp) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    const balance = await this.leaveRepo.findOne({ where: { empId, lvbYear: year } });
    const yearsOfService = this.calcYearsOfService(emp.empStartDate);

    return {
      leaveBalanceId: balance?.lvbId || '',
      employeeId: emp.empId,
      employeeCode: emp.empCode,
      employeeName: emp.empFullName,
      department: emp.empDepartment,
      year,
      entitlement: balance ? Number(balance.lvbEntitlement) : 0,
      used: balance ? Number(balance.lvbUsed) : 0,
      otConverted: balance ? Number(balance.lvbOtConverted) : 0,
      carryForward: balance ? Number(balance.lvbCarryForward) : 0,
      remaining: balance ? Number(balance.lvbRemaining) : 0,
      startDate: emp.empStartDate,
      yearsOfService,
    };
  }

  async recalculateLeave(entityId: string, year: number): Promise<{ recalculatedCount: number }> {
    const employees = await this.employeeRepo.find({
      where: [
        { empStatus: 'OFFICIAL', entId: entityId },
        { empStatus: 'PROBATION', entId: entityId },
      ],
    });

    let count = 0;
    for (const emp of employees) {
      const yearsOfService = this.calcYearsOfService(emp.empStartDate);
      const entitlement = this.calcEntitlement(yearsOfService);

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      const leaveDays = await this.timesheetRepo
        .createQueryBuilder('tms')
        .where('tms.emp_id = :empId', { empId: emp.empId })
        .andWhere('tms.tms_work_date >= :startDate', { startDate })
        .andWhere('tms.tms_work_date <= :endDate', { endDate })
        .andWhere('tms.tms_attendance_code = :code', { code: 'AL' })
        .getCount();

      const prevBalance = await this.leaveRepo.findOne({
        where: { empId: emp.empId, lvbYear: year - 1 },
      });
      const carryForward = prevBalance ? Math.min(Number(prevBalance.lvbRemaining), 5) : 0;

      const remaining = entitlement + carryForward - leaveDays;

      let balance = await this.leaveRepo.findOne({
        where: { empId: emp.empId, lvbYear: year },
      });

      if (balance) {
        balance.lvbEntitlement = entitlement;
        balance.lvbUsed = leaveDays;
        balance.lvbCarryForward = carryForward;
        balance.lvbRemaining = Math.max(remaining, 0);
      } else {
        balance = this.leaveRepo.create({
          empId: emp.empId,
          lvbYear: year,
          lvbEntitlement: entitlement,
          lvbUsed: leaveDays,
          lvbOtConverted: 0,
          lvbCarryForward: carryForward,
          lvbRemaining: Math.max(remaining, 0),
        });
      }

      await this.leaveRepo.save(balance);
      count++;
    }

    return { recalculatedCount: count };
  }

  async updateLeaveBalance(
    entityId: string,
    empId: string,
    year: number,
    dto: { entitlement?: number; used?: number; carry_forward?: number; ot_converted?: number },
  ): Promise<HrLeaveBalanceResponse> {
    const emp = await this.employeeRepo.findOne({ where: { empId, entId: entityId } });
    if (!emp) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    let balance = await this.leaveRepo.findOne({ where: { empId, lvbYear: year } });
    if (!balance) {
      balance = this.leaveRepo.create({
        empId,
        lvbYear: year,
        lvbEntitlement: 0,
        lvbUsed: 0,
        lvbOtConverted: 0,
        lvbCarryForward: 0,
        lvbRemaining: 0,
      });
    }

    if (dto.entitlement !== undefined) balance.lvbEntitlement = dto.entitlement;
    if (dto.used !== undefined) balance.lvbUsed = dto.used;
    if (dto.carry_forward !== undefined) balance.lvbCarryForward = dto.carry_forward;
    if (dto.ot_converted !== undefined) balance.lvbOtConverted = dto.ot_converted;

    balance.lvbRemaining = Number(balance.lvbEntitlement)
      + Number(balance.lvbCarryForward)
      - Number(balance.lvbUsed)
      - Number(balance.lvbOtConverted);

    await this.leaveRepo.save(balance);

    const yearsOfService = this.calcYearsOfService(emp.empStartDate);
    return {
      leaveBalanceId: balance.lvbId,
      employeeId: emp.empId,
      employeeCode: emp.empCode,
      employeeName: emp.empFullName,
      department: emp.empDepartment,
      year,
      entitlement: Number(balance.lvbEntitlement),
      used: Number(balance.lvbUsed),
      otConverted: Number(balance.lvbOtConverted),
      carryForward: Number(balance.lvbCarryForward),
      remaining: Number(balance.lvbRemaining),
      startDate: emp.empStartDate,
      yearsOfService,
    };
  }

  private calcYearsOfService(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }

  private calcEntitlement(yearsOfService: number): number {
    if (yearsOfService < 1) return 0;
    const base = 12;
    const bonus = Math.floor(yearsOfService / 5);
    return base + bonus;
  }
}
