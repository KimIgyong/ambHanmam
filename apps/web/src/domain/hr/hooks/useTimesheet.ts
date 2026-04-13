import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timesheetApiService } from '../service/timesheet.service';

const timesheetKeys = {
  all: ['hr-timesheet'] as const,
  monthly: (year: number, month: number) => [...timesheetKeys.all, 'monthly', year, month] as const,
};

export const useMonthlyTimesheet = (year: number, month: number) =>
  useQuery({
    queryKey: timesheetKeys.monthly(year, month),
    queryFn: () => timesheetApiService.getMonthlyTimesheet(year, month),
  });

export const useBatchUpsertTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      entries: Array<{
        employee_id: string;
        work_date: string;
        attendance_code?: string;
        work_hours?: number;
      }>;
      periodId?: string;
    }) => timesheetApiService.batchUpsert(params.entries, params.periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.all });
    },
  });
};
