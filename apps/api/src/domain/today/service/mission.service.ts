import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DailyMissionEntity } from '../entity/daily-mission.entity';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { SnapshotService } from './snapshot.service';
import { DailyNoteService } from './daily-note.service';
import { getLocalToday } from '../../../global/util/date.util';

interface MissionCheckLine {
  lineIndex: number;
  text: string;
  state: 'done' | 'incomplete' | 'na';
  subChoice: 'mission' | 'task' | null;
}

function computeCheckResult(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 100) return 'PERFECT';
  if (score >= 75) return 'GOOD';
  if (score > 0) return 'PARTIAL';
  return 'ZERO';
}

@Injectable()
export class MissionService {
  private readonly logger = new Logger(MissionService.name);

  constructor(
    @InjectRepository(DailyMissionEntity)
    private readonly missionRepo: Repository<DailyMissionEntity>,
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    private readonly dataSource: DataSource,
    private readonly snapshotService: SnapshotService,
    private readonly dailyNoteService: DailyNoteService,
  ) {}

  /**
   * 미션 저장 (UPSERT) + 스냅샷 트리거
   */
  async saveMission(userId: string, entityId: string, content: string | null, timezone?: string) {
    const today = getLocalToday(timezone);

    // UPSERT
    let mission = await this.missionRepo.findOne({
      where: { usrId: userId, msnDate: today },
    });

    if (mission) {
      mission.msnContent = content;
      mission = await this.missionRepo.save(mission);
    } else {
      mission = await this.missionRepo.save(this.missionRepo.create({
        entId: entityId,
        usrId: userId,
        msnDate: today,
        msnContent: content,
      }));
    }

    // 미션 내용이 있으면 스냅샷 생성 (실패해도 미션은 유지)
    let snapshotCreated = false;
    let snapshotId: string | null = null;

    if (content) {
      try {
        const snapshot = await this.snapshotService.createSnapshot(userId, entityId, mission.msnId, timezone);
        snapshotCreated = true;
        snapshotId = snapshot.snpId;
      } catch (err) {
        this.logger.error(`Snapshot creation failed for mission ${mission.msnId}`, err);
      }
    }

    // 데일리 노트에 미션 내용 연동
    if (content) {
      this.syncDailyNote(userId, entityId, today, content).catch((err) =>
        this.logger.warn('Daily note sync failed', err),
      );
    }

    return {
      msnId: mission.msnId,
      msnDate: mission.msnDate,
      msnContent: mission.msnContent,
      snapshotCreated,
      snapshotId,
    };
  }

  /**
   * 미션 수정 + 스냅샷 재생성
   */
  async updateMission(userId: string, entityId: string, date: string, content: string, timezone?: string) {
    const today = getLocalToday(timezone);
    if (date !== today) {
      throw new BadRequestException('미션은 당일만 수정할 수 있습니다.');
    }

    const mission = await this.missionRepo.findOne({
      where: { usrId: userId, msnDate: date },
    });

    if (!mission) {
      throw new NotFoundException('해당 날짜의 미션이 없습니다.');
    }

    mission.msnContent = content;
    await this.missionRepo.save(mission);

    // 스냅샷 재생성
    try {
      await this.snapshotService.createSnapshot(userId, entityId, mission.msnId, timezone);
    } catch (err) {
      this.logger.error(`Snapshot re-creation failed for mission ${mission.msnId}`, err);
    }

    return { msnId: mission.msnId, msnDate: mission.msnDate, msnContent: mission.msnContent };
  }

