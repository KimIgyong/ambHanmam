import { Injectable, HttpStatus } from '@nestjs/common';
import { UnitCode } from '@amb/types';
import { BaseAgentService } from './base-agent.service';
import { LegalAgentService } from './legal-agent.service';
import { AccountingAgentService } from './accounting-agent.service';
import { TranslationAgentService } from './translation-agent.service';
import { PmAgentService } from './pm-agent.service';
import { DevelopmentAgentService } from './development-agent.service';
import { ItAgentService } from './it-agent.service';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class AgentFactoryService {
  private readonly agentMap: Map<string, BaseAgentService>;

  constructor(
    private readonly legalAgent: LegalAgentService,
    private readonly accountingAgent: AccountingAgentService,
    private readonly translationAgent: TranslationAgentService,
    private readonly pmAgent: PmAgentService,
    private readonly developmentAgent: DevelopmentAgentService,
    private readonly itAgent: ItAgentService,
  ) {
    this.agentMap = new Map<string, BaseAgentService>([
      ['LEGAL', this.legalAgent],
      ['ACCOUNTING', this.accountingAgent],
      ['TRANSLATION', this.translationAgent],
      ['PM', this.pmAgent],
      ['DEVELOPMENT', this.developmentAgent],
      ['IT', this.itAgent],
    ]);
  }

  getAgent(unitCode: UnitCode | string): BaseAgentService {
    const agent = this.agentMap.get(unitCode);
    if (!agent) {
      throw new BusinessException(
        ERROR_CODE.INVALID_DEPARTMENT.code,
        ERROR_CODE.INVALID_DEPARTMENT.message,
        HttpStatus.BAD_REQUEST,
      );
    }
    return agent;
  }
}
