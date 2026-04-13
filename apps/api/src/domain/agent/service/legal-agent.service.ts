import { Injectable } from '@nestjs/common';
import { UnitCode } from '@amb/types';
import { BaseAgentService } from './base-agent.service';
import { ClaudeService } from '../../../infrastructure/external/claude/claude.service';
import { getLegalPrompt } from '../prompt/legal.prompt';

@Injectable()
export class LegalAgentService extends BaseAgentService {
  constructor(claudeService: ClaudeService) {
    super(claudeService);
  }

  get unitCode(): UnitCode {
    return 'LEGAL';
  }

  getSystemPrompt(): string {
    return getLegalPrompt();
  }
}
