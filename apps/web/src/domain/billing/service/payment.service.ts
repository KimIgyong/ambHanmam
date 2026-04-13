import { apiClient } from '@/lib/api-client';
import { BilPaymentResponse, BilDueContractResponse, BilGenerateResult } from '@amb/types';

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

class PaymentApiService {
  private readonly basePath = '/billing/payments';
  private readonly autoPath = '/billing/automation';

  // ── Payments ──
  getPayments = (params?: { invoice_id?: string; direction?: string; search?: string; year_month?: string }) =>
    apiClient
      .get<ListResponse<BilPaymentResponse>>(this.basePath, { params })
      .then((r) => r.data.data);

  getPaymentsByInvoice = (invoiceId: string) =>
    apiClient
      .get<ListResponse<BilPaymentResponse>>(`${this.basePath}/by-invoice/${invoiceId}`)
      .then((r) => r.data.data);

  getOutstandingSummary = () =>
    apiClient
      .get<SingleResponse<{ receivable: any[]; payable: any[] }>>(`${this.basePath}/outstanding`)
      .then((r) => r.data.data);

  createPayment = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<BilPaymentResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  deletePayment = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  // ── Automation ──
  getDueContracts = (yearMonth: string) =>
    apiClient
      .get<ListResponse<BilDueContractResponse>>(`${this.autoPath}/due-contracts`, { params: { year_month: yearMonth } })
      .then((r) => r.data.data);

  getUsageBasedDrafts = (yearMonth: string) =>
    apiClient
      .get<ListResponse<BilDueContractResponse>>(`${this.autoPath}/usage-based`, { params: { year_month: yearMonth } })
      .then((r) => r.data.data);

  generateMonthlyInvoices = (yearMonth: string) =>
    apiClient
      .post<SingleResponse<BilGenerateResult>>(`${this.autoPath}/generate`, { year_month: yearMonth })
      .then((r) => r.data.data);

  getBillingCalendar = (yearMonth: string) =>
    apiClient
      .get<{ success: boolean; data: Array<{ date: string; contracts: Array<{ contractId: string; title: string; partnerName: string; amount: number; currency: string; direction: string; generated: boolean }> }>; timestamp: string }>(`${this.autoPath}/billing-calendar`, { params: { year_month: yearMonth } })
      .then((r) => r.data.data);

  getOverdueBillings = () =>
    apiClient
      .get<{ success: boolean; data: Array<{ contractId: string; title: string; partnerName: string; direction: string; amount: number; currency: string; billingDay: number; daysOverdue: number; type: string }>; timestamp: string }>(`${this.autoPath}/overdue-billings`)
      .then((r) => r.data.data);
}

export const paymentApiService = new PaymentApiService();
