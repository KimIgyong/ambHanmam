import { BusinessIncomeEntity } from '../entity/business-income.entity';
import { HrBusinessIncomeResponse } from '@amb/types';

export class BusinessIncomeMapper {
  static toResponse(entity: BusinessIncomeEntity): HrBusinessIncomeResponse {
    return {
      paymentId: entity.bipId,
      entityId: entity.entId,
      freelancerId: entity.frlId,
      freelancerCode: entity.freelancer?.frlCode || '',
      freelancerName: entity.freelancer?.frlFullName || '',
      yearMonth: entity.bipYearMonth,
      paymentDate: entity.bipPaymentDate || null,
      grossAmount: Number(entity.bipGrossAmount),
      weeklyHoliday: Number(entity.bipWeeklyHoliday),
      incentive: Number(entity.bipIncentive),
      totalAmount: Number(entity.bipTotalAmount),
      prepaid: Number(entity.bipPrepaid),
      incomeTax: Number(entity.bipIncomeTax),
      localTax: Number(entity.bipLocalTax),
      employIns: Number(entity.bipEmployIns),
      accidentIns: Number(entity.bipAccidentIns),
      studentLoan: Number(entity.bipStudentLoan),
      deductionTotal: Number(entity.bipDeductionTotal),
      netAmount: Number(entity.bipNetAmount),
      status: entity.bipStatus,
    };
  }
}
