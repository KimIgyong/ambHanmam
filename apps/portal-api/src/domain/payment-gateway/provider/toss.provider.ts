import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  PaymentProvider, CreatePaymentRequest, PaymentResult, VerifyPaymentRequest, RefundRequest,
} from '../interface/payment-provider.interface';

/**
 * TossPayments provider for Korea
 * https://docs.tosspayments.com/
 */
@Injectable()
export class TossProvider implements PaymentProvider {
  readonly name = 'TOSS';
  readonly supportedCurrencies = ['KRW'];
  private readonly logger = new Logger(TossProvider.name);

  private readonly clientKey: string;
  private readonly secretKey: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.clientKey = this.configService.get<string>('TOSS_CLIENT_KEY', '');
    this.secretKey = this.configService.get<string>('TOSS_SECRET_KEY', '');
    this.apiUrl = this.configService.get<string>('TOSS_API_URL', 'https://api.tosspayments.com/v1');
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResult> {
    try {
      // TossPayments uses client-side SDK for payment initiation
      // Server returns payment parameters for the frontend SDK
      return {
        success: true,
        gatewayOrderId: request.orderId,
        status: 'PENDING',
        rawResponse: {
          clientKey: this.clientKey,
          orderId: request.orderId,
          amount: request.amount,
          orderName: request.description,
          customerEmail: request.customerEmail,
          customerName: request.customerName,
          successUrl: request.returnUrl,
          failUrl: request.cancelUrl || request.returnUrl,
        },
      };
    } catch (err) {
      this.logger.error(`TossPayments createPayment error: ${(err as Error).message}`);
      return {
        success: false,
        status: 'FAILED',
        errorMessage: (err as Error).message,
      };
    }
  }

  async verifyPayment(request: VerifyPaymentRequest): Promise<PaymentResult> {
    const params = request.queryParams || {};
    const paymentKey = params['paymentKey'];
    const orderId = params['orderId'];
    const amount = params['amount'];

    if (!paymentKey || !orderId || !amount) {
      return {
        success: false,
        status: 'FAILED',
        errorCode: 'MISSING_PARAMS',
        errorMessage: 'Missing paymentKey, orderId, or amount',
      };
    }

    try {
      // Confirm payment via TossPayments API
      const auth = Buffer.from(`${this.secretKey}:`).toString('base64');
      const response = await axios.post(
        `${this.apiUrl}/payments/confirm`,
        { paymentKey, orderId, amount: Number(amount) },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;

      if (data.status === 'DONE') {
        return {
          success: true,
          gatewayTxId: data.paymentKey,
          gatewayOrderId: data.orderId,
          status: 'COMPLETED',
          rawResponse: data,
        };
      }

      return {
        success: false,
        gatewayTxId: data.paymentKey,
        gatewayOrderId: data.orderId,
        status: 'FAILED',
        errorCode: data.status,
        errorMessage: data.message || 'Payment not completed',
        rawResponse: data,
      };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
      this.logger.error(`TossPayments verify error: ${axiosErr.response?.data?.message || (err as Error).message}`);
      return {
        success: false,
        status: 'FAILED',
        errorCode: axiosErr.response?.data?.code || 'UNKNOWN',
        errorMessage: axiosErr.response?.data?.message || (err as Error).message,
      };
    }
  }

  async refundPayment(request: RefundRequest): Promise<PaymentResult> {
    try {
      const auth = Buffer.from(`${this.secretKey}:`).toString('base64');
      const response = await axios.post(
        `${this.apiUrl}/payments/${request.gatewayTxId}/cancel`,
        {
          cancelReason: request.reason || 'Customer requested refund',
          cancelAmount: request.amount,
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        gatewayTxId: request.gatewayTxId,
        status: 'COMPLETED',
        rawResponse: response.data,
      };
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
      return {
        success: false,
        status: 'FAILED',
        errorCode: axiosErr.response?.data?.code || 'UNKNOWN',
        errorMessage: axiosErr.response?.data?.message || (err as Error).message,
      };
    }
  }
}
