import { Module, Global } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { SettingsModule } from '../../../domain/settings/settings.module';
import { AiUsageModule } from '../../../domain/ai-usage/ai-usage.module';

@Global()
@Module({
  imports: [SettingsModule, AiUsageModule],
  providers: [ClaudeService],
  exports: [ClaudeService],
})
export class ClaudeModule {}
