import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../service/report.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

export const reportKeys = {
  all: ['work-reports'] as const,
  list: (entityId?: string, type?: string) => [...reportKeys.all, 'list', entityId, type] as const,
  detail: (id: string) => [...reportKeys.all, 'detail', id] as const,
};

export const useWorkReports = (type?: string) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: reportKeys.list(entityId, type),
    queryFn: () => reportService.getReports(type),
    staleTime: 1000 * 60,
    enabled: !!entityId,
  });
};

export const useWorkReportDetail = (id: string | null) => {
  return useQuery({
    queryKey: reportKeys.detail(id || ''),
    queryFn: () => reportService.getReportById(id!),
    enabled: !!id,
  });
};

export const useDeleteWorkReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });
};
