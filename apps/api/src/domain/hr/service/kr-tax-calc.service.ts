import { Injectable } from '@nestjs/common';
import { TaxTableService } from './tax-table.service';

/**
 * KR 간이세액 소득세 계산 엔진
 *
 * 1. 간이세액표 조회: salary_from <= taxableTotal < salary_to AND dependents = taxDependents
 * 2. baseTax = 조회결과 tax_amount (100% 기준)
 * 3. incomeTax = FLOOR(baseTax × withholdingRate / 100)
 * 4. localTax = FLOOR(incomeTax × 10 / 100)
 */

export interface KrTaxCalcInput {
  entityId: string;
  taxYear: number;
  taxableTotal: number;
  taxDependents: number;
  withholdingRate: number; // 80, 100, or 120
}

export interface KrTaxCalcResult {
  baseTax: number;
  incomeTax: number;
  localTax: number;
}

@Injectable()
export class KrTaxCalcService {
  constructor(private readonly taxTableService: TaxTableService) {}

  async calculate(input: KrTaxCalcInput): Promise<KrTaxCalcResult> {
    const { entityId, taxYear, taxableTotal, taxDependents, withholdingRate } = input;

    if (taxableTotal <= 0) {
      return { baseTax: 0, incomeTax: 0, localTax: 0 };
    }

    // 간이세액표 조회
    const baseTax = await this.taxTableService.lookupTax(
      entityId, taxYear, taxableTotal, taxDependents,
    );

    // 원천징수 비율 적용 (80%, 100%, 120%)
    const incomeTax = Math.floor(baseTax * withholdingRate / 100);

    // 지방소득세 = 소득세의 10%
    const localTax = Math.floor(incomeTax * 10 / 100);

    return { baseTax, incomeTax, localTax };
  }
}
