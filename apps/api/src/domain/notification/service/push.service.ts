import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscriptionEntity } from '../entity/push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  tag?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly vapidConfigured: boolean;

  constructor(
    @InjectRepository(PushSubscriptionEntity)
    private readonly pushSubRepo: Repository<PushSubscriptionEntity>,
    private readonly configService: ConfigService,
  ) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT') || 'mailto:admin@amoeba.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('Web Push VAPID configured');
    } else {
      this.vapidConfigured = false;
      this.logger.warn('VAPID keys not configured — Web Push disabled');
    }
  }

  getVapidPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || null;
  }

  async subscribe(
    userId: string,
    entityId: string | undefined,
    endpoint: string,
    p256dh: string,
    auth: string,
    userAgent?: string,
  ): Promise<PushSubscriptionEntity> {
    // Upsert by endpoint
    let existing = await this.pushSubRepo.findOne({
      where: { psbEndpoint: endpoint },
    });

    if (existing) {
      existing.usrId = userId;
      existing.entId = entityId || null;
      existing.psbP256dh = p256dh;
      existing.psbAuth = auth;
      existing.psbUserAgent = userAgent || null;
      return this.pushSubRepo.save(existing);
    }

    const entity = this.pushSubRepo.create({
      usrId: userId,
      entId: entityId || null,
      psbEndpoint: endpoint,
      psbP256dh: p256dh,
      psbAuth: auth,
      psbUserAgent: userAgent || null,
    });
    return this.pushSubRepo.save(entity);
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.pushSubRepo.delete({ psbEndpoint: endpoint });
  }

  async sendPush(userId: string, payload: PushPayload): Promise<void> {
    if (!this.vapidConfigured) return;

    const subscriptions = await this.pushSubRepo.find({
      where: { usrId: userId },
    });

    if (subscriptions.length === 0) return;

    this.logger.log(`Sending push to user ${userId} (${subscriptions.length} subscriptions): ${payload.title}`);

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.psbEndpoint,
            keys: { p256dh: sub.psbP256dh, auth: sub.psbAuth },
          },
          JSON.stringify(payload),
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid — cleanup
          this.logger.log(`Removing expired push subscription: ${sub.psbId}`);
          await this.pushSubRepo.delete({ psbId: sub.psbId });
        } else {
          this.logger.error(
            `Push failed for ${sub.psbId} (status=${err.statusCode}): ${err.message}`,
          );
        }
      }
    }
  }

  async sendPushToMany(userIds: string[], payload: PushPayload): Promise<void> {
    if (!this.vapidConfigured || userIds.length === 0) return;

    const uniqueIds = [...new Set(userIds)];
    await Promise.allSettled(
      uniqueIds.map((userId) => this.sendPush(userId, payload)),
    );
  }
}
