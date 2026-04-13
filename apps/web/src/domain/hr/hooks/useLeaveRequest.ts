import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveRequestApiService } from '../service/leave-request.service';

const leaveRequestKeys = {
  all: ['hr-leave-request'] as const,
  myBalance: (year: number) => [...leaveRequestKeys.all, 'my-balance', year] as const,
  myRequests: (year: number) => [...leaveRequestKeys.all, 'my-requests', year] as const,
  adminList: (params: Record<string, unknown>) => [...leaveRequestKeys.all, 'admin', params] as const,
};

// ─── 본인용 ───

export const useMyLeaveBalance = (year: number) =>
  useQuery({
    queryKey: leaveRequestKeys.myBalance(year),
    queryFn: () => leaveRequestApiService.getMyBalance(year),
  });

export const useMyLeaveRequests = (year: number) =>
  useQuery({
    queryKey: leaveRequestKeys.myRequests(year),
    queryFn: () => leaveRequestApiService.getMyRequests(year),
  });

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveRequestApiService.createRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
};

export const useCancelLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveRequestApiService.cancelRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
};

// ─── 관리자용 ───

export const useLeaveRequests = (params: {
  status?: string;
  year?: number;
  page?: number;
  limit?: number;
}) =>
  useQuery({
    queryKey: leaveRequestKeys.adminList(params as Record<string, unknown>),
    queryFn: () => leaveRequestApiService.getRequests(params),
  });

export const useApproveLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveRequestApiService.approveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
};

export const useRejectLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; reason: string }) =>
      leaveRequestApiService.rejectRequest(params.id, params.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestKeys.all });
    },
  });
};
