import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './service/stripe.service';
import { StripeWebhookController } from './controller/stripe-webhook.controller';
import { StripeCheckoutController } from './controller/stripe-checkout.controller';
import { SvcClientEntity } from '../../shared-entities/client.entity';
import { SvcPlanEntity } from '../../shared-entities/service-plan.entity';
import { SvcSubscriptionEntity } from '../../shared-entities/subscription.entity';
import { SvcSubscriptionHistoryEntity } from '../../shared-entities/subscription-history.entity';
import { PortalCustomerEntity } from '../auth/entity/portal-customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SvcClientEntity,
      SvcPlanEntity,
      SvcSubscriptionEntity,
      SvcSubscriptionHistoryEntity,
      PortalCustomerEntity,
    ]),
  ],
  controllers: [StripeCheckoutController, StripeWebhookController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
