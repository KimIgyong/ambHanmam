import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteEventLogEntity } from './entity/site-event-log.entity';
import { SiteSettingsEntity } from '../settings/entity/site-settings.entity';
import { LoginHistoryEntity } from '../entity-settings/entity/login-history.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { AnalyticsService } from './service/analytics.service';
import { AnalyticsController } from './controller/analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SiteEventLogEntity,
      SiteSettingsEntity,
      LoginHistoryEntity,
      HrEntityEntity,
      UserEntity,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
