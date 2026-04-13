import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PortalPaymentEntity } from '../entity/portal-payment.entity';
import { PortalCustomerEntity } from '../../auth/entity/portal-customer.entity';
import { PaymentProvider, PaymentResult } from '../interface/payment-provider.interface';
import { VnpayProvider } from '../provider/vnpay.provider';
import { VnptepayProvider } from '../provider/vnptepay.provider';
import { TossProvider } from '../provider/toss.provider';

interface CreatePaymentDto {
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  description: string;
  gateway?: string; // Override auto-routing
  returnUrl: string;
  cancelUrl?: string;
  ipAddress?: string;
  locale?: string;
}

const COUNTRY_GATEWAY_MAP: Record<string, string[]> = {
  VN: ['VNPAY', 'VNPTEPAY'],
  KR: ['TOSS'],
};

const CURRENCY_GATEWAY_MAP: Record<string, string[]> = {
  VND: ['VNPAY', 'VNPTEPAY'],
  KRW: ['TOSS'],
  USD: ['STRIPE'],
};

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly providers: Map<string, PaymentProvider>;

  constructor(
    @InjectRepository(PortalPaymentEntity)
    private readonly paymentRepo: Repository<PortalPaymentEntity>,
    @InjectRepository(PortalCustomerEntity)
    private readonly customerRepo: Repository<PortalCustomerEntity>,
    private readonly vnpayProvider: VnpayProvider,
    private readonly vnptepayProvider: VnptepayProvider,
    private readonly tossProvider: TossProvider,
  ) {
    this.providers = new Map<string, PaymentProvider>([
      ['VNPAY', this.vnpayProvider],
      ['VNPTEPAY', this.vnptepayProvider],
      ['TOSS', this.tossProvider],
    ]);
  }

  /**
   * Create a payment with automatic gateway routing
   */
  async createPayment(dto: CreatePaymentDto): Promise<{
    paymentId: string;
    gateway: string;
    redirectUrl?: string;
    clientConfig?: Record<string, unknown>;
    status: string;
  }> {
    const customer = await this.customerRepo.findOne({ where: { pctId: dto.customerId } });
    if (!customer) throw new BadRequestException('Customer not found');

    // Determine gateway
    const gateway = dto.gateway || this.resolveGateway(customer.pctCountry, dto.currency);
    if (!gateway) {
      throw new BadRequestException(`No payment gateway available for currency ${dto.currency}`);
    }

    if (gateway === 'STRIPE') {
      throw new BadRequestException('Use Stripe checkout endpoint for Stripe payments');
    }

    const provider = this.providers.get(gateway);
    if (!provider) {
      throw new BadRequestException(`Payment gateway ${gateway} is not configured`);
    }

    // Create payment record
    const payment = new PortalPaymentEntity();
    payment.ppmCustomerId = dto.customerId;
    payment.ppmCliId = customer.pctCliId;
    payment.ppmSubId = dto.subscriptionId;
    payment.ppmGateway = gateway;
    payment.ppmAmount = dto.amount;
    payment.ppmCurrency = dto.currency;
    payment.ppmStatus = 'PENDING';
    payment.ppmType = dto.subscriptionId ? 'SUBSCRIPTION' : 'ONE_TIME';
    payment.ppmDescription = dto.description;
    payment.ppmIpAddress = dto.ipAddress;
    payment.ppmCountry = customer.pctCountry;
    const saved = await this.paymentRepo.save(payment);

    // Create payment with provider
    const orderId = `AMB-${saved.ppmId.substring(0, 8).toUpperCase()}`;
    const result = await provider.createPayment({
      orderId,
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      customerEmail: customer.pctEmail,
      customerName: customer.pctName,
      returnUrl: dto.returnUrl,
      cancelUrl: dto.cancelUrl,
      ipAddress: dto.ipAddress,
      locale: dto.locale,
      metadata: { paymentId: saved.ppmId, customerId: dto.customerId },
    });

    // Update payment record
    saved.ppmGatewayOrderId = orderId;
    saved.ppmStatus = result.success ? 'PROCESSING' : 'FAILED';
    saved.ppmGatewayResponse = result.rawResponse;
    if (result.errorCode) saved.ppmErrorCode = result.errorCode;
    if (result.errorMessage) saved.ppmErrorMessage = result.errorMessage;
    await this.paymentRepo.save(saved);

    return {
      paymentId: saved.ppmId,
      gateway,
      redirectUrl: result.redirectUrl,
      clientConfig: result.rawResponse,
      status: saved.ppmStatus,
    };
  }

  /**
   * Handle payment return/callback
   */
  async handlePaymentReturn(
    gateway: string,
    queryParams: Record<string, string>,
  ): Promise<{ paymentId: string; status: string; success: boolean }> {
    const provider = this.providers.get(gateway.toUpperCase());
    if (!provider) {
      throw new BadRequestException(`Unknown gateway: ${gateway}`);
    }

    const result = await provider.verifyPayment({ queryParams });

    // Find payment by gateway order ID
    const orderId = result.gatewayOrderId || queryParams['order_id'] || queryParams['orderId'] || queryParams['vnp_TxnRef'];
    if (!orderId) {
      throw new BadRequestException('Cannot determine order ID from callback');
    }

    const payment = await this.paymentRepo.findOne({ where: { ppmGatewayOrderId: orderId } });
    if (!payment) {
      throw new BadRequestException(`Payment not found for order ${orderId}`);
    }

    // Update payment
    payment.ppmStatus = result.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';
    payment.ppmGatewayTxId = result.gatewayTxId;
    payment.ppmGatewayResponse = result.rawResponse;
    if (result.status === 'COMPLETED') {
      payment.ppmPaidAt = new Date();
    }
    if (result.errorCode) payment.ppmErrorCode = result.errorCode;
    if (result.errorMessage) payment.ppmErrorMessage = result.errorMessage;
    await this.paymentRepo.save(payment);

    return {
      paymentId: payment.ppmId,
      status: payment.ppmStatus,
      success: result.success,
    };
  }

  /**
   * Get payment history for a customer
   */
  async getPaymentHistory(customerId: string, page = 1, limit = 20) {
    const [payments, total] = await this.paymentRepo.findAndCount({
      where: { ppmCustomerId: customerId },
      order: { ppmCreatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      payments: payments.map((p) => ({
        paymentId: p.ppmId,
        gateway: p.ppmGateway,
        amount: Number(p.ppmAmount),
        currency: p.ppmCurrency,
        status: p.ppmStatus,
        type: p.ppmType,
        method: p.ppmMethod,
        description: p.ppmDescription,
        paidAt: p.ppmPaidAt,
        createdAt: p.ppmCreatedAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Get available gateways for a customer
   */
  getAvailableGateways(country?: string, currency?: string): string[] {
    const gateways = new Set<string>();

    if (country) {
      const countryGateways = COUNTRY_GATEWAY_MAP[country];
      if (countryGateways) countryGateways.forEach((g) => gateways.add(g));
    }

    if (currency) {
      const currencyGateways = CURRENCY_GATEWAY_MAP[currency];
      if (currencyGateways) currencyGateways.forEach((g) => gateways.add(g));
    }

    // Always add Stripe as fallback
    gateways.add('STRIPE');

    return Array.from(gateways);
  }

  /**
   * Auto-resolve gateway based on country and currency
   */
  private resolveGateway(country?: string, currency?: string): string | null {
    // Priority: country-specific → currency-specific → Stripe fallback
    if (country) {
      const countryGateways = COUNTRY_GATEWAY_MAP[country];
      if (countryGateways && countryGateways.length > 0) {
        return countryGateways[0]; // First gateway is primary
      }
    }

    if (currency) {
      const currencyGateways = CURRENCY_GATEWAY_MAP[currency];
      if (currencyGateways && currencyGateways.length > 0) {
        return currencyGateways[0];
      }
    }

    return 'STRIPE'; // Global fallback
  }
}
