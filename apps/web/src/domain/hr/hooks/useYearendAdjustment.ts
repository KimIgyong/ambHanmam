import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { yearendAdjustmentApiService } from '../service/yearend-adjustment.service';
import { useEntityId } from './useEntity';

const KEYS = {
  list: (taxYear: number) => ['yearend-adjustment', 'list', taxYear] as const,
  detail: (id: string) => ['yearend-adjustment', 'detail', id] as const,
};

export function useYearendList(taxYear: number) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.list(taxYear),
    queryFn: () => yearendAdjustmentApiService.getList(taxYear),
    enabled: !!entityId,
  });
}

export function useYearendDetail(id: string) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => yearendAdjustmentApiService.getById(id),
    enabled: !!id && !!entityId,
  });
}

export function useCreateYearend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      yearendAdjustmentApiService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['yearend-adjustment'] }),
  });
}

export function useUpdateYearend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      yearendAdjustmentApiService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['yearend-adjustment'] }),
  });
}

export function useDeleteYearend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => yearendAdjustmentApiService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['yearend-adjustment'] }),
  });
}

export function useApplyYearend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, periodId }: { id: string; periodId: string }) =>
      yearendAdjustmentApiService.applyToPayroll(id, periodId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['yearend-adjustment'] }),
  });
}

export function useApplyBatchYearend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taxYear, periodId }: { taxYear: number; periodId: string }) =>
      yearendAdjustmentApiService.applyBatch(taxYear, periodId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['yearend-adjustment'] }),
  });
}

export function useImportYearend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => yearendAdjustmentApiService.importExcel(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['yearend-adjustment'] }),
  });
}
