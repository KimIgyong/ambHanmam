import { Injectable, Logger } from '@nestjs/common';
import { EmployeeEntity } from '../entity/employee.entity';
import { SalaryHistoryEntity } from '../entity/salary-history.entity';
import { DependentEntity } from '../entity/dependent.entity';

/**
 * Vietnam Payroll Calculation Engine — 9-step process
 *
 * STEP 1: Base salary determination (VND conversion with exchange rates)
 * STEP 2: Actual salary = Base × (actualDays / standardDays)
 * STEP 3: Total income = Actual salary + allowances
 * STEP 4: Insurance base salary (with cap, probation exemption)
 * STEP 5: Company insurance = SI(17.5%) + HI(3%) + UI(1%) + Union(2%)
 * STEP 6: Employee insurance = SI(8%) + HI(1.5%) + UI(1%)
 * STEP 7: Taxable income = Total - Employee insurance - Self deduction - Dependent deduction - Tax-exempt meal
 * STEP 8: PIT = 5-bracket progressive tax (2026)
 * STEP 9: Net salary = Total + OT + extras - Employee insurance - PIT
 */

export interface PayrollCalcInput {
  employee: EmployeeEntity;
  salary: SalaryHistoryEntity;
  dependents: DependentEntity[];
  standardWorkingDays: number;
  actualWorkingDays: number;
  params: Record<string, string>;
  periodYear: number;
  periodMonth: number;
}

export interface PayrollCalcResult {
  baseSalary: number;
  actualSalary: number;
  mealAllowance: number;
  cskhAllowance: number;
  fuelAllowance: number;
  otherAllowance: number;
  totalIncome: number;
  insuranceBaseSi: number;
  insuranceBaseUi: number;
  companySiSickness: number;
  companySiAccident: number;
  companySiRetirement: number;
  companyHi: number;
  companyUi: number;
  companyUnion: number;
  totalCompanyInsurance: number;
  employeeSi: number;
  employeeHi: number;
  employeeUi: number;
  totalEmployeeInsurance: number;
  selfDeduction: number;
  dependentDeduction: number;
  numDependents: number;
  taxExemptIncome: number;
  taxableIncome: number;
  pitAmount: number;
  standardWorkingDays: number;
  actualWorkingDays: number;
  netSalaryVnd: number;
}

@Injectable()
export class PayrollCalcService {
  private readonly logger = new Logger(PayrollCalcService.name);

  processEmployee(input: PayrollCalcInput): PayrollCalcResult {
    const { employee, salary, dependents, standardWorkingDays, actualWorkingDays, params, periodYear, periodMonth } = input;

    // STEP 1: Base salary (VND)
    const baseSalary = this.determineBaseSalary(salary);

    // STEP 2: Actual salary (pro-rated)
    const actualSalary = this.calculateActualSalary(baseSalary, actualWorkingDays, standardWorkingDays);

    // STEP 3: Total income
    const mealAllowance = Number(salary.slhMealAllowance) || 0;
    const cskhAllowance = Number(salary.slhCskhAllowance) || 0;
    const fuelAllowance = Number(salary.slhFuelAllowance) || 0;
    const otherAllowance = Number(salary.slhOtherAllowance) || 0;
    const totalIncome = actualSalary + mealAllowance + cskhAllowance + fuelAllowance + otherAllowance;

    // STEP 4: Insurance base
    const isProbation = employee.empStatus === 'PROBATION';
    const isForeigner = employee.empNationality === 'FOREIGNER';
    const { insuranceBaseSi, insuranceBaseUi } = this.calculateInsuranceBase(
      baseSalary, employee.empRegion, isProbation, isForeigner, params,
    );

    // STEP 5: Company insurance
    const companyInsurance = this.calculateCompanyInsurance(insuranceBaseSi, insuranceBaseUi, isProbation, params);

    // STEP 6: Employee insurance
    const employeeInsurance = this.calculateEmployeeInsurance(insuranceBaseSi, insuranceBaseUi, isProbation, params);

    // STEP 7: Tax deductions
    const periodDate = `${periodYear}-${String(periodMonth).padStart(2, '0')}-15`;
    const activeDependents = this.countActiveDependents(dependents, periodDate);
    const selfDeduction = this.getParamNum(params, 'PIT_SELF_DEDUCTION', 15500000);
    const depDeduction = this.getParamNum(params, 'PIT_DEPENDENT_DEDUCTION', 6200000);
    const dependentDeduction = activeDependents * depDeduction;
    const mealExempt = this.getParamNum(params, 'MEAL_ALLOWANCE_PIT_EXEMPT', 730000);
    const taxExemptIncome = Math.min(mealAllowance, mealExempt);

    // STEP 8: PIT calculation
    const taxableIncome = Math.max(0,
      totalIncome - employeeInsurance.totalEmployeeInsurance - selfDeduction - dependentDeduction - taxExemptIncome);
    const pitAmount = this.calculatePIT(taxableIncome, params);

    // STEP 9: Net salary
    const netSalaryVnd = totalIncome - employeeInsurance.totalEmployeeInsurance - pitAmount;

    return {
      baseSalary,
      actualSalary,
      mealAllowance,
      cskhAllowance,
      fuelAllowance,
      otherAllowance,
      totalIncome,
      insuranceBaseSi,
      insuranceBaseUi,
      ...companyInsurance,
      ...employeeInsurance,
      selfDeduction,
      dependentDeduction,
      numDependents: activeDependents,
      taxExemptIncome,
      taxableIncome,
      pitAmount,
      standardWorkingDays,
      actualWorkingDays,
      netSalaryVnd,
    };
  }

