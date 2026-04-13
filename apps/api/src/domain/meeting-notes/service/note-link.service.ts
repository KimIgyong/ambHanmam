import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { NoteLinkEntity } from '../entity/note-link.entity';
import { MeetingNoteEntity } from '../entity/meeting-note.entity';

export interface BacklinkItem {
  noteId: string;
  title: string;
  linkText: string;
  context: string | null;
  createdAt: Date;
}

export interface AutocompleteItem {
  id: string;
  type: string;
  title: string;
}

@Injectable()
export class NoteLinkService {
  constructor(
    @InjectRepository(NoteLinkEntity)
    private readonly linkRepo: Repository<NoteLinkEntity>,
    @InjectRepository(MeetingNoteEntity)
    private readonly noteRepo: Repository<MeetingNoteEntity>,
  ) {}

  /**
   * HTML 콘텐츠에서 WikiLink 노드를 파싱하고 amb_note_links 테이블에 동기화
   */
  async parseAndSaveLinks(noteId: string, htmlContent: string, entityId: string): Promise<void> {
    const parsed = this.extractWikiLinks(htmlContent);

    // 기존 링크 조회
    const existing = await this.linkRepo.find({
      where: { nlkSourceNoteId: noteId },
    });

    const existingKeys = new Set(existing.map((l) => `${l.nlkLinkText}::${l.nlkTargetType}`));
    const newKeys = new Set(parsed.map((p) => `${p.linkText}::${p.targetType}`));

    // 삭제: 더 이상 존재하지 않는 링크
    const toDelete = existing.filter((l) => !newKeys.has(`${l.nlkLinkText}::${l.nlkTargetType}`));
    if (toDelete.length > 0) {
      await this.linkRepo.delete(toDelete.map((l) => l.nlkId));
    }

    // 추가: 신규 링크
    const toInsert = parsed.filter((p) => !existingKeys.has(`${p.linkText}::${p.targetType}`));
    if (toInsert.length > 0) {
      const entities = await Promise.all(
        toInsert.map(async (link) => {
          const resolved = await this.resolveTarget(link.linkText, link.targetType, link.targetId, entityId);
          return this.linkRepo.create({
            entId: entityId,
            nlkSourceNoteId: noteId,
            nlkTargetNoteId: resolved.targetNoteId,
            nlkLinkText: link.linkText,
            nlkTargetType: link.targetType,
            nlkTargetRefId: resolved.targetRefId,
            nlkContext: link.context,
          });
        }),
      );
      await this.linkRepo.save(entities);
    }
  }

  /**
   * 해당 노트를 참조(backlink)하는 노트 목록 조회
   */
  async getBacklinks(noteId: string, entityId: string): Promise<BacklinkItem[]> {
    const links = await this.linkRepo
      .createQueryBuilder('link')
      .innerJoinAndSelect('link.sourceNote', 'source')
      .where('link.nlkTargetNoteId = :noteId', { noteId })
      .andWhere('link.entId = :entityId', { entityId })
      .andWhere('source.mtnDeletedAt IS NULL')
      .orderBy('link.nlkCreatedAt', 'DESC')
      .getMany();

    return links.map((l) => ({
      noteId: l.nlkSourceNoteId,
      title: l.sourceNote.mtnTitle,
      linkText: l.nlkLinkText,
      context: l.nlkContext,
      createdAt: l.nlkCreatedAt,
    }));
  }

  /**
   * 노트에서 나가는 링크(outgoing) 목록 조회
   */
  async getOutgoingLinks(noteId: string): Promise<NoteLinkEntity[]> {
    return this.linkRepo.find({
      where: { nlkSourceNoteId: noteId },
      relations: ['targetNote'],
    });
  }

  /**
   * WikiLink 자동완성
   */
  async searchForAutocomplete(
    query: string,
    entityId: string,
    userId: string,
    type?: string,
  ): Promise<AutocompleteItem[]> {
    const items: AutocompleteItem[] = [];

    if (!type || type === 'NOTE') {
      const notes = await this.noteRepo
        .createQueryBuilder('n')
        .select(['n.mtnId', 'n.mtnTitle'])
        .where('n.mtnDeletedAt IS NULL')
        .andWhere('n.entId = :entityId', { entityId })
        .andWhere('n.mtnTitle ILIKE :q', { q: `%${query}%` })
        .orderBy('n.mtnUpdatedAt', 'DESC')
        .limit(10)
        .getMany();

      items.push(
        ...notes.map((n) => ({
          id: n.mtnId,
          type: 'NOTE',
          title: n.mtnTitle,
        })),
      );
    }

    return items;
  }

