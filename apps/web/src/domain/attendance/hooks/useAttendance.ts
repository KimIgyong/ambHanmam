import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../service/attendance.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const attendanceKeys = {
  all: ['attendances'] as const,
  list: (entityId?: string, dateFrom?: string, dateTo?: string) => [...attendanceKeys.all, 'list', entityId, dateFrom, dateTo] as const,
  team: (entityId?: string, dateFrom?: string, dateTo?: string) => [...attendanceKeys.all, 'team', entityId, dateFrom, dateTo] as const,
};

export const useAttendanceList = (dateFrom: string, dateTo: string) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: attendanceKeys.list(entityId, dateFrom, dateTo),
    queryFn: () => attendanceService.getAttendances({ date_from: dateFrom, date_to: dateTo }),
    staleTime: 1000 * 60,
    enabled: !!entityId && !!dateFrom && !!dateTo,
  });
};

export const useTeamAttendanceList = (dateFrom: string, dateTo: string) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: attendanceKeys.team(entityId, dateFrom, dateTo),
    queryFn: () => attendanceService.getTeamAttendances({ date_from: dateFrom, date_to: dateTo }),
    staleTime: 1000 * 60,
    enabled: !!entityId && !!dateFrom && !!dateTo,
  });
};

export const useCreateAttendances = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      schedules: Array<{ date: string; type: string; start_time?: string }>;
    }) => attendanceService.createAttendances(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: { type?: string; start_time?: string };
    }) => attendanceService.updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
};

export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceService.deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
};

export const useApproveAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      attendanceService.approveAttendance(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['today'] });
    },
  });
};

export const useAttendanceMembers = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: [...attendanceKeys.all, 'members', entityId],
    queryFn: () => attendanceService.getAttendanceMembers(),
    staleTime: 1000 * 60 * 5,
    enabled: !!entityId,
  });
};

export const useUpdateAttendanceMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (members: Array<{ user_id: string; hidden: boolean; order: number | null }>) =>
      attendanceService.updateAttendanceMembers(members),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
};

export const useAmendAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string;
      data: { type: string; start_time?: string; note: string };
    }) => attendanceService.amendAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
};

export const useAttendancePolicy = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: [...attendanceKeys.all, 'policy', entityId],
    queryFn: () => attendanceService.getPolicy(),
    staleTime: 1000 * 60 * 5,
    enabled: !!entityId,
  });
};

export const useUpdateAttendancePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      remote_default_count?: number;
      remote_extra_count?: number;
      remote_block_on_exceed?: boolean;
      leave_auto_deduct?: boolean;
      half_leave_auto_deduct?: boolean;
    }) => attendanceService.updatePolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
};
