import { Injectable } from '@nestjs/common';
import { UnitCode } from '@amb/types';
import { BaseAgentService } from './base-agent.service';
import { ClaudeService } from '../../../infrastructure/external/claude/claude.service';
import { getDevelopmentPrompt } from '../prompt/development.prompt';

@Injectable()
export class DevelopmentAgentService extends BaseAgentService {
  constructor(claudeService: ClaudeService) {
    super(claudeService);
  }
  get unitCode(): UnitCode {
    return 'DEVELOPMENT';
  }
  getSystemPrompt(): string {
    return getDevelopmentPrompt();
  }
}
