import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  PaymentProvider, CreatePaymentRequest, PaymentResult, VerifyPaymentRequest,
} from '../interface/payment-provider.interface';

/**
 * VNPTePay (VNPT E-Payment) provider
 * VNPT's electronic payment gateway for Vietnam
 */
@Injectable()
export class VnptepayProvider implements PaymentProvider {
  readonly name = 'VNPTEPAY';
  readonly supportedCurrencies = ['VND'];
  private readonly logger = new Logger(VnptepayProvider.name);

  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly payUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('VNPTEPAY_MERCHANT_ID', '');
    this.secretKey = this.configService.get<string>('VNPTEPAY_SECRET_KEY', '');
    this.payUrl = this.configService.get<string>('VNPTEPAY_PAY_URL', 'https://sandbox.vnptepay.vn/pay');
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResult> {
    try {
      const orderId = request.orderId;
      const amount = Math.round(request.amount);

      const params: Record<string, string> = {
        merchant_id: this.merchantId,
        order_id: orderId,
        amount: String(amount),
        currency: 'VND',
        description: request.description.substring(0, 255),
        return_url: request.returnUrl,
        cancel_url: request.cancelUrl || request.returnUrl,
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        language: request.locale === 'vi' ? 'vi' : 'en',
        created_at: new Date().toISOString(),
      };

      // Create signature: HMAC-SHA256(sorted params, secretKey)
      const sortedKeys = Object.keys(params).sort();
      const signData = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
      const signature = crypto.createHmac('sha256', this.secretKey)
        .update(signData)
        .digest('hex');

      const redirectUrl = `${this.payUrl}?${signData}&signature=${signature}`;

      return {
        success: true,
        gatewayOrderId: orderId,
        redirectUrl,
        status: 'PENDING',
      };
    } catch (err) {
      this.logger.error(`VNPTePay createPayment error: ${(err as Error).message}`);
      return {
        success: false,
        status: 'FAILED',
        errorMessage: (err as Error).message,
      };
    }
  }

  async verifyPayment(request: VerifyPaymentRequest): Promise<PaymentResult> {
    const params = request.queryParams || {};
    const signature = params['signature'];

    // Verify signature
    const verifyParams = { ...params };
    delete verifyParams['signature'];

    const sortedKeys = Object.keys(verifyParams).sort();
    const signData = sortedKeys.map((k) => `${k}=${verifyParams[k]}`).join('&');
    const expectedSignature = crypto.createHmac('sha256', this.secretKey)
      .update(signData)
      .digest('hex');

    if (signature !== expectedSignature) {
      return {
        success: false,
        status: 'FAILED',
        errorCode: 'INVALID_SIGNATURE',
        errorMessage: 'Invalid payment signature',
      };
    }

    const resultCode = params['result_code'];
    const transactionId = params['transaction_id'];

    if (resultCode === '0' || resultCode === '00') {
      return {
        success: true,
        gatewayTxId: transactionId,
        gatewayOrderId: params['order_id'],
        status: 'COMPLETED',
        rawResponse: params as unknown as Record<string, unknown>,
      };
    }

    return {
      success: false,
      gatewayTxId: transactionId,
      gatewayOrderId: params['order_id'],
      status: 'FAILED',
      errorCode: resultCode,
      errorMessage: params['result_message'] || 'Payment failed',
      rawResponse: params as unknown as Record<string, unknown>,
    };
  }
}
