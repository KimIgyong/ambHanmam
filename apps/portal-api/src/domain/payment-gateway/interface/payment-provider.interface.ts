export interface CreatePaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  cancelUrl?: string;
  ipAddress?: string;
  locale?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  gatewayTxId?: string;
  gatewayOrderId?: string;
  redirectUrl?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: Record<string, unknown>;
}

export interface VerifyPaymentRequest {
  gatewayTxId?: string;
  gatewayOrderId?: string;
  queryParams?: Record<string, string>;
}

export interface RefundRequest {
  gatewayTxId: string;
  amount: number;
  reason?: string;
}

export interface PaymentProvider {
  readonly name: string;
  readonly supportedCurrencies: string[];

  createPayment(request: CreatePaymentRequest): Promise<PaymentResult>;
  verifyPayment(request: VerifyPaymentRequest): Promise<PaymentResult>;
  refundPayment?(request: RefundRequest): Promise<PaymentResult>;
}
