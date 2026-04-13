import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserCellEntity } from '../entity/user-cell.entity';

/**
 * 셀 기반 접근 제어 서비스
 * - visibility = 'CELL' 인 데이터에 대한 접근 권한 확인
 * - 사용자가 속한 셀 ID 목록 조회
 */
@Injectable()
export class CellAccessService {
  constructor(
    @InjectRepository(UserCellEntity)
    private readonly userCellRepository: Repository<UserCellEntity>,
  ) {}

  /**
   * 사용자가 속한 모든 셀 ID 목록 반환
   */
  async getUserCellIds(userId: string): Promise<string[]> {
    const userCells = await this.userCellRepository.find({
      where: { usrId: userId },
      select: ['celId'],
    });
    return userCells.map((ug) => ug.celId);
  }

  /**
   * 사용자가 특정 셀에 속해 있는지 확인
   */
  async isUserInCell(userId: string, cellId: string): Promise<boolean> {
    const count = await this.userCellRepository.count({
      where: { usrId: userId, celId: cellId },
    });
    return count > 0;
  }

  /**
   * 사용자가 주어진 셀 목록 중 하나 이상에 속해 있는지 확인
   */
  async isUserInAnyCell(userId: string, cellIds: string[]): Promise<boolean> {
    if (cellIds.length === 0) return false;
    const count = await this.userCellRepository.count({
      where: { usrId: userId, celId: In(cellIds) },
    });
    return count > 0;
  }

  /**
   * visibility + cellId 기반 접근 권한 확인
   * - PRIVATE: 소유자만
   * - CELL: 해당 셀 멤버
   * - UNIT: 같은 부서 (하위호환용, 별도 체크 필요)
   * - PUBLIC/ENTITY: 모두 접근 가능
   */
  async canAccess(
    userId: string,
    ownerId: string,
    visibility: string,
    cellId?: string | null,
    userUnit?: string,
    dataUnit?: string,
  ): Promise<boolean> {
    // 소유자는 항상 접근 가능
    if (userId === ownerId) return true;

    switch (visibility) {
      case 'PRIVATE':
        return false;
      case 'CELL':
        if (!cellId) return false;
        return this.isUserInCell(userId, cellId);
      case 'UNIT':
        // 하위호환: 부서 기반 접근 제어
        return !!userUnit && !!dataUnit && userUnit === dataUnit;
      case 'PUBLIC':
      case 'ENTITY':
        return true;
      default:
        return false;
    }
  }
}
