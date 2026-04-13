import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageService } from './service/usage.service';
import { UsageController } from './controller/usage.controller';
import { UsageReportController } from './controller/usage-report.controller';
import { SvcUsageRecordEntity } from '../../shared-entities/usage-record.entity';
import { SvcSubscriptionEntity } from '../../shared-entities/subscription.entity';
import { SvcPlanEntity } from '../../shared-entities/service-plan.entity';
import { PortalCustomerEntity } from '../auth/entity/portal-customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SvcUsageRecordEntity,
      SvcSubscriptionEntity,
      SvcPlanEntity,
      PortalCustomerEntity,
    ]),
  ],
  controllers: [UsageController, UsageReportController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
