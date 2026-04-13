import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseRequestEntity } from '../entity/expense-request.entity';

@Injectable()
export class ExpenseNumberService {
  constructor(
    @InjectRepository(ExpenseRequestEntity)
    private readonly repo: Repository<ExpenseRequestEntity>,
  ) {}

  async generateNumber(entityId: string, date: string): Promise<string> {
    const d = new Date(date);
    const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;

    const count = await this.repo
      .createQueryBuilder('e')
      .where('e.entId = :entityId', { entityId })
      .andWhere('e.exrNumber LIKE :prefix', { prefix: `EXP-${yyyymm}-%` })
      .withDeleted()
      .getCount();

    const seq = String(count + 1).padStart(4, '0');
    return `EXP-${yyyymm}-${seq}`;
  }
}
