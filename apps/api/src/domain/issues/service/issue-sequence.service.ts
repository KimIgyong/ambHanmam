import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { IssueSequenceEntity } from '../entity/issue-sequence.entity';

@Injectable()
export class IssueSequenceService {
  constructor(
    @InjectRepository(IssueSequenceEntity)
    private readonly sequenceRepo: Repository<IssueSequenceEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 법인별 이슈 참조번호 생성 (ISN-{일련번호})
   * 트랜잭션 + SELECT ... FOR UPDATE로 동시성 제어
   */
  async generateRefNumber(entityId: string, manager?: EntityManager): Promise<string> {
    if (manager) {
      return this.doGenerate(entityId, manager);
    }
    return this.dataSource.transaction(async (txManager) => {
      return this.doGenerate(entityId, txManager);
    });
  }

  private async doGenerate(entityId: string, manager: EntityManager): Promise<string> {
    const repo = manager.getRepository(IssueSequenceEntity);

    let seq = await repo
      .createQueryBuilder('seq')
      .setLock('pessimistic_write')
      .where('seq.entId = :entityId', { entityId })
      .getOne();

    if (!seq) {
      seq = repo.create({ entId: entityId, isqLastNumber: 0 });
    }

    seq.isqLastNumber += 1;
    await repo.save(seq);

    return `ISN-${seq.isqLastNumber}`;
  }
}
