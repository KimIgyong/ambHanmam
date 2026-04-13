/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

import { PolarService } from './polar.service';

describe('PolarService', () => {
  let service: PolarService;
  let configService: { get: jest.Mock; getOrThrow: jest.Mock };

  const WEBHOOK_SECRET = 'whsec_' + Buffer.from('test-secret-key-32bytes!!').toString('base64');
  const SECRET_BYTES = Buffer.from('test-secret-key-32bytes!!');

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'POLAR_ACCESS_TOKEN') return 'test-access-token';
        if (key === 'POLAR_WEBHOOK_SECRET') return WEBHOOK_SECRET;
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolarService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(PolarService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── verifyWebhookSignature ──────────────────────────

  describe('verifyWebhookSignature', () => {
    const createValidSignature = (
      webhookId: string,
      timestamp: string,
      body: string,
    ): string => {
      const toSign = `${webhookId}.${timestamp}.${body}`;
      const sig = createHmac('sha256', SECRET_BYTES)
        .update(toSign)
        .digest('base64');
      return `v1,${sig}`;
    };

    it('should pass with valid signature', () => {
      const webhookId = 'msg_test123';
      const timestamp = String(Math.floor(Date.now() / 1000));
      const body = JSON.stringify({ type: 'subscription.created', data: {} });
      const signature = createValidSignature(webhookId, timestamp, body);

      expect(() =>
        service.verifyWebhookSignature(
          webhookId,
          timestamp,
          signature,
          Buffer.from(body),
        ),
      ).not.toThrow();
    });

    it('should throw E29010 with invalid signature', () => {
      const webhookId = 'msg_test123';
      const timestamp = String(Math.floor(Date.now() / 1000));
      const body = '{"type":"subscription.created"}';

      expect(() =>
        service.verifyWebhookSignature(
          webhookId,
          timestamp,
          'v1,invalidsignature==',
          Buffer.from(body),
        ),
      ).toThrow(UnauthorizedException);
    });

    it('should throw E29010 when timestamp is too old (>5min)', () => {
      const webhookId = 'msg_test123';
      const oldTimestamp = String(Math.floor(Date.now() / 1000) - 600); // 10 min ago
      const body = '{"type":"subscription.created"}';
      const signature = createValidSignature(webhookId, oldTimestamp, body);

      expect(() =>
        service.verifyWebhookSignature(
          webhookId,
          oldTimestamp,
          signature,
          Buffer.from(body),
        ),
      ).toThrow(UnauthorizedException);
    });

    it('should accept multiple signature formats (space-separated)', () => {
      const webhookId = 'msg_multi';
      const timestamp = String(Math.floor(Date.now() / 1000));
      const body = '{"test":true}';
      const validSig = createValidSignature(webhookId, timestamp, body);
      const multiSig = `v1,invalid== ${validSig}`;

      expect(() =>
        service.verifyWebhookSignature(
          webhookId,
          timestamp,
          multiSig,
          Buffer.from(body),
        ),
      ).not.toThrow();
    });
  });

  // ── createCheckout ──────────────────────────────────

  describe('createCheckout', () => {
    it('should call Polar API with correct payload', async () => {
      const mockResponse = { url: 'https://polar.sh/checkout/abc123' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }) as any;

      const result = await service.createCheckout({
        productId: 'prod-123',
        entId: 'ent-001',
        userEmail: 'user@test.com',
        successUrl: 'https://example.com/success',
        metadata: { plan_code: 'BASIC' },
      });

      expect(result.checkoutUrl).toBe('https://polar.sh/checkout/abc123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.polar.sh/v1/checkouts/custom/',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"ent_id":"ent-001"'),
        }),
      );
    });

    it('should throw when Polar API returns error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      }) as any;

      await expect(
        service.createCheckout({
          productId: 'prod-x',
          entId: 'ent-001',
          userEmail: 'user@test.com',
          successUrl: 'https://example.com/success',
        }),
      ).rejects.toThrow('Polar checkout error: 400');
    });
  });
});