  /**
   * 그래프 뷰용 노드/엣지 데이터
   */
  async getGraphData(
    entityId: string,
    userId: string,
    scope: 'MY' | 'ENTITY' = 'MY',
    centerId?: string,
  ) {
    const qb = this.linkRepo
      .createQueryBuilder('link')
      .innerJoinAndSelect('link.sourceNote', 'source')
      .leftJoinAndSelect('link.targetNote', 'target')
      .where('link.entId = :entityId', { entityId })
      .andWhere('source.mtnDeletedAt IS NULL');

    if (scope === 'MY') {
      qb.andWhere('source.usrId = :userId', { userId });
    }

    if (centerId) {
      qb.andWhere('(link.nlkSourceNoteId = :centerId OR link.nlkTargetNoteId = :centerId)', { centerId });
    }

    qb.limit(500);

    const links = await qb.getMany();

    const nodeMap = new Map<string, { id: string; type: string; label: string }>();
    const edges: { source: string; target: string; type: string }[] = [];

    for (const link of links) {
      // Source node
      if (!nodeMap.has(link.nlkSourceNoteId)) {
        nodeMap.set(link.nlkSourceNoteId, {
          id: link.nlkSourceNoteId,
          type: 'NOTE',
          label: link.sourceNote.mtnTitle,
        });
      }

      // Target node
      const targetId = link.nlkTargetNoteId || link.nlkTargetRefId;
      if (targetId && !nodeMap.has(targetId)) {
        nodeMap.set(targetId, {
          id: targetId,
          type: link.nlkTargetType,
          label: link.targetNote?.mtnTitle || link.nlkLinkText,
        });
      }

      if (targetId) {
        edges.push({
          source: link.nlkSourceNoteId,
          target: targetId,
          type: link.nlkTargetType,
        });
      }
    }

    const nodes = Array.from(nodeMap.values());
    return { nodes, edges };
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  /**
   * HTML에서 wiki-link span을 추출.
   * 형식: <span class="wiki-link" data-type="NOTE" data-id="uuid" data-text="제목">제목</span>
   */
  private extractWikiLinks(html: string): Array<{
    linkText: string;
    targetType: string;
    targetId: string | null;
    context: string | null;
  }> {
    const results: Array<{
      linkText: string;
      targetType: string;
      targetId: string | null;
      context: string | null;
    }> = [];

    // Match wiki-link spans from HTML content
    const regex = /<span[^>]*class="wiki-link"[^>]*data-type="([^"]*)"[^>]*data-id="([^"]*)"[^>]*data-text="([^"]*)"[^>]*>[^<]*<\/span>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      results.push({
        targetType: match[1] || 'NOTE',
        targetId: match[2] || null,
        linkText: match[3] || '',
        context: null,
      });
    }

    // Also match simpler pattern: data attributes in any order
    const regex2 = /<span[^>]*class="wiki-link"[^>]*>([^<]*)<\/span>/gi;
    const seen = new Set(results.map((r) => r.linkText));
    while ((match = regex2.exec(html)) !== null) {
      const text = match[1]?.trim();
      if (text && !seen.has(text)) {
        // Extract data attributes
        const typeMatch = match[0].match(/data-type="([^"]*)"/);
        const idMatch = match[0].match(/data-id="([^"]*)"/);
        results.push({
          targetType: typeMatch?.[1] || 'NOTE',
          targetId: idMatch?.[1] || null,
          linkText: text,
          context: null,
        });
        seen.add(text);
      }
    }

    return results;
  }

  private async resolveTarget(
    linkText: string,
    targetType: string,
    targetId: string | null,
    entityId: string,
  ): Promise<{ targetNoteId: string | null; targetRefId: string | null }> {
    if (targetType === 'NOTE') {
      if (targetId) {
        return { targetNoteId: targetId, targetRefId: null };
      }
      // 이름으로 노트 검색
      const note = await this.noteRepo.findOne({
        where: { mtnTitle: linkText, entId: entityId, mtnDeletedAt: undefined },
        select: ['mtnId'],
      });
      return { targetNoteId: note?.mtnId || null, targetRefId: null };
    }

    // NOTE 외 타입: targetRefId 사용
    return { targetNoteId: null, targetRefId: targetId || null };
  }
}
