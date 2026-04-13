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

export interface ExpenseItemResponse {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  quantity: number;
  unitPrice: number;
  description: string | null;
}

export interface ExpenseApprovalResponse {
  id: string;
  approvalStep: number;
  approverId: string;
  approverName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment: string | null;
  isSelfApproval: boolean;
  decidedAt: string | null;
}

export interface ExpenseExecutionResponse {
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

export interface ExpenseAttachmentResponse {
  id: string;
  fileName: string | null;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  isLink: boolean;
  createdAt: string;
}

export interface ExpenseRequestResponse {
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
  items: ExpenseItemResponse[];
  approvals: ExpenseApprovalResponse[];
  execution: ExpenseExecutionResponse | null;
  attachments: ExpenseAttachmentResponse[];
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

export interface ExpenseStatsResponse {
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

export interface MonthlyReportResult {
  year: number;
  month: number;
  totalCount: number;
  totalAmount: number;
  executedCount: number;
  executedAmount: number;
  byCategory: MonthlyReportCategoryItem[];
  items: MonthlyReportItem[];
}

export interface ForecastItemResponse {
  type: ForecastItemType;
  category: ExpenseCategory;
  name: string;
  amount: number;
  quantity: number;
  note: string | null;
}

export interface ExpenseForecastReportResponse {
  id: string;
  year: number;
  month: number;
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  memo: string | null;
  items: ForecastItemResponse[];
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}
