import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApiService } from '../service/leave.service';

const leaveKeys = {
  all: ['hr-leave'] as const,
  balances: (year: number) => [...leaveKeys.all, 'balances', year] as const,
  employee: (empId: string, year: number) => [...leaveKeys.all, 'employee', empId, year] as const,
};

export const useLeaveBalances = (year: number) =>
  useQuery({
    queryKey: leaveKeys.balances(year),
    queryFn: () => leaveApiService.getLeaveBalances(year),
  });

export const useEmployeeLeaveBalance = (empId: string, year: number) =>
  useQuery({
    queryKey: leaveKeys.employee(empId, year),
    queryFn: () => leaveApiService.getEmployeeLeaveBalance(empId, year),
    enabled: !!empId,
  });

export const useRecalculateLeave = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (year: number) => leaveApiService.recalculateLeave(year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
};

export const useUpdateLeaveBalance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      empId: string;
      year: number;
      data: { entitlement?: number; used?: number; carry_forward?: number; ot_converted?: number };
    }) => leaveApiService.updateLeaveBalance(params.empId, params.year, params.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
};
