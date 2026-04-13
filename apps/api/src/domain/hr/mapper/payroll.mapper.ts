import {
  HrSystemParamResponse, HrHolidayResponse,
  HrPayrollPeriodResponse, HrPayrollDetailResponse,
} from '@amb/types';
import { SystemParamEntity } from '../entity/system-param.entity';
import { HolidayEntity } from '../entity/holiday.entity';
import { PayrollPeriodEntity } from '../entity/payroll-period.entity';
import { PayrollDetailEntity } from '../entity/payroll-detail.entity';

export class PayrollMapper {
  static toSystemParamResponse(entity: SystemParamEntity): HrSystemParamResponse {
    return {
      paramId: entity.hspId,
      paramKey: entity.hspParamKey,
      paramValue: entity.hspParamValue,
      effectiveFrom: entity.hspEffectiveFrom,
      effectiveTo: entity.hspEffectiveTo || null,
      description: entity.hspDescription || null,
      createdAt: entity.hspCreatedAt.toISOString(),
    };
  }

  static toHolidayResponse(entity: HolidayEntity): HrHolidayResponse {
    return {
      holidayId: entity.holId,
      date: entity.holDate,
      name: entity.holName,
      nameVi: entity.holNameVi || null,
      year: entity.holYear,
      createdAt: entity.holCreatedAt.toISOString(),
    };
  }

  static toPeriodResponse(entity: PayrollPeriodEntity): HrPayrollPeriodResponse {
    const details = entity.details || [];
    return {
      periodId: entity.pypId,
      year: entity.pypYear,
      month: entity.pypMonth,
      status: entity.pypStatus as HrPayrollPeriodResponse['status'],
      paymentDate: entity.pypPaymentDate || null,
      employeeCount: details.length,
      totalGross: details.reduce((s, d) => s + Number(d.pydTotalIncome), 0),
      totalInsurance: details.reduce((s, d) => s + Number(d.pydTotalEmployeeInsurance), 0),
      totalPit: details.reduce((s, d) => s + Number(d.pydPitAmount), 0),
      totalNet: details.reduce((s, d) => s + Number(d.pydNetSalaryVnd), 0),
      createdAt: entity.pypCreatedAt.toISOString(),
      updatedAt: entity.pypUpdatedAt.toISOString(),
    };
  }

  static toDetailResponse(entity: PayrollDetailEntity): HrPayrollDetailResponse {
    return {
      detailId: entity.pydId,
      periodId: entity.pypId,
      employeeId: entity.empId,
      employeeCode: entity.employee?.empCode || '',
      employeeName: entity.employee?.empFullName || '',
      department: entity.employee?.empDepartment || '',
      baseSalary: Number(entity.pydBaseSalary),
      actualSalary: Number(entity.pydActualSalary),
      mealAllowance: Number(entity.pydMealAllowance),
      cskhAllowance: Number(entity.pydCskhAllowance),
      fuelAllowance: Number(entity.pydFuelAllowance),
      otherAllowance: Number(entity.pydOtherAllowance),
      totalIncome: Number(entity.pydTotalIncome),
      insuranceBaseSi: Number(entity.pydInsuranceBaseSi),
      insuranceBaseUi: Number(entity.pydInsuranceBaseUi),
      companySiSickness: Number(entity.pydCompanySiSickness),
      companySiAccident: Number(entity.pydCompanySiAccident),
      companySiRetirement: Number(entity.pydCompanySiRetirement),
      companyHi: Number(entity.pydCompanyHi),
      companyUi: Number(entity.pydCompanyUi),
      companyUnion: Number(entity.pydCompanyUnion),
      totalCompanyInsurance: Number(entity.pydTotalCompanyInsurance),
      employeeSi: Number(entity.pydEmployeeSi),
      employeeHi: Number(entity.pydEmployeeHi),
      employeeUi: Number(entity.pydEmployeeUi),
      totalEmployeeInsurance: Number(entity.pydTotalEmployeeInsurance),
      selfDeduction: Number(entity.pydSelfDeduction),
      dependentDeduction: Number(entity.pydDependentDeduction),
      numDependents: entity.pydNumDependents,
      taxExemptIncome: Number(entity.pydTaxExemptIncome),
      taxableIncome: Number(entity.pydTaxableIncome),
      pitAmount: Number(entity.pydPitAmount),
      otAmount: Number(entity.pydOtAmount),
      annualLeaveSalary: Number(entity.pydAnnualLeaveSalary),
      bonus: Number(entity.pydBonus),
      adjustment: Number(entity.pydAdjustment),
      standardWorkingDays: entity.pydStandardWorkingDays,
      actualWorkingDays: Number(entity.pydActualWorkingDays),
      netSalaryVnd: Number(entity.pydNetSalaryVnd),
      netSalaryUsd: Number(entity.pydNetSalaryUsd),
    };
  }
}
