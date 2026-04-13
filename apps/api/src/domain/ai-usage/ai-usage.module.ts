import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTokenUsageEntity } from './entity/ai-token-usage.entity';
import { AiTokenEntitySummaryEntity } from './entity/ai-token-entity-summary.entity';
import { EntityApiQuotaEntity } from './entity/entity-api-quota.entity';
import { EntityAiConfigEntity } from '../entity-settings/entity/entity-ai-config.entity';
import { AiUsageService } from './service/ai-usage.service';
import { ApiQuotaInterceptor } from './interceptor/api-quota.interceptor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiTokenUsageEntity,
      AiTokenEntitySummaryEntity,
      EntityApiQuotaEntity,
      EntityAiConfigEntity,
    ]),
  ],
  providers: [AiUsageService, ApiQuotaInterceptor],
  exports: [AiUsageService, ApiQuotaInterceptor],
})
export class AiUsageModule {}
