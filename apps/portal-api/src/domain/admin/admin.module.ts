import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminDashboardService } from './service/admin-dashboard.service';
import { AdminDashboardController } from './controller/admin-dashboard.controller';
import { AdminCustomerController } from './controller/admin-customer.controller';
import { PortalCustomerEntity } from '../auth/entity/portal-customer.entity';
import { SvcSubscriptionEntity } from '../../shared-entities/subscription.entity';
import { SvcUsageRecordEntity } from '../../shared-entities/usage-record.entity';
import { SvcClientEntity } from '../../shared-entities/client.entity';
import { PortalPaymentEntity } from '../payment-gateway/entity/portal-payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortalCustomerEntity,
      SvcSubscriptionEntity,
      SvcUsageRecordEntity,
      SvcClientEntity,
      PortalPaymentEntity,
    ]),
  ],
  controllers: [AdminDashboardController, AdminCustomerController],
  providers: [AdminDashboardService],
})
export class AdminModule {}
