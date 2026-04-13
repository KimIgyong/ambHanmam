import { Injectable } from '@nestjs/common';
import { UnitCode } from '@amb/types';
import { BaseAgentService } from './base-agent.service';
import { ClaudeService } from '../../../infrastructure/external/claude/claude.service';
import { getAccountingPrompt } from '../prompt/accounting.prompt';

@Injectable()
export class AccountingAgentService extends BaseAgentService {
  constructor(claudeService: ClaudeService) {
    super(claudeService);
  }

  get unitCode(): UnitCode {
    return 'ACCOUNTING';
  }

  getSystemPrompt(): string {
    return getAccountingPrompt();
  }
}
