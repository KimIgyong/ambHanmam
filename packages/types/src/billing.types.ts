// Billing Partner
export const BIL_PARTNER_TYPE = {
  CLIENT: 'CLIENT',
  AFFILIATE: 'AFFILIATE',
  PARTNER: 'PARTNER',
  OUTSOURCING: 'OUTSOURCING',
  GENERAL_AFFAIRS: 'GENERAL_AFFAIRS',
} as const;
export type BilPartnerType = (typeof BIL_PARTNER_TYPE)[keyof typeof BIL_PARTNER_TYPE];

export const BIL_PARTNER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PROSPECT: 'PROSPECT',
} as const;
export type BilPartnerStatus = (typeof BIL_PARTNER_STATUS)[keyof typeof BIL_PARTNER_STATUS];

export interface BilPartnerResponse {
  partnerId: string;
  entityId: string;
  code: string;
  type: string;
  companyName: string;
  companyNameLocal: string | null;
  country: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  taxId: string | null;
  bizType: string | null;
  bizCategory: string | null;
  ceoName: string | null;
  defaultCurrency: string;
  paymentTerms: number;
  status: string;
  crossEntityRef: string | null;
  gdriveFolderId: string | null;
  note: string | null;
  originalLang: string;
  createdAt: string;
  updatedAt: string;
}

// Billing Contract
export const BIL_CONTRACT_DIRECTION = {
  RECEIVABLE: 'RECEIVABLE',
  PAYABLE: 'PAYABLE',
} as const;
export type BilContractDirection = (typeof BIL_CONTRACT_DIRECTION)[keyof typeof BIL_CONTRACT_DIRECTION];

export const BIL_CONTRACT_CATEGORY = {
  TECH_BPO: 'TECH_BPO',
  SI_DEV: 'SI_DEV',
  MAINTENANCE: 'MAINTENANCE',
  MARKETING: 'MARKETING',
  GENERAL_AFFAIRS: 'GENERAL_AFFAIRS',
  OTHER: 'OTHER',
} as const;
export type BilContractCategory = (typeof BIL_CONTRACT_CATEGORY)[keyof typeof BIL_CONTRACT_CATEGORY];

export const BIL_CONTRACT_TYPE = {
  FIXED: 'FIXED',
  USAGE_BASED: 'USAGE_BASED',
  MILESTONE: 'MILESTONE',
  AD_HOC: 'AD_HOC',
} as const;
export type BilContractType = (typeof BIL_CONTRACT_TYPE)[keyof typeof BIL_CONTRACT_TYPE];

export const BIL_CONTRACT_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  EXPIRING: 'EXPIRING',
  EXPIRED: 'EXPIRED',
  ENDED: 'ENDED',
  RENEWED: 'RENEWED',
  TERMINATED: 'TERMINATED',
  LIQUIDATED: 'LIQUIDATED',
} as const;
export type BilContractStatus = (typeof BIL_CONTRACT_STATUS)[keyof typeof BIL_CONTRACT_STATUS];

