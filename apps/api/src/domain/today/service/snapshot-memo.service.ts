import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodaySnapshotMemoEntity } from '../entity/today-snapshot-memo.entity';
import { TodaySnapshotEntity } from '../entity/today-snapshot.entity';

@Injectable()
export class SnapshotMemoService {
  constructor(
    @InjectRepository(TodaySnapshotMemoEntity)
    private readonly memoRepo: Repository<TodaySnapshotMemoEntity>,
    @InjectRepository(TodaySnapshotEntity)
    private readonly snapshotRepo: Repository<TodaySnapshotEntity>,
  ) {}

  /**
   * 메모 추가
   */
  async addMemo(userId: string, snpId: string, content: string) {
    // 스냅샷 존재 확인
    const snapshot = await this.snapshotRepo.findOne({ where: { snpId } });
    if (!snapshot) throw new NotFoundException('스냅샷을 찾을 수 없습니다.');

    // 다음 순서 계산
    const maxOrder = await this.memoRepo
      .createQueryBuilder('m')
      .select('COALESCE(MAX(m.smo_order), -1)', 'max')
      .where('m.snp_id = :snpId', { snpId })
      .andWhere('m.smo_deleted_at IS NULL')
      .getRawOne();

    const nextOrder = (parseInt(maxOrder?.max ?? '-1') + 1);

    const memo = await this.memoRepo.save(this.memoRepo.create({
      snpId,
      usrId: userId,
      smoContent: content,
      smoOrder: nextOrder,
    }));

    return {
      smoId: memo.smoId,
      usrId: memo.usrId,
      smoContent: memo.smoContent,
      smoOrder: memo.smoOrder,
      smoCreatedAt: memo.smoCreatedAt,
    };
  }

  /**
   * 메모 수정
   */
  async updateMemo(userId: string, snpId: string, memoId: string, content: string) {
    const memo = await this.memoRepo.findOne({
      where: { smoId: memoId, snpId },
    });

    if (!memo) throw new NotFoundException('메모를 찾을 수 없습니다.');
    if (memo.usrId !== userId) throw new ForbiddenException('본인의 메모만 수정할 수 있습니다.');

    memo.smoContent = content;
    await this.memoRepo.save(memo);

    return { smoId: memo.smoId, smoContent: memo.smoContent, smoUpdatedAt: memo.smoUpdatedAt };
  }

  /**
   * 메모 삭제 (soft delete)
   */
  async deleteMemo(userId: string, snpId: string, memoId: string) {
    const memo = await this.memoRepo.findOne({
      where: { smoId: memoId, snpId },
    });

    if (!memo) throw new NotFoundException('메모를 찾을 수 없습니다.');
    if (memo.usrId !== userId) throw new ForbiddenException('본인의 메모만 삭제할 수 있습니다.');

    await this.memoRepo.softRemove(memo);
  }
}
