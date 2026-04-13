import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PgConfigEntity } from './entity/pg-config.entity';
import { PgTransactionEntity } from './entity/pg-transaction.entity';
import { AiQuotaProductEntity } from './entity/ai-quota-product.entity';
import { AiQuotaTopupEntity } from './entity/ai-quota-topup.entity';
import { EntityAiConfigEntity } from '../entity-settings/entity/entity-ai-config.entity';
import { PgConfigService } from './service/pg-config.service';
import { MegapayService } from './service/megapay.service';
import { AiQuotaProductService } from './service/ai-quota-product.service';
import { AiQuotaTopupService } from './service/ai-quota-topup.service';
import { PgConfigController } from './controller/pg-config.controller';
import { PgPaymentController } from './controller/pg-payment.controller';
import { PgWebhookController } from './controller/pg-webhook.controller';
import { AiQuotaController } from './controller/ai-quota.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PgConfigEntity,
      PgTransactionEntity,
      AiQuotaProductEntity,
      AiQuotaTopupEntity,
      EntityAiConfigEntity,
    ]),
    SettingsModule, // CryptoService
  ],
  controllers: [
    PgConfigController,
    PgPaymentController,
    PgWebhookController,
    AiQuotaController,
  ],
  providers: [
    PgConfigService,
    MegapayService,
    AiQuotaProductService,
    AiQuotaTopupService,
  ],
  exports: [PgConfigService, MegapayService, AiQuotaProductService, AiQuotaTopupService],
})
export class PaymentGatewayModule {}
