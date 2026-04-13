import { Injectable, Logger } from '@nestjs/common';
import { MeetingNoteService } from '../../meeting-notes/service/meeting-note.service';
import { CreateMeetingNoteRequest } from '../../meeting-notes/dto/request/create-meeting-note.request';

@Injectable()
export class DailyNoteService {
  private readonly logger = new Logger(DailyNoteService.name);

  constructor(
    private readonly meetingNoteService: MeetingNoteService,
  ) {}

  /**
   * 오늘의 데일리 노트를 조회하거나 생성
   */
  async getOrCreateDailyNote(
    userId: string,
    entityId: string,
    date: string, // YYYY-MM-DD
  ): Promise<{ noteId: string; isNew: boolean }> {
    // 해당 날짜의 데일리 노트가 이미 있는지 확인
    const existing = await this.meetingNoteService.getMeetingNotes(
      userId,
      {
        type: 'DAILY_NOTE',
        scope: 'mine',
        search: `📅 Daily Note ${date}`,
        date_from: date,
        date_to: date,
      },
      entityId,
      1,
      1,
    );

    if (existing.data.length > 0) {
      return { noteId: existing.data[0].meetingNoteId, isNew: false };
    }

    // 새로 생성
    const dto: CreateMeetingNoteRequest = {
      type: 'DAILY_NOTE',
      title: `📅 Daily Note ${date}`,
      content: `<h2>📅 ${date} Daily Note</h2><p></p>`,
      visibility: 'PRIVATE',
    } as any;

    const note = await this.meetingNoteService.createMeetingNote(dto, userId, entityId);
    return { noteId: note.meetingNoteId, isNew: true };
  }

  /**
   * 데일리 노트에 미션 내용을 추가
   */
  async appendMissionContent(
    noteId: string,
    userId: string,
    missionContent: string,
  ): Promise<void> {
    try {
      const note = await this.meetingNoteService.getMeetingNoteById(noteId, userId);
      if (!note) return;

      const missionHtml =
        `<h3>🎯 Mission</h3>` +
        `<pre>${this.escapeHtml(missionContent)}</pre>`;

      // 기존 미션 섹션이 있으면 교체, 없으면 추가
      let updatedContent = note.content || '';
      const missionRegex = /<h3>🎯 Mission<\/h3>[\s\S]*?(?=<h3>|$)/;
      if (missionRegex.test(updatedContent)) {
        updatedContent = updatedContent.replace(missionRegex, missionHtml);
      } else {
        updatedContent += missionHtml;
      }

      await this.meetingNoteService.updateMeetingNote(
        noteId,
        { content: updatedContent } as any,
        userId,
      );
    } catch (err) {
      this.logger.warn(`Failed to append mission to daily note ${noteId}`, err);
    }
  }

  /**
   * 데일리 노트에 미션 체크 결과를 추가
   */
  async appendCheckResult(
    noteId: string,
    userId: string,
    checkScore: number,
    checkResult: string,
  ): Promise<void> {
    try {
      const note = await this.meetingNoteService.getMeetingNoteById(noteId, userId);
      if (!note) return;

      const resultEmoji = checkResult === 'PERFECT' ? '🏆' :
        checkResult === 'GOOD' ? '✅' :
        checkResult === 'PARTIAL' ? '⚡' : '⏸️';

      const checkHtml =
        `<h3>📋 Check Result</h3>` +
        `<p>${resultEmoji} ${checkResult} (${checkScore}%)</p>`;

      let updatedContent = note.content || '';
      const checkRegex = /<h3>📋 Check Result<\/h3>[\s\S]*?(?=<h3>|$)/;
      if (checkRegex.test(updatedContent)) {
        updatedContent = updatedContent.replace(checkRegex, checkHtml);
      } else {
        updatedContent += checkHtml;
      }

      await this.meetingNoteService.updateMeetingNote(
        noteId,
        { content: updatedContent } as any,
        userId,
      );
    } catch (err) {
      this.logger.warn(`Failed to append check result to daily note ${noteId}`, err);
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
