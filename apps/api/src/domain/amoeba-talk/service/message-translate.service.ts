import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TalkMessageEntity } from '../entity/talk-message.entity';
import { TalkChannelMemberEntity } from '../entity/talk-channel-member.entity';
import { TalkChannelEntity } from '../entity/talk-channel.entity';
import { ContentTranslationEntity } from '../../translation/entity/content-translation.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { ClaudeService, AiUsageContext } from '../../../infrastructure/external/claude/claude.service';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { MODULE_DATA_EVENTS, ModuleDataEvent } from '../../kms/event/module-data.event';
import { MessageMapper } from '../mapper/message.mapper';
import { TalkMessageResponse } from '@amb/types';

export interface TranslateResult {
  id?: string;
  translatedContent: string;
  detectedLanguage: string;
}

const LANG_NAME_TO_ISO: Record<string, string> = {
  english: 'en',
  korean: 'ko',
  vietnamese: 'vi',
  japanese: 'ja',
  chinese: 'zh',
};

function toLangCode(lang: string): string {
  const lower = lang.toLowerCase();
  return LANG_NAME_TO_ISO[lower] || lower.slice(0, 5);
}

@Injectable()
export class MessageTranslateService {
  private readonly logger = new Logger(MessageTranslateService.name);

  constructor(
    @InjectRepository(TalkMessageEntity)
    private readonly messageRepo: Repository<TalkMessageEntity>,
    @InjectRepository(TalkChannelMemberEntity)
    private readonly memberRepo: Repository<TalkChannelMemberEntity>,
    @InjectRepository(TalkChannelEntity)
    private readonly channelRepo: Repository<TalkChannelEntity>,
    @InjectRepository(ContentTranslationEntity)
    private readonly translationRepo: Repository<ContentTranslationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly claudeService: ClaudeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async translateMessage(
    channelId: string,
    messageId: string,
    targetLang: string,
    userId: string,
  ): Promise<TranslateResult> {
    const membership = await this.memberRepo.findOne({
      where: { chnId: channelId, usrId: userId, chmLeftAt: IsNull() },
    });
    if (!membership) {
      throw new ForbiddenException(ERROR_CODE.CHANNEL_ACCESS_DENIED.message);
    }

    const message = await this.messageRepo.findOne({
      where: { msgId: messageId, chnId: channelId, msgDeletedAt: IsNull() },
    });
    if (!message) {
      throw new NotFoundException(ERROR_CODE.TALK_MESSAGE_NOT_FOUND.message);
    }

    const targetCode = toLangCode(targetLang);

    // Check DB cache
    const cached = await this.translationRepo.findOne({
      where: {
        trnSourceType: 'TALK_MESSAGE',
        trnSourceId: messageId,
        trnSourceField: 'content',
        trnTargetLang: targetCode,
        trnIsDeleted: false,
      },
    });
    if (cached && !cached.trnIsStale) {
      return {
        id: cached.trnId,
        translatedContent: cached.trnContent,
        detectedLanguage: cached.trnSourceLang,
      };
    }

    // Build usageContext from channel
    const channel = await this.channelRepo.findOne({ where: { chnId: channelId } });
    const usageContext: AiUsageContext | undefined = channel?.entId
      ? { entId: channel.entId, usrId: userId, sourceType: 'TALK_TRANSLATION' }
      : undefined;

    const systemPrompt = `You are a translation assistant. Translate the given chat message to ${targetLang}.
Rules:
- Detect the source language automatically
- Preserve emojis, URLs, mentions (@user), and markdown formatting
- If the message is already in the target language, return it as-is
- Return ONLY a JSON object: {"translatedContent": "...", "detectedLanguage": "..."}
- detectedLanguage should be one of: English, Korean, Vietnamese, Japanese, Chinese, or the detected language name
- Do NOT wrap in markdown code blocks`;

    try {
      const raw = await this.claudeService.sendMessage(
        systemPrompt,
        [{ role: 'user', content: message.msgContent }],
        { maxTokens: 1024, usageContext },
      );

      // Strip markdown code blocks if Claude wraps the response
      const jsonStr = (raw as string).replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      const parsed = JSON.parse(jsonStr);
      const detectedCode = toLangCode(parsed.detectedLanguage);

      // Upsert to DB
      const saved = await this.translationRepo.save(
        this.translationRepo.create({
          ...(cached ? { trnId: cached.trnId } : {}),
          trnSourceType: 'TALK_MESSAGE',
          trnSourceId: messageId,
          trnSourceField: 'content',
          trnSourceLang: detectedCode,
          trnTargetLang: targetCode,
          trnContent: parsed.translatedContent,
          trnMethod: 'AI',
          trnTranslatedBy: userId,
          trnIsStale: false,
          trnIsDeleted: false,
        }),
      );

      return {
        id: saved.trnId,
        translatedContent: parsed.translatedContent,
        detectedLanguage: parsed.detectedLanguage,
      };
    } catch (error) {
      this.logger.error(`Translation failed for message ${messageId}:`, error);
      throw new Error(ERROR_CODE.TALK_TRANSLATION_FAILED.message);
    }
  }

  async getTranslations(
    channelId: string,
    messageId: string,
    userId: string,
  ): Promise<{ translations: Array<{ id: string; targetLang: string; content: string; sourceLang: string }> }> {
    const membership = await this.memberRepo.findOne({
      where: { chnId: channelId, usrId: userId, chmLeftAt: IsNull() },
    });
    if (!membership) {
      throw new ForbiddenException(ERROR_CODE.CHANNEL_ACCESS_DENIED.message);
    }

    const rows = await this.translationRepo.find({
      where: {
        trnSourceType: 'TALK_MESSAGE',
        trnSourceId: messageId,
        trnSourceField: 'content',
        trnIsDeleted: false,
      },
      order: { trnCreatedAt: 'DESC' },
    });

    return {
      translations: rows.map((r) => ({
        id: r.trnId,
        targetLang: r.trnTargetLang,
        content: r.trnContent,
        sourceLang: r.trnSourceLang,
      })),
    };
  }

  /**
   * Translate raw text inline (for simultaneous translation on send).
   * Does NOT require a message ID — used before message is saved.
   */
  async translateInline(
    text: string,
    targetLang: string,
    userId: string,
    entId?: string,
  ): Promise<TranslateResult> {
    const targetCode = toLangCode(targetLang);

    const usageContext: AiUsageContext | undefined = entId
      ? { entId, usrId: userId, sourceType: 'TALK_TRANSLATION' }
      : undefined;

    const systemPrompt = `You are a translation assistant. Translate the given chat message to ${targetLang}.
Rules:
- Detect the source language automatically
- Preserve emojis, URLs, mentions (@user), and markdown formatting
- If the message is already in the target language, return it as-is
- Return ONLY a JSON object: {"translatedContent": "...", "detectedLanguage": "..."}
- detectedLanguage should be one of: English, Korean, Vietnamese, Japanese, Chinese, or the detected language name
- Do NOT wrap in markdown code blocks`;

    try {
      const raw = await this.claudeService.sendMessage(
        systemPrompt,
        [{ role: 'user', content: text }],
        { maxTokens: 1024, usageContext },
      );

      const jsonStr = (raw as string).replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      const parsed = JSON.parse(jsonStr);
      return {
        translatedContent: parsed.translatedContent,
        detectedLanguage: parsed.detectedLanguage,
      };
    } catch (error) {
      this.logger.error(`Inline translation failed:`, error);
      throw new Error(ERROR_CODE.TALK_TRANSLATION_FAILED.message);
    }
  }

  /**
   * Translate an existing message and post the translation as a new TRANSLATION-type message.
   * Returns the newly created TRANSLATION message.
   */
  async translateAndPost(
    channelId: string,
    messageId: string,
    targetLang: string,
    userId: string,
  ): Promise<TalkMessageResponse> {
    // 1. Translate (reuses existing translateMessage with caching)
    const result = await this.translateMessage(channelId, messageId, targetLang, userId);

    // 2. Get original message owner info
    const originalMsg = await this.messageRepo.findOne({
      where: { msgId: messageId, chnId: channelId, msgDeletedAt: IsNull() },
    });
    if (!originalMsg) {
      throw new NotFoundException(ERROR_CODE.TALK_MESSAGE_NOT_FOUND.message);
    }

    const ownerName = await this.getUserName(originalMsg.usrId);
    const translatorName = await this.getUserName(userId);
    const targetCode = toLangCode(targetLang);
    const detectedCode = toLangCode(result.detectedLanguage);

    // 3. Create TRANSLATION message in the channel
    const translationContent = `🌐 ${ownerName} → ${translatorName} (${detectedCode} → ${targetCode})\n─────\n${result.translatedContent}`;

    const translationMsg = this.messageRepo.create({
      chnId: channelId,
      usrId: userId,
      msgContent: translationContent,
      msgType: 'TRANSLATION',
      msgParentId: messageId,
    });
    const saved = await this.messageRepo.save(translationMsg);

    const response = MessageMapper.toMessageResponse(saved, translatorName);

    // 4. Emit KMS event
    this.channelRepo.findOne({ where: { chnId: channelId } }).then((channel) => {
      this.eventEmitter.emit(MODULE_DATA_EVENTS.UPDATED, {
        module: 'talk',
        type: 'NOTE',
        refId: channelId,
        title: `[Talk] ${channel?.chnName || 'Channel'} - Translation`,
        content: translationContent,
        ownerId: userId,
        visibility: channel?.chnType === 'PUBLIC' ? 'ENTITY' : 'CELL',
      } as ModuleDataEvent);
    }).catch((err) => {
      this.logger.warn(`KMS event emit failed: ${err.message}`);
    });

    return response;
  }

  private async getUserName(userId: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { usrId: userId } });
    return user?.usrName || 'Unknown';
  }
}
