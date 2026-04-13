import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { krSettingsApiService } from '../service/kr-settings.service';
import { useEntityId } from './useEntity';

const krSettingsKeys = {
  all: ['hr-kr-settings'] as const,
  insuranceParams: () => [...krSettingsKeys.all, 'insurance-params'] as const,
  taxTableSummary: () => [...krSettingsKeys.all, 'tax-table-summary'] as const,
  taxTableYear: (year: number) => [...krSettingsKeys.all, 'tax-table', year] as const,
};

// Insurance Params
export const useInsuranceParamsKr = () => {
  const entityId = useEntityId();
  return useQuery({
    queryKey: krSettingsKeys.insuranceParams(),
    queryFn: () => krSettingsApiService.getInsuranceParams(),
    enabled: !!entityId,
  });
};

export const useCreateInsuranceParamKr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => krSettingsApiService.createInsuranceParam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: krSettingsKeys.insuranceParams() });
    },
  });
};

export const useDeleteInsuranceParamKr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => krSettingsApiService.deleteInsuranceParam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: krSettingsKeys.insuranceParams() });
    },
  });
};

// Tax Table
export const useTaxTableSummary = () => {
  const entityId = useEntityId();
  return useQuery({
    queryKey: krSettingsKeys.taxTableSummary(),
    queryFn: () => krSettingsApiService.getTaxTableSummary(),
    enabled: !!entityId,
  });
};

export const useTaxTableByYear = (year: number, page = 1) => {
  const entityId = useEntityId();
  return useQuery({
    queryKey: [...krSettingsKeys.taxTableYear(year), page],
    queryFn: () => krSettingsApiService.getTaxTableByYear(year, page),
    enabled: year > 0 && !!entityId,
  });
};

export const useImportTaxTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ year, csvContent }: { year: number; csvContent: string }) =>
      krSettingsApiService.importTaxTable(year, csvContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: krSettingsKeys.all });
    },
  });
};

export const useDeleteTaxTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (year: number) => krSettingsApiService.deleteTaxTable(year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: krSettingsKeys.all });
    },
  });
};
