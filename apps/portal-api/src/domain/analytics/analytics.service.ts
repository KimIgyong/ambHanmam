import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteEventLogEntity } from './entity/site-event-log.entity';
import { CreateSiteEventRequest } from './dto/create-site-event.request';

@Injectable()
export class PortalAnalyticsService {
  private readonly logger = new Logger(PortalAnalyticsService.name);

  constructor(
    @InjectRepository(SiteEventLogEntity)
    private readonly eventLogRepo: Repository<SiteEventLogEntity>,
  ) {}

  async recordEvent(
    dto: CreateSiteEventRequest,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const entity = this.eventLogRepo.create({
      selSite: 'portal',
      selEventType: dto.event_type,
      selPagePath: dto.page_path || null,
      selReferrer: dto.referrer || null,
      selIpAddress: ip || null,
      selUserAgent: userAgent ? userAgent.substring(0, 500) : null,
      selMetadata: dto.metadata || {},
    });

    await this.eventLogRepo.save(entity).catch((err) => {
      this.logger.warn(`Portal event log save failed: ${err.message}`);
    });
  }
}