  // STEP 1
  private determineBaseSalary(salary: SalaryHistoryEntity): number {
    const vnd = Number(salary.slhBaseSalaryVnd) || 0;
    const krw = Number(salary.slhBaseSalaryKrw) || 0;
    const usd = Number(salary.slhBaseSalaryUsd) || 0;
    const rateKrw = Number(salary.slhExchangeRateKrw) || 1;
    const rateUsd = Number(salary.slhExchangeRateUsd) || 1;
    return vnd + (krw * rateKrw) + (usd * rateUsd);
  }

  // STEP 2
  private calculateActualSalary(baseSalary: number, actualDays: number, standardDays: number): number {
    if (standardDays <= 0) return 0;
    return Math.round(baseSalary * actualDays / standardDays);
  }

  // STEP 4
  private calculateInsuranceBase(
    baseSalary: number, region: string, isProbation: boolean, isForeigner: boolean,
    params: Record<string, string>,
  ): { insuranceBaseSi: number; insuranceBaseUi: number } {
    if (isProbation) {
      return { insuranceBaseSi: 0, insuranceBaseUi: 0 };
    }

    const basicSalaryRef = this.getParamNum(params, 'BASIC_SALARY_REF', 2340000);
    const siCapMultiplier = this.getParamNum(params, 'SI_CAP_MULTIPLIER', 20);
    const uiCapMultiplier = this.getParamNum(params, 'UI_CAP_MULTIPLIER', 20);

    const siCap = basicSalaryRef * siCapMultiplier;
    const insuranceBaseSi = Math.min(baseSalary, siCap);

    const regionKey = `${region}_MIN_WAGE`;
    const regionMinWage = this.getParamNum(params, regionKey, 5310000);
    const uiCap = regionMinWage * uiCapMultiplier;
    const insuranceBaseUi = isForeigner ? 0 : Math.min(baseSalary, uiCap);

    return { insuranceBaseSi, insuranceBaseUi };
  }

