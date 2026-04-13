import { apiClient } from '@/lib/api-client';

// ─── Status Types ─────────────────────────────────────────────────────

export type ExpenseRequestStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED_L1'
  | 'APPROVED'
  | 'EXECUTED'
  | 'REJECTED'
  | 'CANCELLED';

export type ExpenseCategory =
  | 'TRAVEL'
  | 'ENTERTAINMENT'
  | 'SUPPLIES'
  | 'TRAINING'
  | 'MARKETING'
  | 'IT_INFRASTRUCTURE'
  | 'MAINTENANCE'
  | 'UTILITIES'
  | 'OTHER';

export type ExpenseRecurringType = 'NONE' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type ExecutionMethod = 'CARD' | 'CASH' | 'TRANSFER' | 'OTHER';
export type ReceiptType = 'RECEIPT' | 'TAX_INVOICE' | 'NONE';
export type ForecastItemType = 'RECURRING' | 'MANUAL';

// ─── Response Types (camelCase) ───────────────────────────────────────

export interface ExpenseItem {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  quantity: number;
  unitPrice: number;
  description: string | null;
}

export interface ExpenseApproval {
  id: string;
  approvalStep: number;
  approverId: string;
  approverName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment: string | null;
  isSelfApproval: boolean;
  decidedAt: string | null;
}

export interface ExpenseExecution {
  id: string;
  executionDate: string;
  executionMethod: ExecutionMethod;
  totalAmount: number;
  receiptType: ReceiptType;
  receiptUrl: string | null;
  memo: string | null;
  executedById: string;
  executedByName: string;
  createdAt: string;
}

export interface ExpenseAttachment {
  id: string;
  fileName: string | null;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  isLink: boolean;
  createdAt: string;
}

export interface ExpenseRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: ExpenseRequestStatus;
  totalAmount: number;
  requestDate: string;
  requiredDate: string | null;
  isRecurring: boolean;
  recurringType: ExpenseRecurringType;
  requesterId: string;
  requesterName: string;
  approver1Id: string | null;
  approver1Name: string | null;
  approver2Id: string | null;
  approver2Name: string | null;
  parentRequestId: string | null;
  memo: string | null;
  items: ExpenseItem[];
  approvals: ExpenseApproval[];
  execution: ExpenseExecution | null;
  attachments: ExpenseAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRequestListItem {
  id: string;
  requestNumber: string;
  title: string;
  status: ExpenseRequestStatus;
  totalAmount: number;
  requestDate: string;
  requiredDate: string | null;
  isRecurring: boolean;
  recurringType: ExpenseRecurringType;
  requesterName: string;
  approver1Name: string | null;
  approver2Name: string | null;
  createdAt: string;
}

export interface ExpenseStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  executed: number;
  rejected: number;
  totalAmount: number;
  executedAmount: number;
}

export interface MonthlyReportCategoryItem {
  category: ExpenseCategory;
  count: number;
  totalAmount: number;
}

export interface MonthlyReportItem {
  requestId: string;
  requestNumber: string;
  title: string;
  requesterName: string;
  category: ExpenseCategory;
  amount: number;
  executionDate: string;
  approver1Name: string | null;
  approver2Name: string | null;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalCount: number;
  totalAmount: number;
  executedCount: number;
  executedAmount: number;
  byCategory: MonthlyReportCategoryItem[];
  items: MonthlyReportItem[];
}

export interface ForecastItem {
  type: ForecastItemType;
  category: ExpenseCategory;
  name: string;
  amount: number;
  quantity: number;
  note: string | null;
  currency?: string;
  prevAmount?: number | null;
  period?: string | null;
  exrId?: string | null;
}

