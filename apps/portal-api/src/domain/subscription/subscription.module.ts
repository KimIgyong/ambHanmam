import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalSubscriptionService } from './service/portal-subscription.service';
import { PortalSubscriptionController } from './controller/portal-subscription.controller';
import { SvcSubscriptionEntity } from '../../shared-entities/subscription.entity';
import { SvcSubscriptionHistoryEntity } from '../../shared-entities/subscription-history.entity';
import { SvcPlanEntity } from '../../shared-entities/service-plan.entity';
import { SvcServiceEntity } from '../../shared-entities/service.entity';
import { PortalCustomerEntity } from '../auth/entity/portal-customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SvcSubscriptionEntity,
      SvcSubscriptionHistoryEntity,
      SvcPlanEntity,
      SvcServiceEntity,
      PortalCustomerEntity,
    ]),
  ],
  controllers: [PortalSubscriptionController],
  providers: [PortalSubscriptionService],
  exports: [PortalSubscriptionService],
})
export class SubscriptionModule {}
