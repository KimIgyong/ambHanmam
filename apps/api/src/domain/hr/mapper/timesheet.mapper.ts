import { HrTimesheetResponse, HrOtRecordResponse } from '@amb/types';
import { TimesheetEntity } from '../entity/timesheet.entity';
import { OtRecordEntity } from '../entity/ot-record.entity';

export class TimesheetMapper {
  static toTimesheetResponse(entity: TimesheetEntity): HrTimesheetResponse {
    return {
      timesheetId: entity.tmsId,
      employeeId: entity.empId,
      employeeCode: entity.employee?.empCode || '',
      employeeName: entity.employee?.empFullName || '',
      periodId: entity.pypId || null,
      workDate: entity.tmsWorkDate,
      attendanceCode: entity.tmsAttendanceCode || null,
      workHours: Number(entity.tmsWorkHours),
    };
  }

  static toOtRecordResponse(entity: OtRecordEntity): HrOtRecordResponse {
    return {
      otRecordId: entity.otrId,
      employeeId: entity.empId,
      employeeCode: entity.employee?.empCode || '',
      employeeName: entity.employee?.empFullName || '',
      date: entity.otrDate,
      timeStart: entity.otrTimeStart,
      timeEnd: entity.otrTimeEnd,
      projectDescription: entity.otrProjectDescription || null,
      otType: entity.otrType as HrOtRecordResponse['otType'],
      actualHours: Number(entity.otrActualHours),
      convertedHours: Number(entity.otrConvertedHours),
      approvalStatus: entity.otrApprovalStatus as HrOtRecordResponse['approvalStatus'],
      approvedBy: entity.otrApprovedBy || null,
      createdAt: entity.otrCreatedAt.toISOString(),
    };
  }
}
