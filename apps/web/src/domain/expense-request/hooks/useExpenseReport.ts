import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  expenseRequestService,
  CreateExecutionBody,
  UpdateExecutionBody,
  MonthlyReport,
  ForecastReport,
  ForecastItem,
} from '../service/expenseRequest.service';
import { useEntityId } from '@/domain/hr/hooks/useEntity';



export function useCreateExecution() {
  const qc = useQueryClient();
  const { t } = useTranslation('expenseRequest');
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateExecutionBody }) =>
      expenseRequestService.createExecution(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['expense-requests', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['expense-requests', 'stats'] });
      toast.success(t('message.executeSuccess'));
    },
  });
}

export function useUpdateExecution() {
  const qc = useQueryClient();
  const { t } = useTranslation('expenseRequest');
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExecutionBody }) =>
      expenseRequestService.updateExecution(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['expense-requests', 'detail', id] });
      toast.success(t('message.executeSuccess'));
    },
  });
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      expenseRequestService.uploadReceipt(id, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['expense-requests', 'detail', id] });
    },
  });
}

// ─── Reports ──────────────────────────────────────────────────────────

const REPORT_KEYS = {
  monthly: (year?: number, month?: number) =>
    ['expense-requests', 'report', 'monthly', year, month] as const,
  forecast: (year?: number, month?: number) =>
    ['expense-requests', 'report', 'forecast', year, month] as const,
  forecastPreview: (year?: number, month?: number) =>
    ['expense-requests', 'report', 'forecast-preview', year, month] as const,
};

export function useMonthlyReport(year: number, month: number) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: REPORT_KEYS.monthly(year, month),
    queryFn: () => expenseRequestService.getMonthlyReport(year, month),
    enabled: !!entityId && !!year && !!month,
    select: (res) => ((res.data as any)?.data ?? res.data) as MonthlyReport,
  });
}

export function useExportMonthlyReport() {
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      expenseRequestService.exportMonthlyReport(year, month),
    onSuccess: (res, { year, month }) => {
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-report-${year}-${String(month).padStart(2, '0')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function useForecastReport(year: number, month: number) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: REPORT_KEYS.forecast(year, month),
    queryFn: () => expenseRequestService.getForecast(year, month),
    enabled: !!entityId && !!year && !!month,
    select: (res) => ((res.data as any)?.data ?? null) as ForecastReport | null,
  });
}

export function useForecastPreview(year: number, month: number, enabled: boolean) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: REPORT_KEYS.forecastPreview(year, month),
    queryFn: () => expenseRequestService.getForecastPreview(year, month),
    enabled: !!entityId && !!year && !!month && enabled,
    select: (res) => ((res.data as any)?.data ?? []) as ForecastItem[],
  });
}

export function useCreateForecastReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof expenseRequestService.createForecast>[0]) =>
      expenseRequestService.createForecast(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expense-requests', 'report', 'forecast'] });
    },
  });
}

export function useUpdateForecastReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof expenseRequestService.updateForecast>[1];
    }) => expenseRequestService.updateForecast(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expense-requests', 'report', 'forecast'] });
    },
  });
}

export function useExportForecastReport() {
  return useMutation({
    mutationFn: ({ id, year: _year, month: _month }: { id: string; year: number; month: number }) =>
      expenseRequestService.exportForecast(id),
    onSuccess: (res, { year, month }) => {
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-forecast-${year}-${String(month).padStart(2, '0')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function useSubmitForecastReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseRequestService.submitForecast(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expense-requests', 'report', 'forecast'] });
    },
  });
}

export function useApproveForecastReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseRequestService.approveForecast(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expense-requests', 'report', 'forecast'] });
    },
  });
}

export function useRejectForecastReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseRequestService.rejectForecast(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expense-requests', 'report', 'forecast'] });
    },
  });
}
