import { apiClient } from '@/lib/api-client';
import {
  BankAccountResponse,
  TransactionResponse,
  AccountSummaryResponse,
  MonthlyStatsResponse,
  TopVendorResponse,
  RecurringExpenseResponse,
  ForecastResponse,
  BaseSingleResponse,
} from '@amb/types';

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    size: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

interface ImportResult {
  accountsCreated: number;
  transactionsImported: number;
  sheets: string[];
}

class AccountingService {
  // Accounts
  getAccounts = () =>
    apiClient
      .get<ListResponse<BankAccountResponse>>('/accounts')
      .then((r) => r.data.data);

  getAccountById = (id: string) =>
    apiClient
      .get<BaseSingleResponse<BankAccountResponse>>(`/accounts/${id}`)
      .then((r) => r.data.data!);

  getAccountSummary = () =>
    apiClient
      .get<BaseSingleResponse<AccountSummaryResponse>>('/accounts/summary')
      .then((r) => r.data.data!);

  createAccount = (data: {
    bank_name: string;
    branch_name?: string;
    account_number: string;
    account_alias?: string;
    currency: string;
    opening_balance?: number;
    opening_date?: string;
  }) =>
    apiClient
      .post<BaseSingleResponse<BankAccountResponse>>('/accounts', data)
      .then((r) => r.data.data!);

  updateAccount = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<BaseSingleResponse<BankAccountResponse>>(`/accounts/${id}`, data)
      .then((r) => r.data.data!);

  deleteAccount = (id: string) =>
    apiClient.delete(`/accounts/${id}`);

  // Transactions
  getTransactions = (
    accountId: string,
    params?: {
      date_from?: string;
      date_to?: string;
      vendor?: string;
      description?: string;
      flow_type?: 'DEPOSIT' | 'WITHDRAWAL';
      sort_order?: string;
      page?: number;
      size?: number;
    },
  ) =>
    apiClient
      .get<PaginatedResponse<TransactionResponse>>(
        `/accounts/${accountId}/transactions`,
        { params },
      )
      .then((r) => ({ data: r.data.data, pagination: r.data.pagination }));

  createTransaction = (
    accountId: string,
    data: {
      transaction_date: string;
      project_name?: string;
      net_value: number;
      vat?: number;
      bank_charge?: number;
      vendor?: string;
      description?: string;
    },
  ) =>
    apiClient
      .post<BaseSingleResponse<TransactionResponse>>(
        `/accounts/${accountId}/transactions`,
        data,
      )
      .then((r) => r.data.data!);

  updateTransaction = (
    accountId: string,
    txnId: string,
    data: Record<string, unknown>,
  ) =>
    apiClient
      .patch<BaseSingleResponse<TransactionResponse>>(
        `/accounts/${accountId}/transactions/${txnId}`,
        data,
      )
      .then((r) => r.data.data!);

  deleteTransaction = (accountId: string, txnId: string) =>
    apiClient.delete(`/accounts/${accountId}/transactions/${txnId}`);

  // Statistics
  getMonthlyStats = (accountId: string, params?: { start_month?: string; end_month?: string }) =>
    apiClient
      .get<{ success: boolean; data: MonthlyStatsResponse[] }>(`/accounts/${accountId}/stats/monthly`, { params })
      .then((r) => r.data.data);

  getTopVendors = (accountId: string, params?: { start_month?: string; end_month?: string; limit?: number }) =>
    apiClient
      .get<{ success: boolean; data: TopVendorResponse[] }>(`/accounts/${accountId}/stats/top-vendors`, { params })
      .then((r) => r.data.data);

  getConsolidatedStats = (accountIds: string[], params?: { start_month?: string; end_month?: string }) =>
    apiClient
      .get<{ success: boolean; data: MonthlyStatsResponse[] }>('/accounts/stats/consolidated', {
        params: { account_ids: accountIds.join(','), ...params },
      })
      .then((r) => r.data.data);

  // Recurring Expenses
  getRecurringExpenses = () =>
    apiClient
      .get<{ success: boolean; data: RecurringExpenseResponse[] }>('/accounts/recurring-expenses')
      .then((r) => r.data.data);

  createRecurringExpense = (data: {
    name: string; bac_id: string; vendor?: string; amount: number;
    currency: string; day_of_month: number; category?: string;
    description?: string; start_date?: string; end_date?: string;
  }) =>
    apiClient
      .post<BaseSingleResponse<RecurringExpenseResponse>>('/accounts/recurring-expenses', data)
      .then((r) => r.data.data!);

  updateRecurringExpense = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<BaseSingleResponse<RecurringExpenseResponse>>(`/accounts/recurring-expenses/${id}`, data)
      .then((r) => r.data.data!);

  deleteRecurringExpense = (id: string) =>
    apiClient.delete(`/accounts/recurring-expenses/${id}`);

  getForecast = (month: string) =>
    apiClient
      .get<BaseSingleResponse<ForecastResponse>>('/accounts/recurring-expenses/forecast', { params: { month } })
      .then((r) => r.data.data!);

  // Excel Import
  importExcel = (formData: FormData) =>
    apiClient
      .post<BaseSingleResponse<ImportResult>>('/accounts/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data!);

  importTransactions = (accountId: string, formData: FormData) =>
    apiClient
      .post<BaseSingleResponse<{ transactionsImported: number }>>(
        `/accounts/${accountId}/transactions/import`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      .then((r) => r.data.data!);

  // Analysis Reports
  getAnalysisReports = (accountId: string) =>
    apiClient
      .get<{ success: boolean; data: AnalysisReportResponse[] }>(`/accounts/analysis/reports/${accountId}`)
      .then((r) => r.data.data);

  saveAnalysisReport = (accountId: string, data: {
    title: string; content: string; date_from?: string; date_to?: string; prompt_id?: string;
  }) =>
    apiClient
      .post<BaseSingleResponse<AnalysisReportResponse>>(`/accounts/analysis/reports/${accountId}`, data)
      .then((r) => r.data.data!);

  deleteAnalysisReport = (accountId: string, reportId: string) =>
    apiClient.delete(`/accounts/analysis/reports/${accountId}/${reportId}`);

  // Analysis Prompts
  getAnalysisPrompts = () =>
    apiClient
      .get<{ success: boolean; data: AnalysisPromptResponse[] }>('/accounts/analysis/prompts')
      .then((r) => r.data.data);

  createAnalysisPrompt = (data: {
    name: string; system_prompt: string; user_prompt: string; is_default?: boolean;
  }) =>
    apiClient
      .post<BaseSingleResponse<AnalysisPromptResponse>>('/accounts/analysis/prompts', data)
      .then((r) => r.data.data!);

  updateAnalysisPrompt = (promptId: string, data: Record<string, unknown>) =>
    apiClient
      .patch<BaseSingleResponse<AnalysisPromptResponse>>(`/accounts/analysis/prompts/${promptId}`, data)
      .then((r) => r.data.data!);

  deleteAnalysisPrompt = (promptId: string) =>
    apiClient.delete(`/accounts/analysis/prompts/${promptId}`);
}

export interface AnalysisReportResponse {
  reportId: string;
  accountId: string;
  title: string;
  content: string;
  dateFrom: string | null;
  dateTo: string | null;
  promptId: string | null;
  createdAt: string;
}

export interface AnalysisPromptResponse {
  promptId: string;
  name: string;
  systemPrompt: string;
  userPrompt: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export const accountingService = new AccountingService();
