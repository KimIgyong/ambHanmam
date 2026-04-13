import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { PolarWebhookEventEntity } from '../entity/polar-webhook-event.entity';
import { CreatePolarCheckoutRequest } from '../dto/request/create-polar-checkout.request';
import { CreatePolarAddonCheckoutRequest } from '../dto/request/create-polar-addon-checkout.request';

@Injectable()
export class PolarService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PolarWebhookEventEntity)
    private readonly webhookEventRepository: Repository<PolarWebhookEventEntity>,
  ) {}

  async createCheckout(request: CreatePolarCheckoutRequest, userId: string, entityId?: string) {
    const checkoutId = `chk_${Date.now()}`;
    const baseUrl = this.configService.get<string>('POLAR_CHECKOUT_BASE_URL', 'https://polar.sh/checkout');

    return {
      checkoutId,
      checkoutUrl: `${baseUrl}/${checkoutId}`,
      service: request.service,
      planTier: request.plan_tier,
      billingCycle: request.billing_cycle,
      metadata: {
        service: request.service,
        plan_tier: request.plan_tier,
        billing_cycle: request.billing_cycle,
        ent_id: entityId || null,
        usr_id: userId,
      },
    };
  }

  async createAddonCheckout(request: CreatePolarAddonCheckoutRequest, userId: string, entityId?: string) {
    const checkoutId = `add_${Date.now()}`;
    const baseUrl = this.configService.get<string>('POLAR_CHECKOUT_BASE_URL', 'https://polar.sh/checkout');

    return {
      checkoutId,
      checkoutUrl: `${baseUrl}/${checkoutId}`,
      service: request.service,
      addonType: request.addon_type,
      quantity: request.quantity || 1,
      metadata: {
        service: request.service,
        addon_type: request.addon_type,
        quantity: request.quantity || 1,
        ent_id: entityId || null,
        usr_id: userId,
      },
    };
  }

  async createCustomerPortal(userId: string, entityId?: string, returnUrl?: string) {
    const portalBaseUrl = this.configService.get<string>('POLAR_CUSTOMER_PORTAL_BASE_URL', 'https://polar.sh/dashboard');
    const token = Buffer.from(`${entityId || 'no-entity'}:${userId}`).toString('base64url');

    return {
      portalUrl: `${portalBaseUrl}?token=${token}${returnUrl ? `&return_url=${encodeURIComponent(returnUrl)}` : ''}`,
    };
  }

  async handleWebhook(payload: Record<string, unknown>, signatureHeader?: string) {
    const signatureValid = this.verifySignature(payload, signatureHeader);
    if (!signatureValid) {
      throw new ForbiddenException('Invalid Polar webhook signature');
    }

    const eventId = String(payload.id || payload.event_id || '');
    const eventType = String(payload.type || payload.event_type || 'unknown');

    if (!eventId) {
      throw new ForbiddenException('Missing Polar event id');
    }

    const existing = await this.webhookEventRepository.findOne({ where: { pweEventId: eventId } });
    if (existing) {
      return {
        eventId,
        eventType,
        skipped: true,
        reason: 'already_processed',
      };
    }

    const saved = await this.webhookEventRepository.save(
      this.webhookEventRepository.create({
        pweEventId: eventId,
        pweEventType: eventType,
        pweSignatureValid: true,
        pweIsProcessed: true,
        pweProcessStatus: 'PROCESSED',
        pwePayload: payload,
        pweReceivedAt: new Date(),
        pweProcessedAt: new Date(),
      }),
    );

    return {
      eventId: saved.pweEventId,
      eventType: saved.pweEventType,
      skipped: false,
      processedAt: saved.pweProcessedAt?.toISOString() || null,
    };
  }

  private verifySignature(payload: Record<string, unknown>, signatureHeader?: string): boolean {
    const secret = this.configService.get<string>('POLAR_WEBHOOK_SECRET');
    if (!secret) {
      return false;
    }

    const raw = JSON.stringify(payload);
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    const received = (signatureHeader || '').replace(/^sha256=/, '').trim();

    if (!received) {
      return false;
    }

    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  }
}
