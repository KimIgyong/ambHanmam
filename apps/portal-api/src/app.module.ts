import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthController } from './health.controller';
import { AuthModule } from './domain/auth/auth.module';
import { CatalogModule } from './domain/catalog/catalog.module';
import { StripeModule } from './domain/stripe/stripe.module';
import { SubscriptionModule } from './domain/subscription/subscription.module';
import { UsageModule } from './domain/usage/usage.module';
import { PaymentGatewayModule } from './domain/payment-gateway/payment-gateway.module';
import { AdminModule } from './domain/admin/admin.module';
import { PricingModule } from './domain/pricing/pricing.module';
import { PortalAnalyticsModule } from './domain/analytics/analytics.module';
import { join } from 'path';

// Service Management entities (shared with internal API via same DB)
import { SvcServiceEntity } from './shared-entities/service.entity';
import { SvcPlanEntity } from './shared-entities/service-plan.entity';
import { SvcClientEntity } from './shared-entities/client.entity';
import { SvcClientContactEntity } from './shared-entities/client-contact.entity';
import { SvcSubscriptionEntity } from './shared-entities/subscription.entity';
import { SvcSubscriptionHistoryEntity } from './shared-entities/subscription-history.entity';
import { SvcClientNoteEntity } from './shared-entities/client-note.entity';
import { SvcUsageRecordEntity } from './shared-entities/usage-record.entity';
import { PortalPaymentEntity } from './domain/payment-gateway/entity/portal-payment.entity';
import { SmtpSettingsEntity } from './shared-entities/smtp-settings.entity';
import { SubPlanEntity } from './shared-entities/sub-plan.entity';
import { SubPlanFeatureEntity } from './shared-entities/sub-plan-feature.entity';
import { SubPlanTierEntity } from './shared-entities/sub-plan-tier.entity';
import { SubPlanAddonEntity } from './shared-entities/sub-plan-addon.entity';

// Portal-specific entities
import { PortalCustomerEntity } from './domain/auth/entity/portal-customer.entity';
import { SiteEventLogEntity } from './domain/analytics/entity/site-event-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '../../env/portal-backend/.env.development'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const username = configService.get<string>('DB_USERNAME');
        const password = configService.get<string>('DB_PASSWORD');
        if (!username || !password) {
          throw new Error('DB_USERNAME and DB_PASSWORD environment variables are required');
        }
        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5442),
          username,
          password,
          database: configService.get<string>('DB_DATABASE', 'db_amb_hanmam'),
          entities: [
            SvcServiceEntity,
            SvcPlanEntity,
            SvcClientEntity,
            SvcClientContactEntity,
            SvcSubscriptionEntity,
            SvcSubscriptionHistoryEntity,
            SvcClientNoteEntity,
            PortalCustomerEntity,
            SvcUsageRecordEntity,
            PortalPaymentEntity,
            SmtpSettingsEntity,
            SubPlanEntity,
            SubPlanFeatureEntity,
            SubPlanTierEntity,
            SubPlanAddonEntity,
            SiteEventLogEntity,
          ],
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          logging: configService.get<string>('NODE_ENV') === 'development',
          extra: {
            max: 10,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    EventEmitterModule.forRoot(),
    AuthModule,
    CatalogModule,
    StripeModule,
    SubscriptionModule,
    UsageModule,
    PaymentGatewayModule,
    AdminModule,
    PricingModule,
    PortalAnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
