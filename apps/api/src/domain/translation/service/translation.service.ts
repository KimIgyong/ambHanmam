import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, Subject } from 'rxjs';
import * as crypto from 'crypto';
import { ContentTranslationEntity } from '../entity/content-translation.entity';
import { TranslationHistoryEntity } from '../entity/translation-history.entity';
import { TranslationUsageEntity } from '../entity/translation-usage.entity';
import { TranslationGlossaryEntity } from '../entity/translation-glossary.entity';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { MeetingNoteEntity } from '../../meeting-notes/entity/meeting-note.entity';
import { NoticeEntity } from '../../notices/entity/notice.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { IssueCommentEntity } from '../../issues/entity/issue-comment.entity';
import { ProjectEntity } from '../../project/entity/project.entity';
import { PartnerEntity } from '../../billing/entity/partner.entity';
import { SvcClientEntity } from '../../service-management/entity/client.entity';
import { TodayReportEntity } from '../../today/entity/today-report.entity';
import { DailyMissionEntity } from '../../today/entity/daily-mission.entity';
import { ClaudeService, ClaudeUsage, AiUsageContext } from '../../../infrastructure/external/claude/claude.service';
import { TranslateRequest } from '../dto/request/translate.request';
import { SaveWithTranslationRequest } from '../dto/request/save-with-translation.request';
import { UpdateTranslationRequest } from '../dto/request/update-translation.request';
import { TranslationMapper } from '../mapper/translation.mapper';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { TranslationResponse, TranslationSummary } from '@amb/types';