  /**
   * 어제 미션 라인별 체크 결과 저장 + Todo 자동 생성
   */
  async saveCheck(
    userId: string,
    entityId: string,
    date: string,
    lines: MissionCheckLine[],
    timezone?: string,
  ) {
    const mission = await this.missionRepo.findOne({
      where: { usrId: userId, msnDate: date },
    });

    if (!mission) {
      throw new NotFoundException('해당 날짜의 미션이 없습니다.');
    }

    if (mission.msnCheckResult) {
      throw new BadRequestException('이미 체크가 완료된 미션입니다.');
    }

    const today = getLocalToday(timezone);
    const registeredLines: any[] = [];
    const carryOverTexts: string[] = [];

    return this.dataSource.transaction(async (manager) => {
      for (const line of lines) {
        let itemId: string | null = null;

        if (line.state === 'done') {
          // 완료 Todo 생성
          const todo = manager.create(TodoEntity, {
            entId: entityId,
            usrId: userId,
            tdoTitle: line.text.substring(0, 200),
            tdoStatus: 'COMPLETED',
            tdoStartDate: date as any,
            tdoCompletedAt: new Date(),
            tdoVisibility: 'PRIVATE',
          });
          const saved = await manager.save(TodoEntity, todo);
          itemId = saved.tdoId;
        } else if (line.state === 'incomplete' && line.subChoice === 'task') {
          // 진행중 Todo 생성
          const todo = manager.create(TodoEntity, {
            entId: entityId,
            usrId: userId,
            tdoTitle: line.text.substring(0, 200),
            tdoStatus: 'IN_PROGRESS',
            tdoStartDate: today as any,
            tdoVisibility: 'PRIVATE',
          });
          const saved = await manager.save(TodoEntity, todo);
          itemId = saved.tdoId;
        } else if (line.state === 'incomplete' && line.subChoice === 'mission') {
          carryOverTexts.push(line.text);
        }

        registeredLines.push({
          lineIndex: line.lineIndex,
          text: line.text,
          state: line.state,
          subChoice: line.subChoice,
          itemId,
          registeredAt: new Date().toISOString(),
        });
      }

      // 달성도 계산
      const evalTotal = lines.filter((l) => l.state !== 'na').length;
      const doneCount = lines.filter((l) => l.state === 'done').length;
      const score = evalTotal > 0 ? Math.round((doneCount / evalTotal) * 100) : null;
      const result = computeCheckResult(score);
      const carryOverText = carryOverTexts.length > 0
        ? carryOverTexts.map((t) => `<p>${t}</p>`).join('')
        : null;

      // 미션 업데이트
      await manager.update(DailyMissionEntity, { msnId: mission.msnId }, {
        msnCheckResult: result,
        msnCheckScore: score,
        msnRegisteredLines: registeredLines,
        msnCarryOverText: carryOverText,
      });

      return {
        msnId: mission.msnId,
        msnDate: mission.msnDate,
        checkScore: score,
        checkResult: result,
        registeredLines: registeredLines.map((rl) => ({
          lineIndex: rl.lineIndex,
          state: rl.state,
          subChoice: rl.subChoice,
          itemId: rl.itemId,
        })),
        carryOverText,
      };
    }).then((txResult) => {
      // 트랜잭션 성공 후 데일리 노트에 체크 결과 연동
      if (txResult.checkScore !== null && txResult.checkResult) {
        this.dailyNoteService.getOrCreateDailyNote(userId, entityId, date)
          .then(({ noteId }) =>
            this.dailyNoteService.appendCheckResult(noteId, userId, txResult.checkScore!, txResult.checkResult!),
          )
          .catch((err) => this.logger.warn('Daily note check sync failed', err));
      }
      return txResult;
    });
  }

  /**
   * 오늘 미션 조회
   */
  async getTodayMission(userId: string, timezone?: string) {
    const today = getLocalToday(timezone);
    return this.missionRepo.findOne({
      where: { usrId: userId, msnDate: today },
    });
  }

  /**
   * 최근 미체크 미션 조회 (7일 이내, 가장 최근 1건)
   */
  async getLatestUncheckedMission(userId: string, timezone?: string) {
    const today = getLocalToday(timezone);
    const weekAgo = this.getDateNDaysAgo(today, 7);

    const mission = await this.missionRepo
      .createQueryBuilder('m')
      .where('m.usr_id = :userId', { userId })
      .andWhere('m.msn_date < :today', { today })
      .andWhere('m.msn_date >= :weekAgo', { weekAgo })
      .andWhere('m.msn_content IS NOT NULL')
      .andWhere('m.msn_check_result IS NULL')
      .orderBy('m.msn_date', 'DESC')
      .getOne();

    return mission ?? null;
  }

  /**
   * 최근 체크된 미션의 carryOverText 반환 (오늘 미션 미작성 시 사용)
   */
  async getLatestCarryOverText(userId: string, timezone?: string): Promise<string | null> {
    const today = getLocalToday(timezone);
    const weekAgo = this.getDateNDaysAgo(today, 7);

    const mission = await this.missionRepo
      .createQueryBuilder('m')
      .where('m.usr_id = :userId', { userId })
      .andWhere('m.msn_date < :today', { today })
      .andWhere('m.msn_date >= :weekAgo', { weekAgo })
      .andWhere('m.msn_carry_over_text IS NOT NULL')
      .andWhere('m.msn_check_result IS NOT NULL')
      .orderBy('m.msn_date', 'DESC')
      .getOne();

    return mission?.msnCarryOverText ?? null;
  }

  private getDateNDaysAgo(dateStr: string, days: number): string {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  /**
   * 데일리 노트에 미션 내용을 동기화
   */
  private async syncDailyNote(userId: string, entityId: string, date: string, content: string): Promise<void> {
    const { noteId } = await this.dailyNoteService.getOrCreateDailyNote(userId, entityId, date);
    await this.dailyNoteService.appendMissionContent(noteId, userId, content);
  }
}
