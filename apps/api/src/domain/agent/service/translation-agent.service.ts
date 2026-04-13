import { Injectable } from '@nestjs/common';
import { UnitCode } from '@amb/types';
import { BaseAgentService } from './base-agent.service';
import { ClaudeService } from '../../../infrastructure/external/claude/claude.service';
import { getTranslationPrompt } from '../prompt/translation.prompt';

@Injectable()
export class TranslationAgentService extends BaseAgentService {
  constructor(claudeService: ClaudeService) {
    super(claudeService);
  }
  get unitCode(): UnitCode {
    return 'TRANSLATION';
  }
  getSystemPrompt(): string {
    return getTranslationPrompt();
  }
}
