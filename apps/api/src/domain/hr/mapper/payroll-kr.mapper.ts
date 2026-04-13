import { PayrollEntryKrEntity } from '../entity/payroll-entry-kr.entity';
import { HrPayrollEntryKrResponse } from '@amb/types';

export class PayrollKrMapper {
  static toResponse(entity: PayrollEntryKrEntity): HrPayrollEntryKrResponse {
    return {
      entryId: entity.pkrId,
      periodId: entity.pypId,
      employeeId: entity.empId,
      entityId: entity.entId,
      employeeCode: entity.employee?.empCode || '',
      employeeName: entity.employee?.empFullName || '',
      department: entity.employee?.empDepartment || '',

      // 지급 항목
      basePay: Number(entity.pkrBasePay),
      otExtend: Number(entity.pkrOtExtend),
      otHoliday: Number(entity.pkrOtHoliday),
      otNight: Number(entity.pkrOtNight),
      otEtc: Number(entity.pkrOtEtc),
      annualLeave: Number(entity.pkrAnnualLeave),
      bonus: Number(entity.pkrBonus),

      // 비과세
      vehicleSub: Number(entity.pkrVehicleSub),
      mealAllow: Number(entity.pkrMealAllow),
      childcare: Number(entity.pkrChildcare),

      // 합계
      taxableTotal: Number(entity.pkrTaxableTotal),
      exemptTotal: Number(entity.pkrExemptTotal),
      grossTotal: Number(entity.pkrGrossTotal),

      // 4대보험
      pension: Number(entity.pkrPension),
      healthIns: Number(entity.pkrHealthIns),
      longtermCare: Number(entity.pkrLongtermCare),
      employIns: Number(entity.pkrEmployIns),

      // 보험 정산
      pensionSettle: Number(entity.pkrPensionSettle),
      healthSettle: Number(entity.pkrHealthSettle),
      longtermSettle: Number(entity.pkrLongtermSettle),
      employSettle: Number(entity.pkrEmploySettle),

      // 세금
      incomeTax: Number(entity.pkrIncomeTax),
      localTax: Number(entity.pkrLocalTax),
      yearendTax: Number(entity.pkrYearendTax),
      yearendLocal: Number(entity.pkrYearendLocal),

      // 기타
      prepaid: Number(entity.pkrPrepaid),

      // 최종
      deductionTotal: Number(entity.pkrDeductionTotal),
      netPay: Number(entity.pkrNetPay),
    };
  }
}
