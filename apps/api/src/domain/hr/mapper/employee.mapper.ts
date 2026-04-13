import { HrEmployeeResponse, HrDependentResponse, HrSalaryHistoryResponse } from '@amb/types';
import { EmployeeEntity } from '../entity/employee.entity';
import { DependentEntity } from '../entity/dependent.entity';
import { SalaryHistoryEntity } from '../entity/salary-history.entity';

export class EmployeeMapper {
  static toResponse(entity: EmployeeEntity): HrEmployeeResponse {
    return {
      employeeId: entity.empId,
      employeeCode: entity.empCode,
      fullName: entity.empFullName,
      entityId: entity.entId || null,
      entityName: entity.hrEntity?.entName || null,
      nationality: entity.empNationality as HrEmployeeResponse['nationality'],
      cccdNumber: entity.empCccdNumber,
      taxCode: entity.empTaxCode || null,
      siNumber: entity.empSiNumber || null,
      hospitalCode: entity.empHospitalCode || null,
      startDate: entity.empStartDate,
      endDate: entity.empEndDate || null,
      status: entity.empStatus as HrEmployeeResponse['status'],
      contractType: (entity.empContractType || 'EMPLOYEE') as HrEmployeeResponse['contractType'],
      department: entity.empDepartment,
      position: entity.empPosition,
      region: entity.empRegion as HrEmployeeResponse['region'],
      salaryType: entity.empSalaryType as HrEmployeeResponse['salaryType'],
      workSchedule: entity.empWorkSchedule as HrEmployeeResponse['workSchedule'],
      memo: entity.empMemo || null,
      dependentCount: entity.dependents?.length || 0,
      createdAt: entity.empCreatedAt.toISOString(),
      updatedAt: entity.empUpdatedAt.toISOString(),
    };
  }

  static toDependentResponse(entity: DependentEntity): HrDependentResponse {
    return {
      dependentId: entity.depId,
      employeeId: entity.empId,
      name: entity.depName,
      relationship: entity.depRelationship,
      dateOfBirth: entity.depDateOfBirth,
      cccdNumber: entity.depCccdNumber || null,
      taxCode: entity.depTaxCode || null,
      effectiveFrom: entity.depEffectiveFrom,
      effectiveTo: entity.depEffectiveTo || null,
      createdAt: entity.depCreatedAt.toISOString(),
      updatedAt: entity.depUpdatedAt.toISOString(),
    };
  }

  static toSalaryHistoryResponse(entity: SalaryHistoryEntity): HrSalaryHistoryResponse {
    return {
      salaryHistoryId: entity.slhId,
      employeeId: entity.empId,
      baseSalaryVnd: Number(entity.slhBaseSalaryVnd),
      baseSalaryKrw: Number(entity.slhBaseSalaryKrw),
      baseSalaryUsd: Number(entity.slhBaseSalaryUsd),
      exchangeRateKrw: Number(entity.slhExchangeRateKrw),
      exchangeRateUsd: Number(entity.slhExchangeRateUsd),
      mealAllowance: Number(entity.slhMealAllowance),
      cskhAllowance: Number(entity.slhCskhAllowance),
      fuelAllowance: Number(entity.slhFuelAllowance),
      parkingAllowance: Number(entity.slhParkingAllowance),
      otherAllowance: Number(entity.slhOtherAllowance),
      effectiveDate: entity.slhEffectiveDate,
      createdAt: entity.slhCreatedAt.toISOString(),
    };
  }
}