  // STEP 5
  private calculateCompanyInsurance(
    insuranceBaseSi: number, insuranceBaseUi: number, isProbation: boolean,
    params: Record<string, string>,
  ) {
    if (isProbation) {
      return {
        companySiSickness: 0, companySiAccident: 0, companySiRetirement: 0,
        companyHi: 0, companyUi: 0, companyUnion: 0, totalCompanyInsurance: 0,
      };
    }

    const companySiSickness = Math.round(insuranceBaseSi * this.getParamNum(params, 'SI_RATE_COMPANY_SICKNESS', 3) / 100);
    const companySiAccident = Math.round(insuranceBaseSi * this.getParamNum(params, 'SI_RATE_COMPANY_ACCIDENT', 0.5) / 100);
    const companySiRetirement = Math.round(insuranceBaseSi * this.getParamNum(params, 'SI_RATE_COMPANY_RETIREMENT', 14) / 100);
    const companyHi = Math.round(insuranceBaseSi * this.getParamNum(params, 'HI_RATE_COMPANY', 3) / 100);
    const companyUi = Math.round(insuranceBaseUi * this.getParamNum(params, 'UI_RATE_COMPANY', 1) / 100);
    const companyUnion = Math.round(insuranceBaseSi * this.getParamNum(params, 'UNION_RATE_COMPANY', 2) / 100);
    const totalCompanyInsurance = companySiSickness + companySiAccident + companySiRetirement + companyHi + companyUi + companyUnion;

    return {
      companySiSickness, companySiAccident, companySiRetirement,
      companyHi, companyUi, companyUnion, totalCompanyInsurance,
    };
  }

  // STEP 6
  private calculateEmployeeInsurance(
    insuranceBaseSi: number, insuranceBaseUi: number, isProbation: boolean,
    params: Record<string, string>,
  ) {
    if (isProbation) {
      return { employeeSi: 0, employeeHi: 0, employeeUi: 0, totalEmployeeInsurance: 0 };
    }

    const employeeSi = Math.round(insuranceBaseSi * this.getParamNum(params, 'SI_RATE_EMPLOYEE', 8) / 100);
    const employeeHi = Math.round(insuranceBaseSi * this.getParamNum(params, 'HI_RATE_EMPLOYEE', 1.5) / 100);
    const employeeUi = Math.round(insuranceBaseUi * this.getParamNum(params, 'UI_RATE_EMPLOYEE', 1) / 100);
    const totalEmployeeInsurance = employeeSi + employeeHi + employeeUi;

    return { employeeSi, employeeHi, employeeUi, totalEmployeeInsurance };
  }

  // STEP 8: 5-bracket progressive PIT (2026)
  private calculatePIT(taxableIncome: number, params: Record<string, string>): number {
    if (taxableIncome <= 0) return 0;

    const brackets = [
      { ceiling: this.getParamNum(params, 'PIT_BRACKET_1_CEILING', 10000000), rate: this.getParamNum(params, 'PIT_BRACKET_1_RATE', 5) },
      { ceiling: this.getParamNum(params, 'PIT_BRACKET_2_CEILING', 30000000), rate: this.getParamNum(params, 'PIT_BRACKET_2_RATE', 10) },
      { ceiling: this.getParamNum(params, 'PIT_BRACKET_3_CEILING', 60000000), rate: this.getParamNum(params, 'PIT_BRACKET_3_RATE', 20) },
      { ceiling: this.getParamNum(params, 'PIT_BRACKET_4_CEILING', 100000000), rate: this.getParamNum(params, 'PIT_BRACKET_4_RATE', 30) },
      { ceiling: Infinity, rate: this.getParamNum(params, 'PIT_BRACKET_5_RATE', 35) },
    ];

    let remaining = taxableIncome;
    let tax = 0;
    let prevCeiling = 0;

    for (const bracket of brackets) {
      const bracketWidth = bracket.ceiling === Infinity ? remaining : bracket.ceiling - prevCeiling;
      const taxableInBracket = Math.min(remaining, bracketWidth);
      tax += Math.round(taxableInBracket * bracket.rate / 100);
      remaining -= taxableInBracket;
      prevCeiling = bracket.ceiling;
      if (remaining <= 0) break;
    }

    return tax;
  }

  private countActiveDependents(dependents: DependentEntity[], dateStr: string): number {
    return dependents.filter((d) => {
      const from = d.depEffectiveFrom;
      const to = d.depEffectiveTo;
      return from <= dateStr && (!to || to >= dateStr);
    }).length;
  }

  private getParamNum(params: Record<string, string>, key: string, defaultVal: number): number {
    const val = params[key];
    if (val === undefined || val === null) return defaultVal;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultVal : parsed;
  }
}
