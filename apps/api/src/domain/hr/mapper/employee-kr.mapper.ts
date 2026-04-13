import { HrEmployeeKrResponse } from '@amb/types';
import { EmployeeKrEntity } from '../entity/employee-kr.entity';

export class EmployeeKrMapper {
  static toResponse(entity: EmployeeKrEntity): HrEmployeeKrResponse {
    return {
      employeeId: entity.empId,
      residentNo: entity.ekrResidentNo
        ? EmployeeKrMapper.maskResidentNo(entity.ekrResidentNo)
        : null,
      employeeType: entity.ekrEmployeeType,
      pensionNo: entity.ekrPensionNo || null,
      healthInsNo: entity.ekrHealthInsNo || null,
      employInsNo: entity.ekrEmployInsNo || null,
      pensionExempt: entity.ekrPensionExempt,
      healthExempt: entity.ekrHealthExempt,
      employExempt: entity.ekrEmployExempt,
      taxDependents: entity.ekrTaxDependents,
      withholdingRate: entity.ekrWithholdingRate,
      bankAccount: entity.ekrBankAccount || null,
    };
  }

  private static maskResidentNo(residentNo: string): string {
    if (residentNo.length >= 7) {
      return residentNo.substring(0, 6) + '-' + residentNo.charAt(6) + '******';
    }
    return residentNo.substring(0, Math.min(3, residentNo.length)) + '***';
  }
}
