import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HrSeveranceCalcResponse } from '@amb/types';
import { EmployeeEntity } from '../entity/employee.entity';
import { SalaryHistoryEntity } from '../entity/salary-history.entity';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class SeveranceService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(SalaryHistoryEntity)
    private readonly salaryRepo: Repository<SalaryHistoryEntity>,
  ) {}

  async calculateSeverance(entityId: string, empId: string, endDate?: string): Promise<HrSeveranceCalcResponse> {
    const emp = await this.employeeRepo.findOne({ where: { empId, entId: entityId } });
    if (!emp) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    const terminationDate = endDate || new Date().toISOString().split('T')[0];
    const yearsOfService = this.calcYearsOfService(emp.empStartDate, terminationDate);

    const salaryHistory = await this.salaryRepo.find({
      where: { empId },
      order: { slhEffectiveDate: 'DESC' },
    });

    const { averageSalary, breakdown } = this.calcAverageSalary6Months(salaryHistory, terminationDate);

    const severanceAmount = yearsOfService >= 1 ? Math.round(yearsOfService * 0.5 * averageSalary) : 0;

    return {
      employeeId: emp.empId,
      employeeCode: emp.empCode,
      employeeName: emp.empFullName,
      department: emp.empDepartment,
      startDate: emp.empStartDate,
      endDate: terminationDate,
      yearsOfService,
      averageSalary6Months: averageSalary,
      severanceAmount,
      breakdown,
    };
  }

  async confirmSeverance(entityId: string, empId: string): Promise<void> {
    const emp = await this.employeeRepo.findOne({ where: { empId, entId: entityId } });
    if (!emp) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    emp.empStatus = 'RESIGNED';
    emp.empEndDate = new Date().toISOString().split('T')[0];
    await this.employeeRepo.save(emp);
  }

  private calcYearsOfService(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    return Math.round((diffMs / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;
  }

  private calcAverageSalary6Months(
    salaryHistory: SalaryHistoryEntity[],
    endDate: string,
  ): { averageSalary: number; breakdown: { month: string; salary: number }[] } {
    if (salaryHistory.length === 0) {
      return { averageSalary: 0, breakdown: [] };
    }

    const end = new Date(endDate);
    const breakdown: { month: string; salary: number }[] = [];

    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(end.getFullYear(), end.getMonth() - i, 1);
      const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

      const applicable = salaryHistory.find(
        (s) => new Date(s.slhEffectiveDate) <= monthDate,
      );

      if (applicable) {
        const totalSalary =
          Number(applicable.slhBaseSalaryVnd) +
          Number(applicable.slhMealAllowance) +
          Number(applicable.slhCskhAllowance) +
          Number(applicable.slhFuelAllowance) +
          Number(applicable.slhParkingAllowance) +
          Number(applicable.slhOtherAllowance);
        breakdown.push({ month: monthStr, salary: totalSalary });
      } else {
        breakdown.push({ month: monthStr, salary: 0 });
      }
    }

    const total = breakdown.reduce((sum, b) => sum + b.salary, 0);
    const averageSalary = Math.round(total / 6);

    return { averageSalary, breakdown: breakdown.reverse() };
  }
}
