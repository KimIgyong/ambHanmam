import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  PaymentProvider, CreatePaymentRequest, PaymentResult, VerifyPaymentRequest, RefundRequest,
} from '../interface/payment-provider.interface';

@Injectable()
export class VnpayProvider implements PaymentProvider {
  readonly name = 'VNPAY';
  readonly supportedCurrencies = ['VND'];
  private readonly logger = new Logger(VnpayProvider.name);

  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly payUrl: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE', '');
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET', '');
    this.payUrl = this.configService.get<string>('VNPAY_PAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
    this.apiUrl = this.configService.get<string>('VNPAY_API_URL', 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction');
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResult> {
    try {
      const date = new Date();
      const createDate = this.formatDate(date);
      const orderId = request.orderId;

      const params: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.tmnCode,
        vnp_Locale: request.locale === 'vi' ? 'vn' : 'en',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: request.description.substring(0, 255),
        vnp_OrderType: 'other',
        vnp_Amount: String(Math.round(request.amount * 100)), // VNPay expects amount * 100
        vnp_ReturnUrl: request.returnUrl,
        vnp_IpAddr: request.ipAddress || '127.0.0.1',
        vnp_CreateDate: createDate,
      };

      // Sort and create query string
      const sortedParams = this.sortObject(params);
      const signData = new URLSearchParams(sortedParams).toString();
      const hmac = crypto.createHmac('sha512', this.hashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

      const redirectUrl = `${this.payUrl}?${signData}&vnp_SecureHash=${signed}`;

      return {
        success: true,
        gatewayOrderId: orderId,
        redirectUrl,
        status: 'PENDING',
      };
    } catch (err) {
      this.logger.error(`VNPay createPayment error: ${(err as Error).message}`);
      return {
        success: false,
        status: 'FAILED',
        errorMessage: (err as Error).message,
      };
    }
  }

  async verifyPayment(request: VerifyPaymentRequest): Promise<PaymentResult> {
    const params = request.queryParams || {};

    // Verify secure hash
    const secureHash = params['vnp_SecureHash'];
    const queryParams = { ...params };
    delete queryParams['vnp_SecureHash'];
    delete queryParams['vnp_SecureHashType'];

    const sortedParams = this.sortObject(queryParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const checkSum = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== checkSum) {
      return {
        success: false,
        status: 'FAILED',
        errorCode: 'INVALID_SIGNATURE',
        errorMessage: 'Invalid secure hash',
      };
    }

    const responseCode = params['vnp_ResponseCode'];
    const transactionNo = params['vnp_TransactionNo'];

    if (responseCode === '00') {
      return {
        success: true,
        gatewayTxId: transactionNo,
        gatewayOrderId: params['vnp_TxnRef'],
        status: 'COMPLETED',
        rawResponse: params as unknown as Record<string, unknown>,
      };
    }

    return {
      success: false,
      gatewayTxId: transactionNo,
      gatewayOrderId: params['vnp_TxnRef'],
      status: 'FAILED',
      errorCode: responseCode,
      errorMessage: this.getResponseMessage(responseCode),
      rawResponse: params as unknown as Record<string, unknown>,
    };
  }

  async refundPayment(request: RefundRequest): Promise<PaymentResult> {
    // VNPay refund requires API call
    this.logger.log(`VNPay refund requested for ${request.gatewayTxId}, amount: ${request.amount}`);
    // TODO: Implement VNPay refund API call
    return {
      success: false,
      status: 'FAILED',
      errorMessage: 'VNPay refund not yet implemented',
    };
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}${m}${d}${h}${mi}${s}`;
  }

  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  }

  private getResponseMessage(code: string): string {
    const messages: Record<string, string> = {
      '07': 'Transaction suspected of fraud',
      '09': 'Card/account not registered for InternetBanking',
      '10': 'Incorrect authentication (3+ times)',
      '11': 'Payment timeout',
      '12': 'Card/account locked',
      '13': 'Incorrect OTP',
      '24': 'Transaction cancelled',
      '51': 'Insufficient balance',
      '65': 'Transaction limit exceeded',
      '75': 'Bank under maintenance',
      '79': 'Incorrect payment password (3+ times)',
      '99': 'Other error',
    };
    return messages[code] || `Unknown error: ${code}`;
  }
}
