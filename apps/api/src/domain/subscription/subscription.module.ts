import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { SubPlanEntity } from './entity/sub-plan.entity';
import { SubSubscriptionEntity } from './entity/sub-subscription.entity';
import { SubTokenWalletEntity } from './entity/sub-token-wallet.entity';
import { SubTokenLedgerEntity } from './entity/sub-token-ledger.entity';
import { SubStorageQuotaEntity } from './entity/sub-storage-quota.entity';
import { SubPlanFeatureEntity } from './entity/sub-plan-feature.entity';
import { SubPlanTierEntity } from './entity/sub-plan-tier.entity';
import { SubPlanAddonEntity } from './entity/sub-plan-addon.entity';
import { PgSubscriptionEntity } from './entity/pg-subscription.entity';
import { PgWebhookEventEntity } from './entity/pg-webhook-event.entity';

import { SubscriptionService } from './service/subscription.service';
import { TokenWalletService } from './service/token-wallet.service';
import { StorageQuotaService } from './service/storage-quota.service';
import { PolarService } from './service/polar.service';
import { PlanAdminService } from './service/plan-admin.service';

import { SubscriptionController } from './controller/subscription.controller';
import { PolarWebhookController } from './controller/polar-webhook.controller';
import { PlanAdminController } from './controller/plan-admin.controller';

import { TokenBalanceGuard } from './guard/token-balance.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      SubPlanEntity,
      SubSubscriptionEntity,
      SubTokenWalletEntity,
      SubTokenLedgerEntity,
      SubStorageQuotaEntity,
      SubPlanFeatureEntity,
      SubPlanTierEntity,
      SubPlanAddonEntity,
      PgSubscriptionEntity,
      PgWebhookEventEntity,
    ]),
  ],
  controllers: [SubscriptionController, PolarWebhookController, PlanAdminController],
  providers: [
    SubscriptionService,
    TokenWalletService,
    StorageQuotaService,
    PolarService,
    PlanAdminService,
    TokenBalanceGuard,
  ],
  exports: [
    SubscriptionService,
    TokenWalletService,
    StorageQuotaService,
    PlanAdminService,
    TokenBalanceGuard,
  ],
})
export class SubscriptionModule {}
