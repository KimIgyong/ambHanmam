import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  NotFoundException,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { Request } from 'express';

import { PolarService } from '../service/polar.service';
import { SubscriptionService } from '../service/subscription.service';
import { TokenWalletService } from '../service/token-wallet.service';
import { PgWebhookEventEntity } from '../entity/pg-webhook-event.entity';
import { PgSubscriptionEntity } from '../entity/pg-subscription.entity';
import { SubSubscriptionEntity } from '../entity/sub-subscription.entity';
import {
  SubscriptionStatus,
  WebhookEventStatus,
} from '../entity/subscription.enums';

@ApiExcludeController()
@Controller('webhooks/polar')
export class PolarWebhookController {
  private readonly logger = new Logger(PolarWebhookController.name);

  constructor(
    @InjectRepository(PgWebhookEventEntity)
    private readonly webhookRepo: Repository<PgWebhookEventEntity>,
    @InjectRepository(SubSubscriptionEntity)
    private readonly sbnRepo: Repository<SubSubscriptionEntity>,
    @InjectRepository(PgSubscriptionEntity)
    private readonly pgSbnRepo: Repository<PgSubscriptionEntity>,
    private readonly polarService: PolarService,
    private readonly subscriptionService: SubscriptionService,
    private readonly tokenWalletService: TokenWalletService,
    private readonly dataSource: DataSource,
  ) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('webhook-id') webhookId: string,
    @Headers('webhook-timestamp') webhookTimestamp: string,
    @Headers('webhook-signature') webhookSignature: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<{ received: boolean }> {
    // ① 서명 검증
    this.polarService.verifyWebhookSignature(
      webhookId,
      webhookTimestamp,
      webhookSignature,
      req.rawBody!,
    );

    const eventType = payload.type as string;

    // ② 멱등성 체크
    const existing = await this.webhookRepo.findOne({
      where: { pgw_polar_event_id: webhookId },
    });
    if (existing && existing.pgw_status === WebhookEventStatus.PROCESSED) {
      this.logger.log(`[Webhook] 이미 처리된 이벤트 skip: ${webhookId}`);
      return { received: true };
    }

    // ③ 이벤트 로그 저장 (PENDING)
    const event =
      existing ??
      (await this.webhookRepo.save(
        this.webhookRepo.create({
          pgw_event_type: eventType,
          pgw_polar_event_id: webhookId,
          pgw_payload: payload,
          pgw_status: WebhookEventStatus.PENDING,
        }),
      ));

    try {
      await this._dispatch(eventType, payload, event.pgw_id);

      await this.webhookRepo.update(event.pgw_id, {
        pgw_status: WebhookEventStatus.PROCESSED,
        pgw_processed_at: new Date(),
      });
    } catch (err) {
      this.logger.error(`[Webhook] 처리 실패: ${eventType}`, err);
      await this.webhookRepo.update(event.pgw_id, {
        pgw_status: WebhookEventStatus.FAILED,
        pgw_error_message: (err as Error).message,
        pgw_retry_count: (event.pgw_retry_count ?? 0) + 1,
      });
      throw err;
    }

    return { received: true };
  }

