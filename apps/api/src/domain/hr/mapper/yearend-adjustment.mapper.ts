import { YearendAdjustmentEntity } from '../entity/yearend-adjustment.entity';
import { HrYearendAdjustmentResponse } from '@amb/types';

export class YearendAdjustmentMapper {
  static toResponse(entity: YearendAdjustmentEntity): HrYearendAdjustmentResponse {
    return {
      id: entity.yeaId,
      employeeId: entity.empId,
      employeeCode: entity.employee?.empCode || '',
      employeeName: entity.employee?.empFullName || '',
      department: entity.employee?.empDepartment || '',
      taxYear: entity.yeaTaxYear,
      settleTax: Number(entity.yeaSettleTax),
      settleLocal: Number(entity.yeaSettleLocal),
      appliedMonth: entity.yeaAppliedMonth,
      status: entity.yeaStatus,
      note: entity.yeaNote,
    };
  }
}
