// ── PG Provider ──
export const PG_PROVIDER = {
  MEGAPAY: 'MEGAPAY',
} as const;

export type PgProvider = (typeof PG_PROVIDER)[keyof typeof PG_PROVIDER];

// ── PG Environment ──
export const PG_ENVIRONMENT = {
  SANDBOX: 'sandbox',
  PRODUCTION: 'production',
} as const;

export type PgEnvironment =
  (typeof PG_ENVIRONMENT)[keyof typeof PG_ENVIRONMENT];

// ── Transaction Status ──
export const PG_TX_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PgTxStatus = (typeof PG_TX_STATUS)[keyof typeof PG_TX_STATUS];

// ── Pay Type ──
export const PG_PAY_TYPE = {
  IC: 'IC', // International Card (Visa/Master/JCB/AMEX)
  DC: 'DC', // ATM / Domestic Card
  EW: 'EW', // E-Wallet (ZaloPay, Momo, ViettelPay)
  QR: 'QR', // VNPAYQR
  NO: 'NO', // User selects on MegaPay page
  CW: 'CW', // Card Wallet (ApplePay, GooglePay)
  VA: 'VA', // Virtual Account / Deposit
} as const;

export type PgPayType = (typeof PG_PAY_TYPE)[keyof typeof PG_PAY_TYPE];

// ── MegaPay Check Connection Status ──
export const MEGAPAY_CHECK_STATUS = {
  NOT_REGISTERED: 0,
  VALID: 1,
  KEY_ERROR: 2,
  SUSPENDED: 3,
} as const;

// ── Response Types ──
export interface PgConfigResponse {
  pgConfigId: string;
  entityId: string | null;
  provider: PgProvider;
  merchantId: string;
  environment: PgEnvironment;
  callbackUrl: string;
  notiUrl: string;
  windowColor: string;
  currency: string;
  isActive: boolean;
  encodeKeyLast4: string;
  refundKeyLast4: string;
  cancelPwLast4: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PgConfigDetailResponse extends PgConfigResponse {
  entityName?: string;
}

export interface PgTransactionResponse {
  transactionId: string;
  entityId: string;
  userId: string;
  invoiceNo: string;
  merTrxId: string;
  trxId: string | null;
  amount: number;
  currency: string;
  payType: string;
  goodsName: string;
  status: PgTxStatus;
  resultCd: string | null;
  resultMsg: string | null;
  buyerEmail: string;
  buyerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentLinkResponse {
  transactionId: string;
  invoiceNo: string;
  paymentLink: string;
  qrCode: string | null;
  linkExpTime: string;
}

export interface PgConnectionTestResult {
  success: boolean;
  status: number;
  message: string;
}
