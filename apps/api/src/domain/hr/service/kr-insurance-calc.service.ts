import { Injectable } from '@nestjs/common';
import { EmployeeKrEntity } from '../entity/employee-kr.entity';
import { InsuranceParamsKrEntity } from '../entity/insurance-params-kr.entity';

/**
 * KR 4대보험 계산 엔진
 *
 * 1. 국민연금: clamp(과세합계, lower, upper) × 근로자요율 → FLOOR (pension_exempt이면 0)
 * 2. 건강보험: 과세합계 × 근로자요율 → FLOOR (health_exempt이면 0)
 * 3. 장기요양: 건강보험 × 장기요양요율 → FLOOR (health_exempt이면 0)
 * 4. 고용보험: 과세합계 × 근로자요율 → FLOOR (employ_exempt이면 0, 대표이사)
 */

export interface KrInsuranceCalcInput {
  krInfo: EmployeeKrEntity;
  taxableTotal: number;
  params: InsuranceParamsKrEntity;
}

export interface KrInsuranceCalcResult {
  pension: number;
  healthIns: number;
  longtermCare: number;
  employIns: number;
  totalInsurance: number;
}

@Injectable()
export class KrInsuranceCalcService {
  calculate(input: KrInsuranceCalcInput): KrInsuranceCalcResult {
    const { krInfo, taxableTotal, params } = input;

    // 1. 국민연금
    let pension = 0;
    if (!krInfo.ekrPensionExempt) {
      const pensionUpper = Number(params.ikrPensionUpper);
      const pensionLower = Number(params.ikrPensionLower);
      const pensionEmpRate = Number(params.ikrPensionEmp);
      const pensionBase = Math.min(Math.max(taxableTotal, pensionLower), pensionUpper);
      pension = Math.floor(pensionBase * pensionEmpRate / 100);
    }

    // 2. 건강보험
    let healthIns = 0;
    if (!krInfo.ekrHealthExempt) {
      const healthEmpRate = Number(params.ikrHealthEmp);
      healthIns = Math.floor(taxableTotal * healthEmpRate / 100);
    }

    // 3. 장기요양보험 (건강보험 기준)
    let longtermCare = 0;
    if (!krInfo.ekrHealthExempt) {
      const longtermRate = Number(params.ikrLongtermRate);
      longtermCare = Math.floor(healthIns * longtermRate / 100);
    }

    // 4. 고용보험 (대표이사 등 employ_exempt이면 제외)
    let employIns = 0;
    if (!krInfo.ekrEmployExempt) {
      const employEmpRate = Number(params.ikrEmployEmp);
      employIns = Math.floor(taxableTotal * employEmpRate / 100);
    }

    const totalInsurance = pension + healthIns + longtermCare + employIns;

    return { pension, healthIns, longtermCare, employIns, totalInsurance };
  }
}