export interface BilContractResponse {
  contractId: string;
  entityId: string;
  partnerId: string;
  partnerName: string;
  partnerCode: string;
  direction: string;
  category: string;
  type: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  amount: number;
  currency: string;
  status: string;
  autoRenew: boolean;
  billingDay: number | null;
  billingPeriod: string | null;
  autoGenerate: boolean;
  unitPrice: number | null;
  unitDesc: string | null;
  predecessorId: string | null;
  gdriveFolderId: string | null;
  note: string | null;
  gsheetUrl: string | null;
  gsheetTabPattern: string | null;
  assignedUserId: string | null;
  milestones: BilContractMilestoneResponse[];
  paymentType: string | null;
  billingAmount: number | null;
  paymentSchedules: BilPaymentScheduleResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface BilContractMilestoneResponse {
  milestoneId: string;
  seq: number;
  label: string;
  percentage: number;
  amount: number;
  dueDate: string | null;
  status: string;
}

export interface BilPaymentScheduleResponse {
  scheduleId: string;
  seq: number;
  billingDate: string;
  billingPeriod: string | null;
  amount: number;
  status: string;
}

// Billing SOW
export const BIL_SOW_STATUS = {
  DRAFT: 'DRAFT',
  SIGNED: 'SIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ACCEPTED: 'ACCEPTED',
} as const;
export type BilSowStatus = (typeof BIL_SOW_STATUS)[keyof typeof BIL_SOW_STATUS];

export interface BilSowResponse {
  sowId: string;
  contractId: string;
  contractTitle: string;
  entityId: string;
  partnerName: string;
  title: string;
  description: string | null;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

// Billing Invoice
export const BIL_INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
  VOID: 'VOID',
} as const;
export type BilInvoiceStatus = (typeof BIL_INVOICE_STATUS)[keyof typeof BIL_INVOICE_STATUS];

export const BIL_INVOICE_APPROVAL_STATUS = {
  NONE: 'NONE',
  PENDING_REVIEW: 'PENDING_REVIEW',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_MANAGER: 'APPROVED_MANAGER',
  APPROVED_ADMIN: 'APPROVED_ADMIN',
  REJECTED: 'REJECTED',
} as const;
export type BilInvoiceApprovalStatus = (typeof BIL_INVOICE_APPROVAL_STATUS)[keyof typeof BIL_INVOICE_APPROVAL_STATUS];

// E-Invoice Status (Vietnam)
export const BIL_EINVOICE_STATUS = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  ISSUED: 'ISSUED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
export type BilEinvoiceStatus = (typeof BIL_EINVOICE_STATUS)[keyof typeof BIL_EINVOICE_STATUS];

export interface BilEinvoiceInfo {
  status: string;
  number: string | null;
  formNumber: string | null;
  referenceCode: string | null;
  gdtCode: string | null;
  issuedAt: string | null;
  lookupUrl: string | null;
  error: string | null;
}

// NTS Tax Invoice Status (Korea)
export const BIL_NTS_STATUS = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  ISSUED: 'ISSUED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
export type BilNtsStatus = (typeof BIL_NTS_STATUS)[keyof typeof BIL_NTS_STATUS];

// 수정세금계산서 사유코드
export const NTS_MODIFY_CODE = {
  WRITTEN_ERROR: '1',
  SUPPLY_CHANGE: '2',
  RETURN: '3',
  CONTRACT_CANCEL: '4',
  DUPLICATE: '5',
  MISTAKE: '6',
} as const;

export interface BilNtsInfo {
  mgtKey: string | null;
  confirmNum: string | null;
  status: string;
  issuedAt: string | null;
  sentAt: string | null;
  resultCode: string | null;
  error: string | null;
  modifyCode: string | null;
  originalKey: string | null;
}

export interface BilInvoiceResponse {
  invoiceId: string;
  entityId: string;
  partnerId: string;
  partnerName: string;
  partnerCode: string;
  partnerContactEmail: string | null;
  contractId: string | null;
  contractTitle: string | null;
  sowId: string | null;
  number: string;
  direction: string;
  date: string;
  dueDate: string | null;
  servicePeriodStart: string | null;
  servicePeriodEnd: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: string;
  paidAmount: number;
  paidDate: string | null;
  internalCode: string | null;
  taxInvoiceType: string | null;
  note: string | null;
  approvalStatus: string;
  reviewerId: string | null;
  reviewedAt: string | null;
  approverManagerId: string | null;
  approvedManagerAt: string | null;
  approverAdminId: string | null;
  approvedAdminAt: string | null;
  rejectionReason: string | null;
  gsheetUrl: string | null;
  einvoice: BilEinvoiceInfo | null;
  ntsInfo: BilNtsInfo | null;
  items: BilInvoiceItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface BilInvoiceItemResponse {
  itemId: string;
  seq: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Billing Payment
export const BIL_PAYMENT_METHOD = {
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASH: 'CASH',
  CHECK: 'CHECK',
  CARD: 'CARD',
  OTHER: 'OTHER',
} as const;
export type BilPaymentMethod = (typeof BIL_PAYMENT_METHOD)[keyof typeof BIL_PAYMENT_METHOD];

export interface BilPaymentResponse {
  paymentId: string;
  entityId: string;
  invoiceId: string;
  invoiceNumber: string;
  partnerName: string;
  amount: number;
  currency: string;
  date: string;
  method: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

export interface BilDueContractResponse {
  contractId: string;
  title: string;
  partnerName: string;
  partnerCode: string;
  direction: string;
  type: string;
  amount: number;
  currency: string;
  billingDay: number | null;
  billingPeriod: string | null;
  unitPrice: number | null;
  unitDesc: string | null;
  alreadyGenerated: boolean;
}

export interface BilGenerateResult {
  generated: number;
  skipped: number;
  invoiceIds: string[];
}

// Billing Document
export const BIL_DOC_REF_TYPE = {
  CONTRACT: 'CONTRACT',
  SOW: 'SOW',
  INVOICE: 'INVOICE',
} as const;
export type BilDocRefType = (typeof BIL_DOC_REF_TYPE)[keyof typeof BIL_DOC_REF_TYPE];

export const BIL_DOC_TYPE = {
  SIGNED_CONTRACT: 'SIGNED_CONTRACT',
  APPENDIX: 'APPENDIX',
  SOW: 'SOW',
  ACCEPTANCE_MINUTES: 'ACCEPTANCE_MINUTES',
  INVOICE: 'INVOICE',
  PAYMENT_REQUEST: 'PAYMENT_REQUEST',
  OTHER: 'OTHER',
} as const;
export type BilDocType = (typeof BIL_DOC_TYPE)[keyof typeof BIL_DOC_TYPE];

export interface BilDocumentResponse {
  docId: string;
  refType: string;
  refId: string;
  docType: string;
  gdriveFileId: string | null;
  gdriveUrl: string | null;
  filename: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedBy: string | null;
  createdAt: string | null;
}
