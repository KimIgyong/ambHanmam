import { apiClient } from '@/lib/api-client';

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

export interface DashboardSummary {
  monthlyRevenue: number;
  receivableOutstanding: number;
  receivableCount: number;
  payableOutstanding: number;
  payableCount: number;
  expiringContracts: number;
  overdueCount: number;
}

export interface RevenueSummaryItem {
  month: number;
  receivable: number;
  payable: number;
  currency: string;
}

export interface OutstandingItem {
  invoiceId: string;
  number: string;
  direction: string;
  partnerName: string;
  date: string;
  dueDate: string | null;
  total: number;
  paidAmount: number;
  outstanding: number;
  currency: string;
  status: string;
  isOverdue: boolean;
}

export interface ContractTimelineItem {
  contractId: string;
  title: string;
  partnerName: string;
  direction: string;
  endDate: string;
  amount: number;
  currency: string;
  autoRenew: boolean;
  daysRemaining: number;
}

export interface PartnerDistItem {
  type: string;
  count: number;
}

export interface MonthlyMatrixPartner {
  partnerId: string;
  name: string;
  code: string;
}

export interface MonthlyMatrixValue {
  month: number;
  receivable: number;
  payable: number;
}

export interface MonthlyMatrixData {
  partners: MonthlyMatrixPartner[];
  data: { partnerId: string; values: MonthlyMatrixValue[] }[];
}

export interface TaxInvoiceItem {
  invoiceId: string;
  number: string;
  date: string;
  partnerName: string;
  taxId: string;
  direction: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  taxInvoiceType: string | null;
  currency: string;
  status: string;
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  totalAmount: number;
  receivableCount: number;
  payableCount: number;
}

export interface ConsolidatedEntityItem {
  entityId: string;
  name: string;
  code: string;
  country: string;
  currency: string;
  monthlyRevenue: number;
  receivableOutstanding: number;
  payableOutstanding: number;
  activeContracts: number;
}

class BillingReportApiService {
  private readonly basePath = '/billing/reports';

  getSummary = () =>
    apiClient
      .get<SingleResponse<DashboardSummary>>(`${this.basePath}/summary`)
      .then((r) => r.data.data);

  getRevenueSummary = (year: number) =>
    apiClient
      .get<ListResponse<RevenueSummaryItem>>(`${this.basePath}/revenue`, { params: { year } })
      .then((r) => r.data.data);

  getOutstandingReport = () =>
    apiClient
      .get<ListResponse<OutstandingItem>>(`${this.basePath}/outstanding`)
      .then((r) => r.data.data);

  getContractTimeline = () =>
    apiClient
      .get<ListResponse<ContractTimelineItem>>(`${this.basePath}/contract-timeline`)
      .then((r) => r.data.data);

  getPartnerDistribution = () =>
    apiClient
      .get<ListResponse<PartnerDistItem>>(`${this.basePath}/partner-distribution`)
      .then((r) => r.data.data);

  exportInvoicesExcel = (params?: { year?: number; direction?: string }) =>
    apiClient
      .get(`${this.basePath}/export/invoices`, { params, responseType: 'blob' })
      .then((r) => {
        const filename = `billing-invoices${params?.year ? `-${params.year}` : ''}.xlsx`;
        const url = window.URL.createObjectURL(new Blob([r.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });

  getMonthlyMatrix = (year: number) =>
    apiClient
      .get<SingleResponse<MonthlyMatrixData>>(`${this.basePath}/monthly-matrix`, { params: { year } })
      .then((r) => r.data.data);

  exportMonthlyMatrixExcel = (year: number) =>
    apiClient
      .get(`${this.basePath}/export/monthly-matrix`, { params: { year }, responseType: 'blob' })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `monthly-matrix-${year}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });

  getTaxInvoiceHistory = (params?: { year?: number; month?: number }) =>
    apiClient
      .get<ListResponse<TaxInvoiceItem>>(`${this.basePath}/tax-invoices`, { params })
      .then((r) => r.data.data);

  exportTaxInvoicesExcel = (params?: { year?: number; month?: number }) =>
    apiClient
      .get(`${this.basePath}/export/tax-invoices`, { params, responseType: 'blob' })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-invoices${params?.year ? `-${params.year}` : ''}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });

  getCategoryBreakdown = () =>
    apiClient
      .get<ListResponse<CategoryBreakdownItem>>(`${this.basePath}/category-breakdown`)
      .then((r) => r.data.data);

  getConsolidatedSummary = () =>
    apiClient
      .get<ListResponse<ConsolidatedEntityItem>>(`${this.basePath}/consolidated`)
      .then((r) => r.data.data);
}

export const billingReportApiService = new BillingReportApiService();