interface SourceContent {
  fields: Record<string, string>;
  originalLang: string;
  entityId: string | null;
}

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);

  constructor(
    @InjectRepository(ContentTranslationEntity)
    private readonly translationRepo: Repository<ContentTranslationEntity>,
    @InjectRepository(TranslationHistoryEntity)
    private readonly historyRepo: Repository<TranslationHistoryEntity>,
    @InjectRepository(TranslationUsageEntity)
    private readonly usageRepo: Repository<TranslationUsageEntity>,
    @InjectRepository(TranslationGlossaryEntity)
    private readonly glossaryRepo: Repository<TranslationGlossaryEntity>,
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    @InjectRepository(MeetingNoteEntity)
    private readonly meetingNoteRepo: Repository<MeetingNoteEntity>,
    @InjectRepository(NoticeEntity)
    private readonly noticeRepo: Repository<NoticeEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    @InjectRepository(IssueCommentEntity)
    private readonly issueCommentRepo: Repository<IssueCommentEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepo: Repository<PartnerEntity>,
    @InjectRepository(SvcClientEntity)
    private readonly clientRepo: Repository<SvcClientEntity>,
    @InjectRepository(TodayReportEntity)
    private readonly reportRepo: Repository<TodayReportEntity>,
    @InjectRepository(DailyMissionEntity)
    private readonly missionRepo: Repository<DailyMissionEntity>,
    private readonly claudeService: ClaudeService,
  ) {}

  // ─── 조회 ───

  async getTranslations(sourceType: string, sourceId: string): Promise<TranslationSummary[]> {
    const entities = await this.translationRepo.find({
      where: { trnSourceType: sourceType, trnSourceId: sourceId, trnIsDeleted: false },
      relations: ['translatedByUser', 'lastEditedByUser'],
      order: { trnTargetLang: 'ASC', trnSourceField: 'ASC' },
    });

    // Group by target lang
    const langMap = new Map<string, TranslationSummary>();
    for (const e of entities) {
      const existing = langMap.get(e.trnTargetLang);
      if (!existing) {
        langMap.set(e.trnTargetLang, {
          lang: e.trnTargetLang as any,
          status: e.trnIsStale ? 'STALE' : 'FRESH',
          method: e.trnMethod as any,
          translatedAt: e.trnCreatedAt.toISOString(),
          lastEditedBy: e.trnLastEditedBy
            ? { id: e.trnLastEditedBy, name: e.lastEditedByUser?.usrName || '' }
            : null,
        });
      }
      const summary = langMap.get(e.trnTargetLang)!;
      if (e.trnSourceField === 'title') summary.title = e.trnContent;
      if (e.trnSourceField === 'content') summary.content = e.trnContent;
      if (e.trnIsStale) summary.status = 'STALE';
    }

    // Add NONE entries for missing langs
    const allLangs = ['en', 'ko', 'vi'];
    for (const lang of allLangs) {
      if (!langMap.has(lang)) {
        langMap.set(lang, { lang: lang as any, status: 'NONE' });
      }
    }

    return Array.from(langMap.values());
  }

  async getTranslation(sourceType: string, sourceId: string, targetLang: string): Promise<TranslationResponse[]> {
    const entities = await this.translationRepo.find({
      where: { trnSourceType: sourceType, trnSourceId: sourceId, trnTargetLang: targetLang, trnIsDeleted: false },
      relations: ['translatedByUser', 'lastEditedByUser'],
    });
    return entities.map(TranslationMapper.toResponse);
  }

  // ─── SSE 스트리밍 번역 ───

  translateStream(dto: TranslateRequest, userId: string, entityId?: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    (async () => {
      try {
        const source = await this.getSourceContent(dto.source_type, dto.source_id);
        if (!source) {
          subject.next({ data: JSON.stringify({ error: ERROR_CODE.TRANSLATION_SOURCE_NOT_FOUND.message, done: true }) } as MessageEvent);
          subject.complete();
          return;
        }

        const sourceLang = source.originalLang || 'ko';
        if (sourceLang === dto.target_lang) {
          subject.next({ data: JSON.stringify({ error: ERROR_CODE.TRANSLATION_SAME_LANG.message, done: true }) } as MessageEvent);
          subject.complete();
          return;
        }

        // Bridge translation: non-EN → non-EN requires EN intermediate
        const needsBridge = sourceLang !== 'en' && dto.target_lang !== 'en';
        let translationSourceLang = sourceLang;
        let contentToTranslate = source.fields;

        if (needsBridge) {
          // Check if EN translation exists
          const enTranslations = await this.translationRepo.find({
            where: { trnSourceType: dto.source_type, trnSourceId: dto.source_id, trnTargetLang: 'en', trnIsDeleted: false },
          });

          if (enTranslations.length > 0) {
            // Use existing EN translation
            contentToTranslate = {};
            for (const t of enTranslations) {
              contentToTranslate[t.trnSourceField] = t.trnContent;
            }
            translationSourceLang = 'en';
          } else {
            // First translate to EN (non-streaming), then to target
            subject.next({ data: JSON.stringify({ content: '[Bridge: translating to EN first...]\n', done: false }) } as MessageEvent);

            const enContent = await this.translateDirect(source.fields, sourceLang, 'en', source.entityId, userId);
            // Save EN translation
            for (const [field, translated] of Object.entries(enContent)) {
              await this.saveTranslationRecord(dto.source_type, dto.source_id, field, sourceLang, 'en', translated, source.fields[field], userId, source.entityId);
            }
            contentToTranslate = enContent;
            translationSourceLang = 'en';
          }
        }

        // Build prompt
        const glossaryText = await this.getGlossaryText(source.entityId);
        const systemPrompt = this.buildTranslationPrompt(translationSourceLang, dto.target_lang, glossaryText);

        const fieldsToTranslate = dto.source_fields.filter(f => contentToTranslate[f]);
        const userMessage = fieldsToTranslate.map(f => `[${f}]\n${contentToTranslate[f]}`).join('\n\n---\n\n');

        let fullContent = '';

        const usageContext: AiUsageContext | undefined = (entityId || source.entityId)
          ? { entId: entityId || source.entityId!, usrId: userId, sourceType: 'TRANSLATION' }
          : undefined;

        this.claudeService.streamMessage(systemPrompt, [{ role: 'user', content: userMessage }], usageContext)
          .subscribe({
            next: (event) => {
              if (event.type === 'content') {
                fullContent += event.content || '';
                subject.next({ data: JSON.stringify({ content: event.content, done: false }) } as MessageEvent);
              } else if (event.type === 'done') {
                // Record usage (TranslationUsageEntity for cost tracking)
                if (event.usage) {
                  this.recordUsage(userId, entityId || source.entityId, dto.source_type, translationSourceLang, dto.target_lang, event.usage).catch(e => this.logger.warn('Usage recording failed', e));
                }
                // Save translations
                this.saveStreamedTranslation(
                  dto.source_type, dto.source_id, fieldsToTranslate, sourceLang, dto.target_lang,
                  fullContent, contentToTranslate, userId, source.entityId,
                ).then(() => {
                  subject.next({ data: JSON.stringify({ content: '', done: true, fullContent }) } as MessageEvent);
                  subject.complete();
                }).catch((err) => {
                  subject.next({ data: JSON.stringify({ error: err.message, done: true, fullContent }) } as MessageEvent);
                  subject.complete();
                });
              } else if (event.type === 'error') {
                subject.next({ data: JSON.stringify({ error: event.error, done: true }) } as MessageEvent);
                subject.complete();
              }
            },
            error: (err) => {
              subject.next({ data: JSON.stringify({ error: err.message, done: true }) } as MessageEvent);
              subject.complete();
            },
          });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Translation error';
        subject.next({ data: JSON.stringify({ error: message, done: true }) } as MessageEvent);
        subject.complete();
      }
    })();

    return subject.asObservable();
  }

  // ─── Save-time 번역 저장 ───

  async saveTranslation(dto: SaveWithTranslationRequest, userId: string, entityId?: string): Promise<TranslationResponse[]> {
    const source = await this.getSourceContent(dto.source_type, dto.source_id);
    if (!source) {
      throw new BusinessException(ERROR_CODE.TRANSLATION_SOURCE_NOT_FOUND.code, ERROR_CODE.TRANSLATION_SOURCE_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    const results: TranslationResponse[] = [];
    for (const [field, translated] of Object.entries(dto.translated_content)) {
      const originalContent = source.fields[field] || '';
      const entity = await this.saveTranslationRecord(
        dto.source_type, dto.source_id, field, source.originalLang, dto.target_lang,
        translated, originalContent, userId, entityId || source.entityId, dto.method || 'AI',
      );
      results.push(TranslationMapper.toResponse(entity));
    }

    return results;
  }

  // ─── 번역 수정 ───

  async updateTranslation(trnId: string, dto: UpdateTranslationRequest, userId: string): Promise<TranslationResponse> {
    const entity = await this.translationRepo.findOne({
      where: { trnId, trnIsDeleted: false },
      relations: ['translatedByUser', 'lastEditedByUser'],
    });

    if (!entity) {
      throw new BusinessException(ERROR_CODE.TRANSLATION_NOT_FOUND.code, ERROR_CODE.TRANSLATION_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    if (entity.trnIsLocked) {
      throw new BusinessException(ERROR_CODE.TRANSLATION_LOCKED.code, ERROR_CODE.TRANSLATION_LOCKED.message, HttpStatus.CONFLICT);
    }

    // Save current version to history
    const history = this.historyRepo.create({
      trnId: entity.trnId,
      thiContent: entity.trnContent,
      thiMethod: entity.trnMethod,
      thiVersion: entity.trnVersion,
      thiEditedBy: entity.trnLastEditedBy || entity.trnTranslatedBy,
      thiChangeReason: dto.change_reason || null,
    });
    await this.historyRepo.save(history);

    // Update translation
    entity.trnContent = dto.content;
    entity.trnMethod = 'AI_EDITED';
    entity.trnVersion += 1;
    entity.trnLastEditedBy = userId;
    entity.trnLastEditedAt = new Date();
    entity.trnIsStale = false;

    const saved = await this.translationRepo.save(entity);
    const loaded = await this.translationRepo.findOne({
      where: { trnId: saved.trnId },
      relations: ['translatedByUser', 'lastEditedByUser'],
    });
    return TranslationMapper.toResponse(loaded!);
  }

  // ─── 재번역 ───

  reTranslateStream(trnId: string, userId: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    (async () => {
      try {
        const entity = await this.translationRepo.findOne({ where: { trnId, trnIsDeleted: false } });
        if (!entity) {
          subject.next({ data: JSON.stringify({ error: ERROR_CODE.TRANSLATION_NOT_FOUND.message, done: true }) } as MessageEvent);
          subject.complete();
          return;
        }

        // Save current to history
        const history = this.historyRepo.create({
          trnId: entity.trnId,
          thiContent: entity.trnContent,
          thiMethod: entity.trnMethod,
          thiVersion: entity.trnVersion,
          thiEditedBy: entity.trnLastEditedBy || entity.trnTranslatedBy,
        });
        await this.historyRepo.save(history);

        // Get source content
        const source = await this.getSourceContent(entity.trnSourceType, entity.trnSourceId);
        if (!source) {
          subject.next({ data: JSON.stringify({ error: ERROR_CODE.TRANSLATION_SOURCE_NOT_FOUND.message, done: true }) } as MessageEvent);
          subject.complete();
          return;
        }

        const glossaryText = await this.getGlossaryText(entity.entId);
        const systemPrompt = this.buildTranslationPrompt(entity.trnSourceLang, entity.trnTargetLang, glossaryText);
        const content = source.fields[entity.trnSourceField] || '';

        let fullContent = '';

        const reUsageContext: AiUsageContext | undefined = entity.entId
          ? { entId: entity.entId, usrId: userId, sourceType: 'TRANSLATION' }
          : undefined;

        this.claudeService.streamMessage(systemPrompt, [{ role: 'user', content: `[${entity.trnSourceField}]\n${content}` }], reUsageContext)
          .subscribe({
            next: (event) => {
              if (event.type === 'content') {
                fullContent += event.content || '';
                subject.next({ data: JSON.stringify({ content: event.content, done: false }) } as MessageEvent);
              } else if (event.type === 'done') {
                // Record usage (TranslationUsageEntity for cost tracking)
                if (event.usage) {
                  this.recordUsage(userId, entity.entId, entity.trnSourceType, entity.trnSourceLang, entity.trnTargetLang, event.usage).catch(e => this.logger.warn('Usage recording failed', e));
                }

                entity.trnContent = fullContent;
                entity.trnMethod = 'AI';
                entity.trnVersion += 1;
                entity.trnIsStale = false;
                entity.trnSourceHash = this.computeHash(content);
                entity.trnTranslatedBy = userId;
                entity.trnLastEditedBy = null;
                entity.trnLastEditedAt = null;

                this.translationRepo.save(entity).then(() => {
                  subject.next({ data: JSON.stringify({ content: '', done: true, fullContent }) } as MessageEvent);
                  subject.complete();
                });
              } else if (event.type === 'error') {
                subject.next({ data: JSON.stringify({ error: event.error, done: true }) } as MessageEvent);
                subject.complete();
              }
            },
            error: (err) => {
              subject.next({ data: JSON.stringify({ error: err.message, done: true }) } as MessageEvent);
              subject.complete();
            },
          });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Re-translation error';
        subject.next({ data: JSON.stringify({ error: message, done: true }) } as MessageEvent);
        subject.complete();
      }
    })();

    return subject.asObservable();
  }

  // ─── 이력 조회 ───

  async getHistory(trnId: string) {
    const entries = await this.historyRepo.find({
      where: { trnId },
      relations: ['editedByUser'],
      order: { thiVersion: 'DESC' },
    });
    return entries.map(TranslationMapper.toHistoryResponse);
  }

  // ─── Lock / Unlock ───

  async lockTranslation(trnId: string, userId: string): Promise<TranslationResponse> {
    const entity = await this.translationRepo.findOne({
      where: { trnId, trnIsDeleted: false },
      relations: ['translatedByUser', 'lastEditedByUser', 'lockedByUser'],
    });
    if (!entity) {
      throw new BusinessException(ERROR_CODE.TRANSLATION_NOT_FOUND.code, ERROR_CODE.TRANSLATION_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }
    entity.trnIsLocked = true;
    entity.trnLockedBy = userId;
    entity.trnLockedAt = new Date();
    const saved = await this.translationRepo.save(entity);
    const loaded = await this.translationRepo.findOne({ where: { trnId: saved.trnId }, relations: ['translatedByUser', 'lastEditedByUser', 'lockedByUser'] });
    return TranslationMapper.toResponse(loaded!);
  }

  async unlockTranslation(trnId: string): Promise<TranslationResponse> {
    const entity = await this.translationRepo.findOne({
      where: { trnId, trnIsDeleted: false },
      relations: ['translatedByUser', 'lastEditedByUser', 'lockedByUser'],
    });
    if (!entity) {
      throw new BusinessException(ERROR_CODE.TRANSLATION_NOT_FOUND.code, ERROR_CODE.TRANSLATION_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }
    entity.trnIsLocked = false;
    entity.trnLockedBy = null;
    entity.trnLockedAt = null;
    const saved = await this.translationRepo.save(entity);
    const loaded = await this.translationRepo.findOne({ where: { trnId: saved.trnId }, relations: ['translatedByUser', 'lastEditedByUser', 'lockedByUser'] });
    return TranslationMapper.toResponse(loaded!);
  }

  // ─── Staleness ───

  async markStale(sourceType: string, sourceId: string): Promise<void> {
    await this.translationRepo.update(
      { trnSourceType: sourceType, trnSourceId: sourceId, trnIsDeleted: false },
      { trnIsStale: true },
    );
    this.logger.log(`Marked translations stale: ${sourceType}/${sourceId}`);
  }

  // ─── 원본 언어 변경 ───

  async updateOriginalLang(sourceType: string, sourceId: string, newLang: string): Promise<void> {
    const validLangs = ['en', 'ko', 'vi'];
    if (!validLangs.includes(newLang)) {
      throw new BusinessException('E9001', `Invalid language: ${newLang}`, HttpStatus.BAD_REQUEST);
    }

    switch (sourceType) {
      case 'TODO':
        await this.todoRepo.update({ tdoId: sourceId }, { tdoOriginalLang: newLang });
        break;
      case 'MEETING_NOTE':
        await this.meetingNoteRepo.update({ mtnId: sourceId }, { mtnOriginalLang: newLang } as any);
        break;
      case 'NOTICE':
        await this.noticeRepo.update({ ntcId: sourceId }, { ntcOriginalLang: newLang });
        break;
      case 'ISSUE':
        await this.issueRepo.update({ issId: sourceId }, { issOriginalLang: newLang });
        break;
      case 'PROJECT':
        await this.projectRepo.update({ pjtId: sourceId }, { pjtOriginalLang: newLang });
        break;
      case 'PARTNER':
        await this.partnerRepo.update({ ptnId: sourceId }, { ptnOriginalLang: newLang } as any);
        break;
      case 'CLIENT':
        await this.clientRepo.update({ cliId: sourceId }, { cliOriginalLang: newLang } as any);
        break;
      default:
        throw new BusinessException('E9002', `Unknown source type: ${sourceType}`, HttpStatus.BAD_REQUEST);
    }

    // 원본 언어가 변경되면 기존 번역은 stale 처리
    await this.markStale(sourceType, sourceId);
    this.logger.log(`Updated originalLang for ${sourceType}/${sourceId} to ${newLang}`);
  }

  // ─── Helpers ───

  private async getSourceContent(sourceType: string, sourceId: string): Promise<SourceContent | null> {
    switch (sourceType) {
      case 'TODO': {
        const todo = await this.todoRepo.findOne({ where: { tdoId: sourceId } });
        if (!todo) return null;
        return {
          fields: { title: todo.tdoTitle, content: todo.tdoDescription || '' },
          originalLang: todo.tdoOriginalLang || 'ko',
          entityId: todo.entId,
        };
      }
      case 'MEETING_NOTE': {
        const note = await this.meetingNoteRepo.findOne({ where: { mtnId: sourceId } });
        if (!note) return null;
        return {
          fields: { title: note.mtnTitle, content: note.mtnContent },
          originalLang: note.mtnOriginalLang || 'ko',
          entityId: note.entId,
        };
      }
      case 'NOTICE': {
        const notice = await this.noticeRepo.findOne({ where: { ntcId: sourceId } });
        if (!notice) return null;
        return {
          fields: { title: notice.ntcTitle, content: notice.ntcContent },
          originalLang: notice.ntcOriginalLang || 'ko',
          entityId: notice.entId,
        };
      }
      case 'ISSUE': {
        const issue = await this.issueRepo.findOne({ where: { issId: sourceId } });
        if (!issue) return null;
        return {
          fields: {
            title: issue.issTitle,
            content: issue.issDescription || '',
            ...(issue.issAiAnalysis ? { aiAnalysis: issue.issAiAnalysis } : {}),
          },
          originalLang: issue.issOriginalLang || 'ko',
          entityId: issue.entId,
        };
      }
      case 'ISSUE_COMMENT': {
        const comment = await this.issueCommentRepo.findOne({ where: { iscId: sourceId }, relations: ['issue'] });
        if (!comment) return null;
        return {
          fields: { content: comment.iscContent },
          originalLang: comment.issue?.issOriginalLang || 'ko',
          entityId: comment.issue?.entId || null,
        };
      }
      case 'PROJECT': {
        const project = await this.projectRepo.findOne({ where: { pjtId: sourceId } });
        if (!project) return null;
        return {
          fields: { title: project.pjtTitle || project.pjtName, content: project.pjtSummary || '' },
          originalLang: project.pjtOriginalLang || 'ko',
          entityId: project.entId,
        };
      }
      case 'PARTNER': {
        const partner = await this.partnerRepo.findOne({ where: { ptnId: sourceId } });
        if (!partner) return null;
        return {
          fields: { title: partner.ptnCompanyName, content: partner.ptnNote || '' },
          originalLang: partner.ptnOriginalLang || 'ko',
          entityId: partner.entId,
        };
      }
      case 'CLIENT': {
        const client = await this.clientRepo.findOne({ where: { cliId: sourceId } });
        if (!client) return null;
        return {
          fields: { title: client.cliCompanyName, content: client.cliNote || '' },
          originalLang: client.cliOriginalLang || 'ko',
          entityId: null,
        };
      }
      case 'REPORT': {
        const report = await this.reportRepo.findOne({ where: { tdrId: sourceId } });
        if (!report) return null;
        return {
          fields: { content: report.tdrContent },
          originalLang: 'en',
          entityId: report.entId,
        };
      }
      case 'MISSION': {
        const mission = await this.missionRepo.findOne({ where: { msnId: sourceId } });
        if (!mission) return null;
        return {
          fields: { content: mission.msnContent || '' },
          originalLang: 'ko',
          entityId: mission.entId,
        };
      }
      default:
        return null;
    }
  }

  private buildTranslationPrompt(sourceLang: string, targetLang: string, glossaryText: string): string {
    const langNames: Record<string, string> = { en: 'English', ko: 'Korean', vi: 'Vietnamese' };
    const fromLang = langNames[sourceLang] || sourceLang;
    const toLang = langNames[targetLang] || targetLang;

    return `You are a professional translator specializing in business documents.
Translate the following content from ${fromLang} to ${toLang}.

## Rules
- Preserve the original formatting (markdown, HTML tags, line breaks)
- Keep proper nouns, brand names, and technical terms as-is unless there's an established translation
- Maintain the original tone and formality level
- For content with [field] markers, translate the content after each marker separately
- Output ONLY the translated text, no explanations or notes

${glossaryText ? `## Domain Glossary\n${glossaryText}\n` : ''}`;
  }

  private async getGlossaryText(entityId: string | null): Promise<string> {
    const terms = await this.glossaryRepo.find({
      where: { entId: entityId as any, glsIsDeleted: false },
    });
    if (terms.length === 0) return '';

    return terms.map(t => {
      const parts = [`EN: ${t.glsTermEn}`];
      if (t.glsTermKo) parts.push(`KO: ${t.glsTermKo}`);
      if (t.glsTermVi) parts.push(`VI: ${t.glsTermVi}`);
      return `- ${parts.join(' | ')}`;
    }).join('\n');
  }

  private computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async saveTranslationRecord(
    sourceType: string, sourceId: string, field: string,
    sourceLang: string, targetLang: string, translated: string,
    originalContent: string, userId: string, entityId: string | null,
    method = 'AI',
  ): Promise<ContentTranslationEntity> {
    // Check existing
    let entity = await this.translationRepo.findOne({
      where: { trnSourceType: sourceType, trnSourceId: sourceId, trnSourceField: field, trnTargetLang: targetLang, trnIsDeleted: false },
      relations: ['translatedByUser', 'lastEditedByUser'],
    });

    if (entity) {
      // Update existing
      entity.trnContent = translated;
      entity.trnSourceHash = this.computeHash(originalContent);
      entity.trnMethod = method;
      entity.trnIsStale = false;
      entity.trnVersion += 1;
      entity.trnLastEditedBy = userId;
      entity.trnLastEditedAt = new Date();
    } else {
      // Create new
      entity = this.translationRepo.create({
        entId: entityId,
        trnSourceType: sourceType,
        trnSourceId: sourceId,
        trnSourceField: field,
        trnSourceLang: sourceLang,
        trnTargetLang: targetLang,
        trnContent: translated,
        trnSourceHash: this.computeHash(originalContent),
        trnMethod: method,
        trnIsStale: false,
        trnIsLocked: false,
        trnTranslatedBy: userId,
        trnVersion: 1,
        trnIsDeleted: false,
      });
    }

    return this.translationRepo.save(entity);
  }

  private async saveStreamedTranslation(
    sourceType: string, sourceId: string, fields: string[],
    sourceLang: string, targetLang: string, fullContent: string,
    originalContents: Record<string, string>, userId: string, entityId: string | null,
  ): Promise<void> {
    if (fields.length === 1) {
      // Single field - save directly
      await this.saveTranslationRecord(
        sourceType, sourceId, fields[0], sourceLang, targetLang,
        fullContent.trim(), originalContents[fields[0]] || '', userId, entityId,
      );
    } else {
      // Multiple fields - parse by [field] markers
      const parsed = this.parseFieldsFromContent(fullContent, fields);
      for (const [field, content] of Object.entries(parsed)) {
        if (content) {
          await this.saveTranslationRecord(
            sourceType, sourceId, field, sourceLang, targetLang,
            content.trim(), originalContents[field] || '', userId, entityId,
          );
        }
      }
    }
  }

  private parseFieldsFromContent(content: string, fields: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    const parts = content.split(/\[(\w+)\]\n?/);

    let currentField = '';
    for (const part of parts) {
      if (fields.includes(part)) {
        currentField = part;
      } else if (currentField) {
        result[currentField] = (result[currentField] || '') + part;
      }
    }

    // Fallback: if no markers found, assign all to first field
    if (Object.keys(result).length === 0 && fields.length > 0) {
      result[fields[0]] = content;
    }

    return result;
  }

  /** 즉석 텍스트 번역 (SSE 스트리밍, DB 저장 없음) */
  translateTextStream(
    text: string, sourceLang: string, targetLang: string,
    entityId: string | undefined, userId: string,
  ): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    (async () => {
      try {
        const glossaryText = await this.getGlossaryText(entityId || null);
        const systemPrompt = this.buildTranslationPrompt(sourceLang, targetLang, glossaryText);

        const usageContext: AiUsageContext | undefined = entityId
          ? { entId: entityId, usrId: userId, sourceType: 'TRANSLATION' }
          : undefined;

        this.claudeService.streamMessage(systemPrompt, [{ role: 'user', content: text }], usageContext)
          .subscribe({
            next: (event) => {
              if (event.type === 'content') {
                subject.next({ data: JSON.stringify({ content: event.content, done: false }) } as MessageEvent);
              } else if (event.type === 'done') {
                if (event.usage) {
                  this.recordUsage(userId, entityId || null, 'TEXT_TRANSLATE', sourceLang, targetLang, event.usage).catch(() => {});
                }
                subject.next({ data: JSON.stringify({ content: '', done: true }) } as MessageEvent);
                subject.complete();
              } else if (event.type === 'error') {
                subject.next({ data: JSON.stringify({ error: event.error, done: true }) } as MessageEvent);
                subject.complete();
              }
            },
            error: (err) => {
              subject.next({ data: JSON.stringify({ error: err.message, done: true }) } as MessageEvent);
              subject.complete();
            },
          });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Translation error';
        subject.next({ data: JSON.stringify({ error: message, done: true }) } as MessageEvent);
        subject.complete();
      }
    })();

    return subject.asObservable();
  }

  private async translateDirect(
    fields: Record<string, string>, sourceLang: string, targetLang: string, entityId: string | null,
    userId?: string,
  ): Promise<Record<string, string>> {
    const glossaryText = await this.getGlossaryText(entityId);
    const systemPrompt = this.buildTranslationPrompt(sourceLang, targetLang, glossaryText);

    const fieldEntries = Object.entries(fields).filter(([, v]) => v);
    const userMessage = fieldEntries.map(([k, v]) => `[${k}]\n${v}`).join('\n\n---\n\n');

    const directUsageContext: AiUsageContext | undefined = entityId && userId
      ? { entId: entityId, usrId: userId, sourceType: 'TRANSLATION' }
      : undefined;

    const result = await this.claudeService.sendMessage(systemPrompt, [{ role: 'user', content: userMessage }], { withUsage: true, usageContext: directUsageContext });

    // Record usage for bridge translations (TranslationUsageEntity for cost tracking)
    if (userId && result.usage) {
      this.recordUsage(userId, entityId, 'BRIDGE', sourceLang, targetLang, result.usage).catch(e => this.logger.warn('Bridge usage recording failed', e));
    }

    if (fieldEntries.length === 1) {
      return { [fieldEntries[0][0]]: result.text.trim() };
    }

    return this.parseFieldsFromContent(result.text, fieldEntries.map(([k]) => k));
  }

  // ─── Usage Recording ───

  private async recordUsage(
    userId: string, entityId: string | null, sourceType: string,
    sourceLang: string, targetLang: string, usage: ClaudeUsage,
  ): Promise<void> {
    // Approximate cost (Claude Opus 4 pricing: $15/M input, $75/M output)
    const costUsd = (usage.inputTokens * 15 + usage.outputTokens * 75) / 1_000_000;

    const record = this.usageRepo.create({
      entId: entityId,
      usrId: userId,
      tusSourceType: sourceType,
      tusSourceLang: sourceLang,
      tusTargetLang: targetLang,
      tusInputTokens: usage.inputTokens,
      tusOutputTokens: usage.outputTokens,
      tusCostUsd: costUsd,
    });

    await this.usageRepo.save(record);
    this.logger.debug(`Usage recorded: ${usage.inputTokens}in/${usage.outputTokens}out = $${costUsd.toFixed(6)}`);
  }
}
