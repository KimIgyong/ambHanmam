import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

export interface PolarCheckoutResult {
  checkoutUrl: string;
}

@Injectable()
export class PolarService {
  private readonly logger = new Logger(PolarService.name);
  private readonly baseUrl = 'https://api.polar.sh/v1';

  constructor(private readonly config: ConfigService) {}

  private get accessToken(): string {
    return this.config.getOrThrow<string>('POLAR_ACCESS_TOKEN');
  }

  private get webhookSecret(): string {
    return this.config.getOrThrow<string>('POLAR_WEBHOOK_SECRET');
  }

  async createCheckout(params: {
    productId: string;
    entId: string;
    userEmail: string;
    successUrl: string;
    metadata?: Record<string, string>;
  }): Promise<PolarCheckoutResult> {
    const res = await fetch(`${this.baseUrl}/checkouts/custom/`, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({
        product_id: params.productId,
        success_url: params.successUrl,
        customer_email: params.userEmail,
        metadata: {
          ent_id: params.entId,
          ...params.metadata,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Polar checkout failed: ${err}`);
      throw new Error(`Polar checkout error: ${res.status}`);
    }

    const data = await res.json();
    return { checkoutUrl: data.url };
  }

  async getSubscription(
    polarSubscriptionId: string,
  ): Promise<Record<string, unknown>> {
    const res = await fetch(
      `${this.baseUrl}/subscriptions/${polarSubscriptionId}`,
      { headers: this._headers() },
    );
    if (!res.ok) {
      throw new Error(`Polar get subscription error: ${res.status}`);
    }
    return res.json();
  }

  verifyWebhookSignature(
    webhookId: string,
    webhookTimestamp: string,
    webhookSignature: string,
    rawBody: Buffer,
  ): void {
    const TOLERANCE_SECONDS = 300;

    const ts = parseInt(webhookTimestamp, 10);
    if (Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) {
      throw new UnauthorizedException({
        code: 'E29010',
        message: 'Webhook timestamp out of tolerance.',
      });
    }

    const toSign = `${webhookId}.${webhookTimestamp}.${rawBody.toString()}`;
    const secretBytes = Buffer.from(
      this.webhookSecret.replace(/^whsec_/, ''),
      'base64',
    );
    const expected = createHmac('sha256', secretBytes)
      .update(toSign)
      .digest('base64');

    const signatures = webhookSignature.split(' ');
    const isValid = signatures.some((sig) => {
      const sigValue = sig.replace(/^v1,/, '');
      try {
        return timingSafeEqual(
          Buffer.from(sigValue, 'base64'),
          Buffer.from(expected, 'base64'),
        );
      } catch {
        return false;
      }
    });

    if (!isValid) {
      throw new UnauthorizedException({
        code: 'E29010',
        message: 'Invalid webhook signature.',
      });
    }
  }

  private _headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }
}
