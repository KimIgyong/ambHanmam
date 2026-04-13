import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxSimpleTableEntity } from '../entity/tax-simple-table.entity';

export interface TaxTableRow {
  salaryFrom: number;
  salaryTo: number;
  dependents: number;
  taxAmount: number;
}

export interface TaxTableSummary {
  year: number;
  rowCount: number;
  salaryRangeCount: number;
}

@Injectable()
export class TaxTableService {
  constructor(
    @InjectRepository(TaxSimpleTableEntity)
    private readonly taxTableRepo: Repository<TaxSimpleTableEntity>,
  ) {}

  async getTableSummary(entityId: string): Promise<TaxTableSummary[]> {
    const result = await this.taxTableRepo
      .createQueryBuilder('t')
      .select('t.tst_effective_year', 'year')
      .addSelect('COUNT(*)', 'rowCount')
      .addSelect('COUNT(DISTINCT t.tst_salary_from)', 'salaryRangeCount')
      .where('t.ent_id = :entityId', { entityId })
      .groupBy('t.tst_effective_year')
      .orderBy('t.tst_effective_year', 'DESC')
      .getRawMany();

    return result.map((r) => ({
      year: Number(r.year),
      rowCount: Number(r.rowCount),
      salaryRangeCount: Number(r.salaryRangeCount),
    }));
  }

  async getTableByYear(entityId: string, year: number, page = 1, limit = 50): Promise<{ rows: TaxTableRow[]; total: number }> {
    const [entities, total] = await this.taxTableRepo.findAndCount({
      where: { entId: entityId, tstEffectiveYear: year },
      order: { tstSalaryFrom: 'ASC', tstDependents: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      rows: entities.map((e) => ({
        salaryFrom: Number(e.tstSalaryFrom),
        salaryTo: Number(e.tstSalaryTo),
        dependents: e.tstDependents,
        taxAmount: Number(e.tstTaxAmount),
      })),
      total,
    };
  }

  async lookupTax(entityId: string, year: number, salary: number, dependents: number): Promise<number> {
    const dep = Math.min(Math.max(dependents, 1), 11);

    const entry = await this.taxTableRepo
      .createQueryBuilder('t')
      .where('t.ent_id = :entityId', { entityId })
      .andWhere('t.tst_effective_year = :year', { year })
      .andWhere('t.tst_salary_from <= :salary', { salary })
      .andWhere('t.tst_salary_to > :salary', { salary })
      .andWhere('t.tst_dependents = :dep', { dep })
      .getOne();

    return entry ? Number(entry.tstTaxAmount) : 0;
  }

  async importCsv(entityId: string, year: number, csvContent: string): Promise<number> {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new BadRequestException('CSV must have at least a header and one data row.');
    }

    // Parse header: salary_from,salary_to,dep_1,dep_2,...,dep_11
    const header = lines[0].split(',').map((h) => h.trim());
    const depColumns = header.filter((h) => h.startsWith('dep_'));
    if (depColumns.length === 0) {
      throw new BadRequestException('CSV must have dep_N columns (e.g., dep_1, dep_2, ..., dep_11).');
    }

    const records: Partial<TaxSimpleTableEntity>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      if (cols.length < 2 + depColumns.length) continue;

      const salaryFrom = Number(cols[0]);
      const salaryTo = Number(cols[1]);

      for (let j = 0; j < depColumns.length; j++) {
        const depNum = Number(depColumns[j].replace('dep_', ''));
        const taxAmount = Number(cols[2 + j]);
        if (isNaN(taxAmount)) continue;

        records.push({
          entId: entityId,
          tstEffectiveYear: year,
          tstSalaryFrom: salaryFrom,
          tstSalaryTo: salaryTo,
          tstDependents: depNum,
          tstTaxAmount: taxAmount,
        });
      }
    }

    if (records.length === 0) {
      throw new BadRequestException('No valid data rows found in CSV.');
    }

    // Delete existing data for this year, then bulk insert
    await this.taxTableRepo.delete({ entId: entityId, tstEffectiveYear: year });
    await this.taxTableRepo.save(records as TaxSimpleTableEntity[], { chunk: 500 });

    return records.length;
  }

  async deleteByYear(entityId: string, year: number): Promise<number> {
    const result = await this.taxTableRepo.delete({
      entId: entityId,
      tstEffectiveYear: year,
    });
    return result.affected || 0;
  }
}
