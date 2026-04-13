import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { ActivityStatsService } from './activity-stats.service';

@Injectable()
export class ActivitySnapshotService {
  private readonly logger = new Logger(ActivitySnapshotService.name);

  constructor(
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    private readonly activityStatsService: ActivityStatsService,
  ) {}

  /** 매일 01:00에 전일 통계 집계 */
  @Cron('0 1 * * *')
  async handleDailySnapshot() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);

    this.logger.log(`[DailySnapshot] Aggregating ${dateStr}...`);

    const entities = await this.entityRepo
      .createQueryBuilder('e')
      .select('e.ent_id')
      .where('e.ent_deleted_at IS NULL')
      .getRawMany();

    let totalAggregated = 0;
    for (const ent of entities) {
      try {
        const count = await this.activityStatsService.aggregateDate(ent.ent_id, dateStr);
        totalAggregated += count;
      } catch (err) {
        this.logger.error(`[DailySnapshot] Entity ${ent.ent_id} failed: ${err.message}`);
      }
    }

    this.logger.log(`[DailySnapshot] Done. ${totalAggregated} records aggregated.`);
  }
}
