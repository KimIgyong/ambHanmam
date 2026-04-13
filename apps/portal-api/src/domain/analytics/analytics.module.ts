import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteEventLogEntity } from './entity/site-event-log.entity';
import { PortalAnalyticsController } from './analytics.controller';
import { PortalAnalyticsService } from './analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteEventLogEntity])],
  controllers: [PortalAnalyticsController],
  providers: [PortalAnalyticsService],
})
export class PortalAnalyticsModule {}
