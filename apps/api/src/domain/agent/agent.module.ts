import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentController } from './controller/agent.controller';
import { AgentConfigController } from './controller/agent-config.controller';
import { AgentFactoryService } from './service/agent-factory.service';
import { AgentConfigService } from './service/agent-config.service';
import { LegalAgentService } from './service/legal-agent.service';
import { AccountingAgentService } from './service/accounting-agent.service';
import { TranslationAgentService } from './service/translation-agent.service';
import { PmAgentService } from './service/pm-agent.service';
import { DevelopmentAgentService } from './service/development-agent.service';
import { ItAgentService } from './service/it-agent.service';
import { AgentConfigEntity } from './entity/agent-config.entity';
import { UserCellEntity } from '../members/entity/user-cell.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AgentConfigEntity, UserCellEntity])],
  controllers: [AgentController, AgentConfigController],
  providers: [
    AgentFactoryService,
    AgentConfigService,
    LegalAgentService,
    AccountingAgentService,
    TranslationAgentService,
    PmAgentService,
    DevelopmentAgentService,
    ItAgentService,
  ],
  exports: [AgentFactoryService, AgentConfigService],
})
export class AgentModule {}