  private async _dispatch(
    eventType: string,
    payload: Record<string, unknown>,
    pgwId: string,
  ): Promise<void> {
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.active':
        await this._onSubscriptionActivated(payload, pgwId);
        break;

      case 'subscription.updated':
        await this._onSubscriptionUpdated(payload);
        break;

      case 'subscription.canceled':
      case 'subscription.revoked':
        await this._onSubscriptionCancelled(payload);
        break;

      case 'order.created':
        await this._onOrderCreated(payload, pgwId);
        break;

      default:
        this.logger.log(`[Webhook] 미처리 이벤트 ignore: ${eventType}`);
    }
  }

  private async _onSubscriptionActivated(
    payload: Record<string, unknown>,
    pgwId: string,
  ): Promise<void> {
    const sub = payload.data as Record<string, unknown>;
    const meta = (sub.metadata ?? {}) as Record<string, string>;
    const entId = meta['ent_id'];
    if (!entId) throw new Error('Missing ent_id in webhook metadata');

    await this.dataSource.transaction(async (tx) => {
      const sbn = await tx.findOne(SubSubscriptionEntity, {
        where: { ent_id: entId },
        relations: ['plan'],
        lock: { mode: 'pessimistic_write' },
      });
      if (!sbn) {
        throw new NotFoundException(
          `Subscription not found for ent_id=${entId}`,
        );
      }

      sbn.sbn_status = SubscriptionStatus.ACTIVE;
      sbn.sbn_pg_subscription_id = sub.id as string;
      sbn.sbn_pg_customer_id = (sub.customer_id ?? sub.user_id) as string;
      sbn.sbn_current_period_start = new Date(
        sub.current_period_start as string,
      );
      sbn.sbn_current_period_end = new Date(sub.current_period_end as string);
      await tx.save(sbn);

      await tx.upsert(
        PgSubscriptionEntity,
        {
          pgs_polar_subscription_id: sub.id as string,
          ent_id: entId,
          sbn_id: sbn.sbn_id,
          pgs_polar_customer_id: sbn.sbn_pg_customer_id!,
          pgs_status: sub.status as string,
          pgs_current_period_start: sbn.sbn_current_period_start,
          pgs_current_period_end: sbn.sbn_current_period_end,
          pgs_raw_data: sub as any,
        },
        ['pgs_polar_subscription_id'],
      );

      if (sbn.plan.pln_is_token_monthly_reset) {
        await this.tokenWalletService.grantMonthly(
          entId,
          sbn.sbn_id,
          sbn.sbn_paid_user_count,
          sbn.plan.pln_token_per_user_monthly,
          tx,
        );
      }
    });

    this.logger.log(`[Webhook] 구독 활성화 완료: ent_id=${entId}`);
  }

  private async _onSubscriptionUpdated(
    payload: Record<string, unknown>,
  ): Promise<void> {
    const sub = payload.data as Record<string, unknown>;
    const polarId = sub.id as string;

    const pgSbn = await this.pgSbnRepo.findOne({
      where: { pgs_polar_subscription_id: polarId },
      relations: ['subscription'],
    });
    if (!pgSbn) return;

    pgSbn.pgs_status = sub.status as string;
    pgSbn.pgs_raw_data = sub;
    await this.pgSbnRepo.save(pgSbn);

    const sbn = pgSbn.subscription;
    sbn.sbn_current_period_end = new Date(sub.current_period_end as string);
    await this.sbnRepo.save(sbn);
  }

  private async _onSubscriptionCancelled(
    payload: Record<string, unknown>,
  ): Promise<void> {
    const sub = payload.data as Record<string, unknown>;
    const polarId = sub.id as string;

    const pgSbn = await this.pgSbnRepo.findOne({
      where: { pgs_polar_subscription_id: polarId },
      relations: ['subscription'],
    });
    if (!pgSbn) return;

    pgSbn.pgs_status = sub.status as string;
    await this.pgSbnRepo.save(pgSbn);

    const sbn = pgSbn.subscription;
    sbn.sbn_status = SubscriptionStatus.CANCELLED;
    sbn.sbn_cancelled_at = new Date();
    await this.sbnRepo.save(sbn);

    this.logger.log(`[Webhook] 구독 해지: ent_id=${sbn.ent_id}`);
  }

  private async _onOrderCreated(
    payload: Record<string, unknown>,
    pgwId: string,
  ): Promise<void> {
    const order = payload.data as Record<string, unknown>;
    const meta = (order.metadata ?? {}) as Record<string, string>;
    const entId = meta['ent_id'];
    if (!entId) return;

    const orderType = meta['order_type'];
    const sbn = await this.sbnRepo.findOne({ where: { ent_id: entId } });
    if (!sbn) return;

    if (orderType === 'token_addon') {
      const tokenAmount = parseInt(meta['token_amount'] ?? '50000', 10);
      await this.tokenWalletService.purchaseAddon(
        entId,
        sbn.sbn_id,
        tokenAmount,
        pgwId,
      );
      this.logger.log(
        `[Webhook] 토큰 충전: ent_id=${entId} amount=${tokenAmount}`,
      );
    }

    if (orderType === 'storage_addon') {
      const addGb = parseInt(meta['storage_gb'] ?? '5', 10);
      await this.subscriptionService.addStorageAddon(entId, addGb);
      this.logger.log(
        `[Webhook] 스토리지 추가: ent_id=${entId} addGb=${addGb}`,
      );
    }
  }
}
