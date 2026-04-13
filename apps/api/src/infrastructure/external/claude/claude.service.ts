import { Injectable, HttpStatus, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { Observable, Subject } from 'rxjs';
import { ApiKeyService } from '../../../domain/settings/service/api-key.service';
import { AiUsageService } from '../../../domain/ai-usage/service/ai-usage.service';
import { BusinessException } from '../../../global/filter/business.exception';

export interface ClaudeUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ClaudeStreamEvent {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
  code?: string;
  stopReason?: string;
  usage?: ClaudeUsage;
}

export interface ClaudeSendResult {
  text: string;
  usage: ClaudeUsage;
}

export interface AiUsageContext {
  entId: string;
  usrId: string;
  sourceType: string;
  cvsId?: string;
}

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private client: Anthropic | null = null;
  private isMockMode: boolean;
  private cachedApiKey: string | null = null;
  private cacheExpiresAt = 0;
  private currentKeySource: 'DB' | 'ENV' | 'MOCK' = 'MOCK';
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5분
  private static readonly MODEL = 'claude-sonnet-4-20250514';

  constructor(
    private readonly configService: ConfigService,
    private readonly apiKeyService: ApiKeyService,
    @Optional() private readonly aiUsageService?: AiUsageService,
  ) {
    // 생성자에서는 클라이언트를 생성하지 않음
    // 첫 번째 API 호출 시 ensureClient()에서 DB 우선 조회
    this.isMockMode = true;
    this.logger.log('ClaudeService initialized. API key will be resolved from DB on first call.');
  }

  private async ensureClient(): Promise<boolean> {
    const now = Date.now();

    // 1. 캐시된 키가 아직 유효하면 사용
    if (this.cachedApiKey && now < this.cacheExpiresAt) {
      if (!this.client) {
        this.client = new Anthropic({ apiKey: this.cachedApiKey });
      }
      this.isMockMode = false;
      return true;
    }

    // 2. DB에서 키 조회 (법인별 → 시스템 공동)
    try {
      const dbKey = await this.apiKeyService.getDecryptedKey('ANTHROPIC');
      if (dbKey) {
        if (dbKey !== this.cachedApiKey) {
          this.client = new Anthropic({ apiKey: dbKey });
          this.logger.log('Loaded Anthropic API key from DB.');
        }
        this.cachedApiKey = dbKey;
        this.cacheExpiresAt = now + ClaudeService.CACHE_TTL;
        this.currentKeySource = 'DB';
        this.isMockMode = false;
        return true;
      }
    } catch (error) {
      this.logger.warn('Failed to query API key from DB, falling back to env.');
    }

    // 3. 환경변수 폴백
    const envKey = this.configService.get<string>('CLAUDE_API_KEY', '');
    if (envKey && envKey !== 'your_claude_api_key_here') {
      this.client = new Anthropic({ apiKey: envKey });
      this.cachedApiKey = envKey;
      this.cacheExpiresAt = now + ClaudeService.CACHE_TTL;
      this.currentKeySource = 'ENV';
      this.isMockMode = false;
      this.logger.warn('Using env CLAUDE_API_KEY as fallback (DB key not found).');
      return true;
    }

    // 4. Mock Mode
    this.currentKeySource = 'MOCK';
    this.isMockMode = true;
    return false;
  }

  /** 토큰 사용량 자동 기록 (fire-and-forget) */
  private recordUsageIfContext(usage: ClaudeUsage, context?: AiUsageContext): void {
    if (!context || !this.aiUsageService) return;
    const totalTokens = usage.inputTokens + usage.outputTokens;
    this.aiUsageService
      .recordUsage({
        entId: context.entId,
        usrId: context.usrId,
        cvsId: context.cvsId,
        sourceType: context.sourceType,
        model: ClaudeService.MODEL,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens,
        keySource: this.currentKeySource === 'DB' ? 'SHARED' : 'ENTITY',
      })
      .catch((e) => this.logger.warn('Failed to record AI usage', e.message));
  }

  /** usageContext가 있으면 쿼터 초과 체크 → 초과 시 BusinessException throw */
  private async checkQuotaIfNeeded(usageContext?: AiUsageContext): Promise<void> {
    if (!usageContext?.entId || !this.aiUsageService) return;
    const result = await this.aiUsageService.checkQuota(usageContext.entId);
    if (!result.allowed) {
      const isDaily = result.dailyLimit && (result.dailyUsed ?? 0) >= result.dailyLimit;
      throw new BusinessException(
        isDaily ? 'E4010' : 'E4011',
        'AI quota exceeded',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async sendMessage(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: { maxTokens?: number; usageContext?: AiUsageContext },
  ): Promise<string>;
  async sendMessage(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: { withUsage: true; maxTokens?: number; usageContext?: AiUsageContext },
  ): Promise<ClaudeSendResult>;
  async sendMessage(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: { withUsage?: boolean; maxTokens?: number; usageContext?: AiUsageContext },
  ): Promise<string | ClaudeSendResult> {
    await this.ensureClient();
    await this.checkQuotaIfNeeded(options?.usageContext);

    if (this.isMockMode) {
      const text = this.getMockResponse(messages);
      if (options?.withUsage) {
        return { text, usage: { inputTokens: 0, outputTokens: 0 } };
      }
      return text;
    }

    const response = await this.client!.messages.create({
      model: ClaudeService.MODEL,
      max_tokens: options?.maxTokens || 4096,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const text = textBlock ? textBlock.text : '';

    // 토큰 사용량 자동 기록
    const usage: ClaudeUsage = {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
    this.recordUsageIfContext(usage, options?.usageContext);

    if (options?.withUsage) {
      return { text, usage };
    }
    return text;
  }

  streamMessage(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    usageContext?: AiUsageContext,
  ): Observable<ClaudeStreamEvent> {
    const subject = new Subject<ClaudeStreamEvent>();

    (async () => {
      await this.ensureClient();

      try {
        await this.checkQuotaIfNeeded(usageContext);
      } catch (error) {
        if (error instanceof BusinessException) {
          subject.next({ type: 'error', error: error.message, code: error.errorCode });
        } else {
          subject.next({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        }
        subject.complete();
        return;
      }

      if (this.isMockMode) {
        this.getMockStream(messages).subscribe(subject);
        return;
      }

      try {
        const stream = this.client!.messages.stream({
          model: ClaudeService.MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages,
        });

        stream.on('text', (text) => {
          subject.next({ type: 'content', content: text });
        });

        stream.on('message', (message) => {
          const usage: ClaudeUsage = {
            inputTokens: message.usage?.input_tokens ?? 0,
            outputTokens: message.usage?.output_tokens ?? 0,
          };

          // 토큰 사용량 자동 기록
          this.recordUsageIfContext(usage, usageContext);

          subject.next({
            type: 'done',
            stopReason: message.stop_reason ?? undefined,
            usage,
          });
          subject.complete();
        });

        stream.on('error', (error) => {
          subject.next({ type: 'error', error: error.message });
          subject.complete();
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const code = error instanceof BusinessException ? error.errorCode : undefined;
        subject.next({ type: 'error', error: message, code });
        subject.complete();
      }
    })();

    return subject.asObservable();
  }

  private getMockResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): string {
    const lastMessage = messages[messages.length - 1]?.content || '';
    return `[Mock Response] AI response for "${lastMessage}".\n\n` +
      'Currently running in mock mode because CLAUDE_API_KEY is not configured.\n' +
      'To receive real AI responses, register an Anthropic API key in Settings > API Key Management,\n' +
      'or set the Anthropic API key in `env/backend/.env.development`.';
  }

  private getMockStream(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Observable<ClaudeStreamEvent> {
    const subject = new Subject<ClaudeStreamEvent>();
    const mockText = this.getMockResponse(messages);
    const chunks = mockText.match(/[\s\S]{1,20}/g) || [mockText];

    let index = 0;
    const interval = setInterval(() => {
      if (index < chunks.length) {
        subject.next({ type: 'content', content: chunks[index] });
        index++;
      } else {
        clearInterval(interval);
        subject.next({ type: 'done', stopReason: 'end_turn' });
        subject.complete();
      }
    }, 50);

    return subject.asObservable();
  }
}
