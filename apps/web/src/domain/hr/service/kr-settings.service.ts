import { apiClient } from '@/lib/api-client';
import { HrInsuranceParamsKrResponse } from '@amb/types';

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

export interface TaxTableSummary {
  year: number;
  rowCount: number;
  salaryRangeCount: number;
}

export interface TaxTableRow {
  salaryFrom: number;
  salaryTo: number;
  dependents: number;
  taxAmount: number;
}

class KrSettingsApiService {
  // Insurance Params
  getInsuranceParams = () =>
    apiClient
      .get<ListResponse<HrInsuranceParamsKrResponse>>('/hr/kr/insurance-params')
      .then((r) => r.data.data);

  createInsuranceParam = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrInsuranceParamsKrResponse>>('/hr/kr/insurance-params', data)
      .then((r) => r.data.data);

  deleteInsuranceParam = (id: string) =>
    apiClient.delete(`/hr/kr/insurance-params/${id}`);

  // Tax Table
  getTaxTableSummary = () =>
    apiClient
      .get<SingleResponse<TaxTableSummary[]>>('/hr/kr/tax-table')
      .then((r) => r.data.data);

  getTaxTableByYear = (year: number, page = 1, limit = 50) =>
    apiClient
      .get<SingleResponse<{ rows: TaxTableRow[]; total: number }>>(`/hr/kr/tax-table/${year}`, { params: { page, limit } })
      .then((r) => r.data.data);

  importTaxTable = (year: number, csvContent: string) =>
    apiClient
      .post<SingleResponse<{ importedCount: number }>>('/hr/kr/tax-table/import', { year, csv_content: csvContent })
      .then((r) => r.data.data);

  deleteTaxTable = (year: number) =>
    apiClient.delete(`/hr/kr/tax-table/${year}`);
}

export const krSettingsApiService = new KrSettingsApiService();
