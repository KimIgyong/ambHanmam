import { AttendanceResponse, AttendanceAmendmentResponse } from '@amb/types';
import { AttendanceEntity } from '../entity/attendance.entity';
import { AttendanceAmendmentEntity } from '../entity/attendance-amendment.entity';

export class AttendanceMapper {
  static toResponse(entity: AttendanceEntity): AttendanceResponse {
    const amendments = entity.amendments
      ?.sort((a, b) => new Date(a.aamCreatedAt).getTime() - new Date(b.aamCreatedAt).getTime())
      .map(AttendanceMapper.toAmendmentResponse) || [];

    return {
      attendanceId: entity.attId,
      userId: entity.usrId,
      userName: entity.user?.usrName || '',
      date:
        entity.attDate instanceof Date
          ? entity.attDate.toISOString().split('T')[0]
          : String(entity.attDate),
      type: entity.attType as AttendanceResponse['type'],
      startTime: entity.attStartTime || null,
      endTime: entity.attEndTime || null,
      approvalStatus: entity.attApprovalStatus || 'APPROVED',
      createdAt: entity.attCreatedAt.toISOString(),
      updatedAt: entity.attUpdatedAt.toISOString(),
      amendments,
    };
  }

  static toAmendmentResponse(entity: AttendanceAmendmentEntity): AttendanceAmendmentResponse {
    return {
      amendmentId: entity.aamId,
      attendanceId: entity.attId,
      type: entity.aamType,
      startTime: entity.aamStartTime || null,
      endTime: entity.aamEndTime || null,
      note: entity.aamNote,
      amendedBy: entity.aamAmendedBy,
      amendedByName: entity.amendedByUser?.usrName || '',
      createdAt: entity.aamCreatedAt.toISOString(),
    };
  }
}
