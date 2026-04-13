import { Injectable } from '@nestjs/common';
import { UnitCode } from '@amb/types';
import { BaseAgentService } from './base-agent.service';
import { ClaudeService } from '../../../infrastructure/external/claude/claude.service';
import { getPmPrompt } from '../prompt/pm.prompt';

@Injectable()
export class PmAgentService extends BaseAgentService {
  constructor(claudeService: ClaudeService) {
    super(claudeService);
  }
  get unitCode(): UnitCode {
    return 'PM';
  }
  getSystemPrompt(): string {
    return getPmPrompt();
  }
}
