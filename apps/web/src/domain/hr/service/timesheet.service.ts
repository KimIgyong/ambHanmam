import { apiClient } from '@/lib/api-client';
import { HrTimesheetMonthlyResponse } from '@amb/types';

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class TimesheetApiService {
  private readonly basePath = '/hr/timesheet';

  getMonthlyTimesheet = (year: number, month: number) =>
    apiClient
      .get<ListResponse<HrTimesheetMonthlyResponse>>(this.basePath, { params: { year, month } })
      .then((r) => r.data.data);

  batchUpsert = (entries: Array<{
    employee_id: string;
    work_date: string;
    attendance_code?: string;
    work_hours?: number;
  }>, periodId?: string) =>
    apiClient
      .put<SingleResponse<{ updatedCount: number }>>(`${this.basePath}/batch`, {
        entries,
        period_id: periodId,
      })
      .then((r) => r.data.data);
}

export const timesheetApiService = new TimesheetApiService();
