import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { HrTimesheetMonthlyResponse } from '@amb/types';
import { TimesheetEntity } from '../entity/timesheet.entity';
import { EmployeeEntity } from '../entity/employee.entity';
import { TimesheetMapper } from '../mapper/timesheet.mapper';
import { UpsertTimesheetRequest } from '../dto/request/upsert-timesheet.request';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { SystemParamService } from './system-param.service';

@Injectable()
export class TimesheetService {
  constructor(
    @InjectRepository(TimesheetEntity)
    private readonly timesheetRepo: Repository<TimesheetEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    private readonly systemParamService: SystemParamService,
  ) {}

  async getMonthlyTimesheet(entityId: string, year: number, month: number): Promise<HrTimesheetMonthlyResponse[]> {
    const employees = await this.employeeRepo.find({
      where: [
        { empStatus: 'OFFICIAL', entId: entityId },
        { empStatus: 'PROBATION', entId: entityId },
      ],
      order: { empCode: 'ASC' },
    });

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0);
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    const empIds = employees.map((e) => e.empId);
    let timesheets: TimesheetEntity[] = [];
    if (empIds.length > 0) {
      timesheets = await this.timesheetRepo
        .createQueryBuilder('tms')
        .where('tms.emp_id IN (:...empIds)', { empIds })
        .andWhere('tms.tms_work_date >= :startDate', { startDate })
        .andWhere('tms.tms_work_date <= :endDate', { endDate: endDateStr })
        .getMany();
    }

    const holidays = await this.systemParamService.getHolidayDatesForMonth(year, month);
    const holidaySet = new Set(holidays);

    const timesheetMap = new Map<string, Map<string, TimesheetEntity>>();
    for (const ts of timesheets) {
      if (!timesheetMap.has(ts.empId)) {
        timesheetMap.set(ts.empId, new Map());
      }
      timesheetMap.get(ts.empId)!.set(ts.tmsWorkDate, ts);
    }

    return employees.map((emp) => {
      const empTimesheets = timesheetMap.get(emp.empId) || new Map();
      const entries: Record<string, { attendanceCode: string | null; workHours: number }> = {};
      let workDays = 0;
      let leaveDays = 0;
      let holidayCount = 0;
      let absentDays = 0;

      const daysInMonth = endDate.getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, month - 1, d).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const ts = empTimesheets.get(dateStr);
        if (ts) {
          entries[dateStr] = {
            attendanceCode: ts.tmsAttendanceCode,
            workHours: Number(ts.tmsWorkHours),
          };
          if (ts.tmsAttendanceCode === '8') workDays++;
          else if (ts.tmsAttendanceCode === '4') workDays += 0.5;
          else if (['AL', 'PL', 'SL', 'M'].includes(ts.tmsAttendanceCode)) leaveDays++;
          else if (ts.tmsAttendanceCode === 'H') holidayCount++;
          else if (ts.tmsAttendanceCode === 'AB') absentDays++;
          else if (ts.tmsAttendanceCode === 'RE') workDays++;
        } else if (holidaySet.has(dateStr)) {
          entries[dateStr] = { attendanceCode: 'H', workHours: 0 };
          holidayCount++;
        } else if (isWeekend) {
          entries[dateStr] = { attendanceCode: null, workHours: 0 };
        } else {
          entries[dateStr] = { attendanceCode: null, workHours: 0 };
        }
      }

      return {
        employeeId: emp.empId,
        employeeCode: emp.empCode,
        employeeName: emp.empFullName,
        department: emp.empDepartment,
        entries,
        summary: { workDays, leaveDays, holidays: holidayCount, absentDays },
      };
    });
  }

  async batchUpsert(entityId: string, dto: UpsertTimesheetRequest): Promise<number> {
    const empIds = [...new Set(dto.entries.map((e) => e.employee_id))];
    if (empIds.length > 0) {
      const validEmployees = await this.employeeRepo
        .createQueryBuilder('emp')
        .where('emp.empId IN (:...empIds)', { empIds })
        .andWhere('emp.entId = :entityId', { entityId })
        .getMany();
      const validEmpIds = new Set(validEmployees.map((e) => e.empId));
      const invalidIds = empIds.filter((id) => !validEmpIds.has(id));
      if (invalidIds.length > 0) {
        throw new NotFoundException(`Employees not found in this entity: ${invalidIds.join(', ')}`);
      }
    }

    let count = 0;
    for (const entry of dto.entries) {
      const existing = await this.timesheetRepo.findOne({
        where: { empId: entry.employee_id, tmsWorkDate: entry.work_date },
      });

      if (existing) {
        existing.tmsAttendanceCode = entry.attendance_code || undefined as any;
        existing.tmsWorkHours = entry.work_hours ?? (entry.attendance_code === '8' ? 8 : entry.attendance_code === '4' ? 4 : 0);
        if (dto.period_id) existing.pypId = dto.period_id;
        await this.timesheetRepo.save(existing);
      } else {
        const ts = this.timesheetRepo.create({
          empId: entry.employee_id,
          tmsWorkDate: entry.work_date,
          tmsAttendanceCode: entry.attendance_code || undefined,
          tmsWorkHours: entry.work_hours ?? (entry.attendance_code === '8' ? 8 : entry.attendance_code === '4' ? 4 : 0),
          pypId: dto.period_id || undefined,
        } as DeepPartial<TimesheetEntity>);
        await this.timesheetRepo.save(ts as TimesheetEntity);
      }
      count++;
    }
    return count;
  }
}
