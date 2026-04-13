import { Injectable, Logger } from '@nestjs/common';
import { EmployeeEntity } from '../entity/employee.entity';
import { EmployeeKrEntity } from '../entity/employee-kr.entity';
import { SalaryHistoryEntity } from '../entity/salary-history.entity';
import { InsuranceParamsKrEntity } from '../entity/insurance-params-kr.entity';
import { KrInsuranceCalcService } from './kr-insurance-calc.service';
import { KrTaxCalcService } from './kr-tax-calc.service';

/**
 * KR 급여 통합 계산 엔진 — 5단계 프로세스
 *
 * STEP 1: 합계 (과세합계 + 비과세합계 = 지급합계)
 * STEP 2: 4대보험 계산 (kr-insurance-calc)
 * STEP 3: 소득세 계산 (kr-tax-calc — 간이세액표 lookup)
 * STEP 4: 정산 반영 (보험정산 + 연말정산 + 선지급분)
 * STEP 5: 차인지급액 = 지급합계 - 공제합계
 */

export interface KrPayrollCalcInput {
  employee: EmployeeEntity;
  krInfo: EmployeeKrEntity;
  salary: SalaryHistoryEntity;
  insuranceParams: InsuranceParamsKrEntity;
  entityId: string;
  periodYear: number;
  periodMonth: number;
}

export interface KrPayrollCalcResult {
  // 지급 항목
  basePay: number;
  otExtend: number;
  otHoliday: number;
  otNight: number;
  otEtc: number;
  annualLeave: number;
  bonus: number;

  // 비과세 항목
  vehicleSub: number;
  mealAllow: number;
  childcare: number;

  // 합계
  taxableTotal: number;
  exemptTotal: number;
  grossTotal: number;

  // 4대보험
  pension: number;
  healthIns: number;
  longtermCare: number;
  employIns: number;

  // 보험 정산
  pensionSettle: number;
  healthSettle: number;
  longtermSettle: number;
  employSettle: number;

  // 세금
  incomeTax: number;
  localTax: number;
  yearendTax: number;
  yearendLocal: number;

  // 기타 공제
  prepaid: number;

  // 최종
  deductionTotal: number;
  netPay: number;
}

// 비과세 한도
const VEHICLE_SUB_LIMIT = 200000;
const MEAL_ALLOW_LIMIT = 200000;
const CHILDCARE_LIMIT = 200000;

@Injectable()
export class KrPayrollCalcService {
  private readonly logger = new Logger(KrPayrollCalcService.name);

  constructor(
    private readonly insuranceCalc: KrInsuranceCalcService,
    private readonly taxCalc: KrTaxCalcService,
  ) {}

  async processEmployee(input: KrPayrollCalcInput): Promise<KrPayrollCalcResult> {
    const { employee, krInfo, salary, insuranceParams, entityId, periodYear, periodMonth } = input;

    // ── STEP 1: 합계 ──
    const basePay = Number(salary.slhBaseSalaryVnd) || 0; // KR법인은 KRW 단위로 VND 필드 사용
    const otExtend = 0;
    const otHoliday = 0;
    const otNight = 0;
    const otEtc = 0;
    const annualLeave = 0;
    const bonus = 0;

    const taxableTotal = basePay + otExtend + otHoliday + otNight + otEtc + annualLeave + bonus;

    // 비과세: 각 항목은 한도 이내만 비과세
    const rawVehicleSub = Number(salary.slhFuelAllowance) || 0;
    const rawMealAllow = Number(salary.slhMealAllowance) || 0;
    const rawChildcare = Number(salary.slhCskhAllowance) || 0; // cskh = childcare

    const vehicleSub = Math.min(rawVehicleSub, VEHICLE_SUB_LIMIT);
    const mealAllow = Math.min(rawMealAllow, MEAL_ALLOW_LIMIT);
    const childcare = Math.min(rawChildcare, CHILDCARE_LIMIT);

    const exemptTotal = vehicleSub + mealAllow + childcare;
    const grossTotal = taxableTotal + exemptTotal;

    // ── STEP 2: 4대보험 ──
    const insurance = this.insuranceCalc.calculate({
      krInfo,
      taxableTotal,
      params: insuranceParams,
    });

    // ── STEP 3: 소득세 (간이세액표) ──
    const tax = await this.taxCalc.calculate({
      entityId,
      taxYear: periodYear,
      taxableTotal,
      taxDependents: krInfo.ekrTaxDependents,
      withholdingRate: Number(krInfo.ekrWithholdingRate) || 100,
    });

    // ── STEP 4: 정산 반영 (현재는 0, Phase 7에서 연말정산 연동) ──
    const pensionSettle = 0;
    const healthSettle = 0;
    const longtermSettle = 0;
    const employSettle = 0;
    const yearendTax = 0;
    const yearendLocal = 0;
    const prepaid = 0;

    // ── STEP 5: 차인지급액 ──
    const insuranceTotal = insurance.totalInsurance
      + pensionSettle + healthSettle + longtermSettle + employSettle;
    const taxTotal = tax.incomeTax + tax.localTax + yearendTax + yearendLocal;
    const deductionTotal = insuranceTotal + taxTotal + prepaid;
    const netPay = grossTotal - deductionTotal;

    this.logger.debug(
      `KR Payroll [${employee.empCode}]: gross=${grossTotal}, ins=${insurance.totalInsurance}, tax=${tax.incomeTax}+${tax.localTax}, net=${netPay}`,
    );

    return {
      basePay,
      otExtend, otHoliday, otNight, otEtc,
      annualLeave, bonus,
      vehicleSub, mealAllow, childcare,
      taxableTotal, exemptTotal, grossTotal,
      pension: insurance.pension,
      healthIns: insurance.healthIns,
      longtermCare: insurance.longtermCare,
      employIns: insurance.employIns,
      pensionSettle, healthSettle, longtermSettle, employSettle,
      incomeTax: tax.incomeTax,
      localTax: tax.localTax,
      yearendTax, yearendLocal,
      prepaid,
      deductionTotal,
      netPay,
    };
  }
}
