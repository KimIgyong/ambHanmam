import { Observable, map, finalize } from 'rxjs';
import { ClaudeService, ClaudeStreamEvent, AiUsageContext } from '../../../infrastructure/external/claude/claude.service';
import { UnitCode } from '@amb/types';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export abstract class BaseAgentService {
  constructor(protected readonly claudeService: ClaudeService) {}

  abstract get unitCode(): UnitCode;
  abstract getSystemPrompt(): string;

  private getLanguageInstruction(language?: string): string {
    const lang = language?.split(',')[0]?.split('-')[0]?.trim() || 'en';
    const instructions: Record<string, string> = {
      en: '\n\n## Language\nAlways respond in English.',
      ko: '\n\n## 언어\n항상 한국어로 응답합니다.',
      vi: '\n\n## Ngôn ngữ\nLuôn phản hồi bằng tiếng Việt.',
    };
    return instructions[lang] || instructions['en'];
  }

  async chat(messages: AgentMessage[], language?: string, usageContext?: AiUsageContext): Promise<string> {
    const prompt = this.getSystemPrompt() + this.getLanguageInstruction(language);
    return this.claudeService.sendMessage(prompt, messages, { usageContext });
  }

  chatStream(messages: AgentMessage[], language?: string, usageContext?: AiUsageContext): Observable<MessageEvent> {
    let fullContent = '';
    const prompt = this.getSystemPrompt() + this.getLanguageInstruction(language);

    return this.claudeService
      .streamMessage(prompt, messages, usageContext)
      .pipe(
        map((event: ClaudeStreamEvent) => {
          if (event.type === 'content') {
            fullContent += event.content || '';
            return {
              data: JSON.stringify({ content: event.content, done: false }),
            } as MessageEvent;
          }

          if (event.type === 'done') {
            return {
              data: JSON.stringify({
                content: '',
                done: true,
                fullContent,
                stopReason: event.stopReason || 'end_turn',
              }),
            } as MessageEvent;
          }

          return {
            data: JSON.stringify({ error: event.error, code: event.code, done: true }),
          } as MessageEvent;
        }),
        finalize(() => {
          fullContent = '';
        }),
      );
  }
}
