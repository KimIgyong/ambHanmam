import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { HrLeaveRequestResponse, HrLeaveBalanceResponse } from '@amb/types';
import { LeaveRequestEntity } from '../entity/leave-request.entity';
import { EmployeeEntity } from '../entity/employee.entity';
import { LeaveBalanceEntity } from '../entity/leave-balance.entity';
import { TimesheetEntity } from '../entity/timesheet.entity';
import { HolidayEntity } from '../entity/holiday.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRequestRepo: Repository<LeaveRequestEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(LeaveBalanceEntity)
    private readonly leaveBalanceRepo: Repository<LeaveBalanceEntity>,
    @InjectRepository(TimesheetEntity)
    private readonly timesheetRepo: Repository<TimesheetEntity>,
    @InjectRepository(HolidayEntity)
    private readonly holidayRepo: Repository<HolidayEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── 본인용 ───

  async getMyLeaveBalance(userId: string, year: number): Promise<HrLeaveBalanceResponse> {
    const emp = await this.employeeRepo.findOne({ where: { usrId: userId } });
    if (!emp) {
      // HR 직원 레코드가 없는 사용자 → 빈 잔여 반환
      return {
        leaveBalanceId: '',
        employeeId: '',
        employeeCode: '',
        employeeName: '',
        department: '',
        year,
        entitlement: 0,
        used: 0,
        otConverted: 0,
        carryForward: 0,
        remaining: 0,
        startDate: '',
        yearsOfService: 0,
      };
    }

    const balance = await this.leaveBalanceRepo.findOne({
      where: { empId: emp.empId, lvbYear: year },
    });

    const yearsOfService = this.calcYearsOfService(emp.empStartDate);

    return {
      leaveBalanceId: balance?.lvbId || '',
      employeeId: emp.empId,
      employeeCode: emp.empCode,
      employeeName: emp.empFullName,
      department: emp.empDepartment,
      year,
      entitlement: balance ? Number(balance.lvbEntitlement) : 0,
      used: balance ? Number(balance.lvbUsed) : 0,
      otConverted: balance ? Number(balance.lvbOtConverted) : 0,
      carryForward: balance ? Number(balance.lvbCarryForward) : 0,
      remaining: balance ? Number(balance.lvbRemaining) : 0,
      startDate: emp.empStartDate,
      yearsOfService,
    };
  }

  async getMyLeaveRequests(userId: string, year: number): Promise<HrLeaveRequestResponse[]> {
    const emp = await this.employeeRepo.findOne({ where: { usrId: userId } });
    if (!emp) return [];
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const requests = await this.leaveRequestRepo
      .createQueryBuilder('lrq')
      .where('lrq.emp_id = :empId', { empId: emp.empId })
      .andWhere('lrq.lrq_start_date >= :start', { start: startOfYear })
      .andWhere('lrq.lrq_start_date <= :end', { end: endOfYear })
      .orderBy('lrq.lrq_created_at', 'DESC')
      .getMany();

    return this.mapResponses(requests);
  }

  async createLeaveRequest(
    userId: string,
    entId: string | null,
    dto: { type: string; start_date: string; end_date: string; reason?: string },
  ): Promise<HrLeaveRequestResponse> {
    const emp = await this.findEmployeeByUserId(userId);
    const year = new Date(dto.start_date).getFullYear();

    // 차감 일수 계산
    const days = await this.calcLeaveDays(dto.type, dto.start_date, dto.end_date);

    // 연차 차감 필요한 유형만 잔여 검증
    if (['ANNUAL', 'AM_HALF', 'PM_HALF'].includes(dto.type)) {
      const balance = await this.leaveBalanceRepo.findOne({
        where: { empId: emp.empId, lvbYear: year },
      });
      const remaining = balance ? Number(balance.lvbRemaining) : 0;

      // 이미 PENDING 중인 건의 days도 고려
      const pendingDays = await this.leaveRequestRepo
        .createQueryBuilder('lrq')
        .select('COALESCE(SUM(lrq.lrq_days), 0)', 'total')
        .where('lrq.emp_id = :empId', { empId: emp.empId })
        .andWhere('lrq.lrq_status = :status', { status: 'PENDING' })
        .andWhere('EXTRACT(YEAR FROM lrq.lrq_start_date) = :year', { year })
        .getRawOne();

      const totalPending = Number(pendingDays?.total || 0);
      if (remaining - totalPending < days) {
        throw new BadRequestException('Insufficient leave balance');
      }
    }

    // 중복 일자 체크
    const overlap = await this.leaveRequestRepo
      .createQueryBuilder('lrq')
      .where('lrq.emp_id = :empId', { empId: emp.empId })
      .andWhere('lrq.lrq_status IN (:...statuses)', { statuses: ['PENDING', 'APPROVED'] })
      .andWhere('lrq.lrq_start_date <= :endDate', { endDate: dto.end_date })
      .andWhere('lrq.lrq_end_date >= :startDate', { startDate: dto.start_date })
      .getCount();

    if (overlap > 0) {
      throw new BadRequestException('Overlapping leave request exists');
    }

    const entity = this.leaveRequestRepo.create({
      empId: emp.empId,
      usrId: userId,
      entId: entId || emp.entId,
      lrqType: dto.type,
      lrqStartDate: dto.start_date,
      lrqEndDate: dto.end_date,
      lrqDays: days,
      lrqReason: dto.reason || null,
      lrqStatus: 'PENDING',
    });

    const saved = await this.leaveRequestRepo.save(entity);
    return (await this.mapResponses([saved]))[0];
  }

  async cancelLeaveRequest(userId: string, requestId: string): Promise<void> {
    const request = await this.leaveRequestRepo.findOne({ where: { lrqId: requestId } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.usrId !== userId) throw new ForbiddenException('Not your request');
    if (request.lrqStatus !== 'PENDING') {
      throw new BadRequestException('Only PENDING requests can be cancelled');
    }
    request.lrqStatus = 'CANCELLED';
    await this.leaveRequestRepo.save(request);
  }

  // ─── 관리자용 ───

  async getLeaveRequests(entId: string | null, params: {
    status?: string; year?: number; page?: number; limit?: number;
  }): Promise<{ data: HrLeaveRequestResponse[]; total: number }> {
    const qb = this.leaveRequestRepo.createQueryBuilder('lrq');

    if (entId) {
      qb.andWhere('lrq.ent_id = :entId', { entId });
    }
    if (params.status) {
      qb.andWhere('lrq.lrq_status = :status', { status: params.status });
    }
    if (params.year) {
      qb.andWhere('EXTRACT(YEAR FROM lrq.lrq_start_date) = :year', { year: params.year });
    }

    qb.orderBy('lrq.lrq_created_at', 'DESC');

    const page = params.page || 1;
    const limit = params.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const data = await this.mapResponses(rows);

    return { data, total };
  }

  async approveLeaveRequest(requestId: string, approvedByUserId: string): Promise<void> {
    const request = await this.leaveRequestRepo.findOne({ where: { lrqId: requestId } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.lrqStatus !== 'PENDING') {
      throw new BadRequestException('Only PENDING requests can be approved');
    }

    await this.dataSource.transaction(async (manager) => {
      // 1. 상태 변경
      request.lrqStatus = 'APPROVED';
      request.lrqApprovedBy = approvedByUserId;
      await manager.save(request);

      // 2. 연차 차감 (ANNUAL, AM_HALF, PM_HALF만)
      if (['ANNUAL', 'AM_HALF', 'PM_HALF'].includes(request.lrqType)) {
        const year = new Date(request.lrqStartDate).getFullYear();
        const balance = await manager.findOne(LeaveBalanceEntity, {
          where: { empId: request.empId, lvbYear: year },
        });
        if (balance) {
          balance.lvbUsed = Number(balance.lvbUsed) + Number(request.lrqDays);
          balance.lvbRemaining = Number(balance.lvbRemaining) - Number(request.lrqDays);
          if (balance.lvbRemaining < 0) balance.lvbRemaining = 0;
          await manager.save(balance);
        }
      }

      // 3. Timesheet 자동 삽입
      const code = ['AM_HALF', 'PM_HALF'].includes(request.lrqType) ? 'AH' : 'AL';
      const workHours = ['AM_HALF', 'PM_HALF'].includes(request.lrqType) ? 4 : 0;
      const dates = this.getBusinessDatesInRange(request.lrqStartDate, request.lrqEndDate);
      const holidays = await manager.find(HolidayEntity, {
        where: { holYear: new Date(request.lrqStartDate).getFullYear() },
      });
      const holidaySet = new Set(holidays.map((h) => h.holDate));

      for (const date of dates) {
        if (holidaySet.has(date)) continue;

        // Upsert: 기존 데이터가 있으면 코드만 업데이트
        const existing = await manager.findOne(TimesheetEntity, {
          where: { empId: request.empId, tmsWorkDate: date },
        });
        if (existing) {
          existing.tmsAttendanceCode = code;
          existing.tmsWorkHours = workHours;
          await manager.save(existing);
        } else {
          const ts = manager.create(TimesheetEntity, {
            empId: request.empId,
            tmsWorkDate: date,
            tmsAttendanceCode: code,
            tmsWorkHours: workHours,
          });
          await manager.save(ts);
        }
      }
    });
  }

  async rejectLeaveRequest(requestId: string, approvedByUserId: string, reason: string): Promise<void> {
    const request = await this.leaveRequestRepo.findOne({ where: { lrqId: requestId } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.lrqStatus !== 'PENDING') {
      throw new BadRequestException('Only PENDING requests can be rejected');
    }
    request.lrqStatus = 'REJECTED';
    request.lrqApprovedBy = approvedByUserId;
    request.lrqRejectedReason = reason;
    await this.leaveRequestRepo.save(request);
  }

  // ─── 헬퍼 ───

  private async findEmployeeByUserId(userId: string): Promise<EmployeeEntity> {
    const emp = await this.employeeRepo.findOne({ where: { usrId: userId } });
    if (!emp) throw new NotFoundException('Employee record not found for this user');
    return emp;
  }

  private async calcLeaveDays(type: string, startDate: string, endDate: string): Promise<number> {
    if (['AM_HALF', 'PM_HALF'].includes(type)) return 0.5;

    const year = new Date(startDate).getFullYear();
    const holidays = await this.holidayRepo.find({ where: { holYear: year } });
    const holidaySet = new Set(holidays.map((h) => h.holDate));

    const dates = this.getBusinessDatesInRange(startDate, endDate);
    return dates.filter((d) => !holidaySet.has(d)).length;
  }

  private getBusinessDatesInRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // 주말 제외
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private calcYearsOfService(startDate: string): number {
    const start = new Date(startDate);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  private async mapResponses(requests: LeaveRequestEntity[]): Promise<HrLeaveRequestResponse[]> {
    if (requests.length === 0) return [];

    const empIds = [...new Set(requests.map((r) => r.empId))];
    const employees = await this.employeeRepo.find({ where: { empId: In(empIds) } });
    const empMap = new Map(employees.map((e) => [e.empId, e]));

    const approverIds = requests.map((r) => r.lrqApprovedBy).filter(Boolean) as string[];
    let approverMap = new Map<string, string>();
    if (approverIds.length > 0) {
      const approvers = await this.userRepo.find({ where: { usrId: In(approverIds) } });
      approverMap = new Map(approvers.map((u) => [u.usrId, u.usrName]));
    }

    return requests.map((r) => {
      const emp = empMap.get(r.empId);
      return {
        id: r.lrqId,
        employeeId: r.empId,
        employeeName: emp?.empFullName || 'Unknown',
        employeeCode: emp?.empCode || '',
        department: emp?.empDepartment || '',
        type: r.lrqType as HrLeaveRequestResponse['type'],
        startDate: r.lrqStartDate,
        endDate: r.lrqEndDate,
        days: Number(r.lrqDays),
        reason: r.lrqReason,
        status: r.lrqStatus as HrLeaveRequestResponse['status'],
        approvedBy: r.lrqApprovedBy,
        approverName: r.lrqApprovedBy ? approverMap.get(r.lrqApprovedBy) || null : null,
        rejectedReason: r.lrqRejectedReason,
        createdAt: r.lrqCreatedAt?.toISOString?.() || '',
      };
    });
  }
}
