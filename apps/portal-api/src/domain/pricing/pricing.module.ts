import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubPlanEntity } from '../../shared-entities/sub-plan.entity';
import { SubPlanFeatureEntity } from '../../shared-entities/sub-plan-feature.entity';
import { SubPlanTierEntity } from '../../shared-entities/sub-plan-tier.entity';
import { SubPlanAddonEntity } from '../../shared-entities/sub-plan-addon.entity';
import { PublicPricingService } from './public-pricing.service';
import { PublicPricingController } from './public-pricing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubPlanEntity,
      SubPlanFeatureEntity,
      SubPlanTierEntity,
      SubPlanAddonEntity,
    ]),
  ],
  controllers: [PublicPricingController],
  providers: [PublicPricingService],
})
export class PricingModule {}