export interface ForecastReport {
  id: string;
  year: number;
  month: number;
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  memo: string | null;
  items: ForecastItem[];
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Request Types (snake_case) ───────────────────────────────────────

export interface ExpenseItemBody {
  name: string;
  category?: ExpenseCategory;
  quantity: number;
  unit_price: number;
  description?: string;
  tax_amount?: number;
  currency?: string;
  note?: string;
  sort_order?: number;
}

export interface CreateExpenseRequestBody {
  title: string;
  type?: 'PRE_APPROVAL' | 'POST_APPROVAL';
  frequency?: 'ONE_TIME' | 'RECURRING';
  category?: string;
  expense_date?: string;
  description?: string;
  reason?: string;
  currency?: string;
  period?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  start_date?: string;
  end_date?: string;
  payment_day?: number;
  request_date?: string;
  required_date?: string;
  is_recurring?: boolean;
  recurring_type?: ExpenseRecurringType;
  approver1_id?: string;
  approver2_id?: string;
  memo?: string;
  items: ExpenseItemBody[];
}

export interface UpdateExpenseRequestBody {
  title?: string;
  type?: 'PRE_APPROVAL' | 'POST_APPROVAL';
  frequency?: 'ONE_TIME' | 'RECURRING';
  category?: string;
  expense_date?: string;
  description?: string;
  reason?: string;
  currency?: string;
  period?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  start_date?: string;
  end_date?: string;
  payment_day?: number;
  request_date?: string;
  required_date?: string;
  is_recurring?: boolean;
  recurring_type?: ExpenseRecurringType;
  approver1_id?: string;
  approver2_id?: string;
  memo?: string;
  items?: ExpenseItemBody[];
}

export interface ApproveExpenseRequestBody {
  comment?: string;
}

export interface RejectExpenseRequestBody {
  reason: string;
}

export interface ExpenseRequestListQuery {
  status?: ExpenseRequestStatus;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
  view?: 'my' | 'all';
}

export interface CreateExecutionBody {
  execution_date: string;
  execution_method: ExecutionMethod;
  total_amount: number;
  receipt_type: ReceiptType;
  memo?: string;
}

export interface UpdateExecutionBody extends Partial<CreateExecutionBody> {}

export interface ForecastItemBody {
  type: ForecastItemType;
  category: ExpenseCategory;
  name: string;
  amount: number;
  quantity: number;
  note?: string;
  exr_id?: string;
  currency?: string;
  prev_amount?: number;
  sort_order?: number;
}

export interface CreateForecastReportBody {
  year: number;
  month: number;
  items: ForecastItemBody[];
  note?: string;
}

export interface UpdateForecastReportBody {
  items?: ForecastItemBody[];
  note?: string;
}

// ─── API Service ──────────────────────────────────────────────────────

export const expenseRequestService = {
  // Expense Requests
  getList(query?: ExpenseRequestListQuery) {
    return apiClient.get<{ data: ExpenseRequestListItem[]; total: number }>(
      '/expense-requests',
      { params: query },
    );
  },

  getStats() {
    return apiClient.get<ExpenseStats>('/expense-requests/stats');
  },

  getById(id: string) {
    return apiClient.get<ExpenseRequest>(`/expense-requests/${id}`);
  },

  create(data: CreateExpenseRequestBody) {
    return apiClient.post<ExpenseRequest>('/expense-requests', data);
  },

  update(id: string, data: UpdateExpenseRequestBody) {
    return apiClient.patch<ExpenseRequest>(`/expense-requests/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete(`/expense-requests/${id}`);
  },

  submit(id: string) {
    return apiClient.post(`/expense-requests/${id}/submit`);
  },

  approve(id: string, data?: ApproveExpenseRequestBody) {
    return apiClient.post(`/expense-requests/${id}/approve`, data);
  },

  reject(id: string, data: RejectExpenseRequestBody) {
    return apiClient.post(`/expense-requests/${id}/reject`, data);
  },

  cancel(id: string) {
    return apiClient.post(`/expense-requests/${id}/cancel`);
  },

  // Attachments
  uploadAttachment(id: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ id: string; fileUrl: string }>(
      `/expense-requests/${id}/attachments`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  addLinkAttachment(id: string, url: string) {
    return apiClient.post(`/expense-requests/${id}/attachments/link`, { url });
  },

  deleteAttachment(id: string, attachmentId: string) {
    return apiClient.delete(`/expense-requests/${id}/attachments/${attachmentId}`);
  },

  // Execution
  createExecution(id: string, data: CreateExecutionBody) {
    return apiClient.post<ExpenseExecution>(`/expense-requests/${id}/execute`, data);
  },

  updateExecution(id: string, data: UpdateExecutionBody) {
    return apiClient.patch<ExpenseExecution>(`/expense-requests/${id}/execute`, data);
  },

  uploadReceipt(id: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ receiptUrl: string }>(
      `/expense-requests/${id}/execute/receipt`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  // Reports
  getMonthlyReport(year: number, month: number) {
    return apiClient.get<MonthlyReport>('/expense-requests/reports/monthly', {
      params: { year, month },
    });
  },

  exportMonthlyReport(year: number, month: number) {
    return apiClient.get<Blob>('/expense-requests/reports/monthly/export', {
      params: { year, month },
      responseType: 'blob',
    });
  },

  // Forecast
  getForecast(year: number, month: number) {
    return apiClient.get<ForecastReport | null>('/expense-requests/reports/forecast', {
      params: { year, month },
    });
  },

  getForecastPreview(year: number, month: number) {
    return apiClient.get<ForecastItem[]>('/expense-requests/reports/forecast/preview', {
      params: { year, month },
    });
  },

  createForecast(data: CreateForecastReportBody) {
    return apiClient.post<ForecastReport>('/expense-requests/reports/forecast', data);
  },

  updateForecast(id: string, data: UpdateForecastReportBody) {
    return apiClient.patch<ForecastReport>(`/expense-requests/reports/forecast/${id}`, data);
  },

  submitForecast(id: string) {
    return apiClient.post<ForecastReport>(`/expense-requests/reports/forecast/${id}/submit`);
  },

  approveForecast(id: string) {
    return apiClient.post<ForecastReport>(`/expense-requests/reports/forecast/${id}/approve`);
  },

  rejectForecast(id: string) {
    return apiClient.post<ForecastReport>(`/expense-requests/reports/forecast/${id}/reject`);
  },

  exportForecast(id: string) {
    return apiClient.get<Blob>(`/expense-requests/reports/forecast/${id}/export`, {
      responseType: 'blob',
    });
  },
};
