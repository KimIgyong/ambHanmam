import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { RecurringExpenseEntity } from '../entity/recurring-expense.entity';
import { BankAccountEntity } from '../entity/bank-account.entity';
import { TransactionEntity } from '../entity/transaction.entity';
import { CreateRecurringExpenseRequest } from '../dto/request/create-recurring-expense.request';
import { UpdateRecurringExpenseRequest } from '../dto/request/update-recurring-expense.request';
import { RecurringExpenseMapper } from '../mapper/recurring-expense.mapper';
import { RecurringExpenseResponse, ForecastResponse } from '@amb/types';

@Injectable()
export class RecurringExpenseService {
  constructor(
    @InjectRepository(RecurringExpenseEntity)
    private readonly repo: Repository<RecurringExpenseEntity>,
    @InjectRepository(BankAccountEntity)
    private readonly accountRepo: Repository<BankAccountEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
  ) {}

  async getRecurringExpenses(entityId: string): Promise<RecurringExpenseResponse[]> {
    const expenses = await this.repo.find({
      where: { entId: entityId, rexDeletedAt: IsNull() },
      order: { rexDayOfMonth: 'ASC', rexName: 'ASC' },
    });

    const accountIds = [...new Set(expenses.map((e) => e.bacId))];
    const accounts = accountIds.length > 0
      ? await this.accountRepo.find({ where: { bacId: In(accountIds) } })
      : [];
    const aliasMap = new Map(accounts.map((a) => [a.bacId, a.bacAccountAlias || a.bacBankName]));

    return expenses.map((e) => RecurringExpenseMapper.toResponse(e, aliasMap.get(e.bacId)));
  }

  async createRecurringExpense(
    dto: CreateRecurringExpenseRequest,
    userId: string,
    entityId: string,
  ): Promise<RecurringExpenseResponse> {
    const account = await this.accountRepo.findOne({
      where: { bacId: dto.bac_id, entId: entityId, bacDeletedAt: IsNull() },
    });
    if (!account) {
      throw new HttpException('Bank account not found.', HttpStatus.NOT_FOUND);
    }

    const entity = this.repo.create({
      entId: entityId,
      bacId: dto.bac_id,
      rexName: dto.name,
      rexVendor: dto.vendor || null,
      rexAmount: dto.amount,
      rexCurrency: dto.currency,
      rexDayOfMonth: dto.day_of_month,
      rexCategory: dto.category || null,
      rexDescription: dto.description || null,
      rexStartDate: dto.start_date || null,
      rexEndDate: dto.end_date || null,
    });

    const saved = await this.repo.save(entity);
    return RecurringExpenseMapper.toResponse(saved, account.bacAccountAlias || account.bacBankName);
  }

  async updateRecurringExpense(
    id: string,
    dto: UpdateRecurringExpenseRequest,
    entityId: string,
  ): Promise<RecurringExpenseResponse> {
    const expense = await this.repo.findOne({
      where: { rexId: id, entId: entityId, rexDeletedAt: IsNull() },
    });
    if (!expense) {
      throw new HttpException('Recurring expense not found.', HttpStatus.NOT_FOUND);
    }

    if (dto.name !== undefined) expense.rexName = dto.name;
    if (dto.bac_id !== undefined) expense.bacId = dto.bac_id;
    if (dto.vendor !== undefined) expense.rexVendor = dto.vendor || null;
    if (dto.amount !== undefined) expense.rexAmount = dto.amount;
    if (dto.currency !== undefined) expense.rexCurrency = dto.currency;
    if (dto.day_of_month !== undefined) expense.rexDayOfMonth = dto.day_of_month;
    if (dto.category !== undefined) expense.rexCategory = dto.category || null;
    if (dto.description !== undefined) expense.rexDescription = dto.description || null;
    if (dto.is_active !== undefined) expense.rexIsActive = dto.is_active;
    if (dto.start_date !== undefined) expense.rexStartDate = dto.start_date || null;
    if (dto.end_date !== undefined) expense.rexEndDate = dto.end_date || null;

    const saved = await this.repo.save(expense);
    const account = await this.accountRepo.findOne({ where: { bacId: saved.bacId } });
    return RecurringExpenseMapper.toResponse(saved, account?.bacAccountAlias || account?.bacBankName);
  }

  async deleteRecurringExpense(id: string, entityId: string): Promise<void> {
    const expense = await this.repo.findOne({
      where: { rexId: id, entId: entityId, rexDeletedAt: IsNull() },
    });
    if (!expense) {
      throw new HttpException('Recurring expense not found.', HttpStatus.NOT_FOUND);
    }
    await this.repo.softDelete(id);
  }

  async getForecast(entityId: string, month: string): Promise<ForecastResponse> {
    // month format: "2026-04"
    const [year, mon] = month.split('-').map(Number);
    const monthStart = `${year}-${String(mon).padStart(2, '0')}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const monthEnd = `${year}-${String(mon).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Get active recurring expenses valid for this month
    const qb = this.repo
      .createQueryBuilder('rex')
      .where('rex.ent_id = :entityId', { entityId })
      .andWhere('rex.rex_deleted_at IS NULL')
      .andWhere('rex.rex_is_active = true')
      .andWhere('(rex.rex_start_date IS NULL OR rex.rex_start_date <= :monthEnd)', { monthEnd })
      .andWhere('(rex.rex_end_date IS NULL OR rex.rex_end_date >= :monthStart)', { monthStart });

    const expenses = await qb.getMany();

    // Get account info
    const accountIds = [...new Set(expenses.map((e) => e.bacId))];
    const accounts = accountIds.length > 0
      ? await this.accountRepo.find({ where: { bacId: In(accountIds) } })
      : [];
    const accountMap = new Map(accounts.map((a) => [a.bacId, a]));

    // Get previous month actual spending for comparison
    const prevMonth = mon === 1 ? 12 : mon - 1;
    const prevYear = mon === 1 ? year - 1 : year;
    const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
    const prevMonthEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`;

    // Get actual withdrawal transactions from previous month for matching vendors
    const vendorNames = expenses.map((e) => e.rexVendor).filter(Boolean) as string[];
    let actualMap = new Map<string, number>();

    if (vendorNames.length > 0 && accountIds.length > 0) {
      const actuals = await this.transactionRepo
        .createQueryBuilder('txn')
        .select('LOWER(txn.txn_vendor)', 'vendor')
        .addSelect('SUM(ABS(txn.txn_balance))', 'total')
        .where('txn.bac_id IN (:...accountIds)', { accountIds })
        .andWhere('txn.txn_deleted_at IS NULL')
        .andWhere('txn.txn_balance < 0')
        .andWhere('txn.txn_date >= :prevStart', { prevStart: prevMonthStart })
        .andWhere('txn.txn_date <= :prevEnd', { prevEnd: prevMonthEnd })
        .andWhere('txn.txn_vendor IS NOT NULL')
        .groupBy('LOWER(txn.txn_vendor)')
        .getRawMany<{ vendor: string; total: string }>();

      actualMap = new Map(actuals.map((a) => [a.vendor, Number(a.total)]));
    }

    // Build forecast items
    const items = expenses.map((e) => {
      const account = accountMap.get(e.bacId);
      const actualAmount = e.rexVendor ? actualMap.get(e.rexVendor.toLowerCase()) || null : null;

      return {
        id: e.rexId,
        name: e.rexName,
        vendor: e.rexVendor,
        expectedAmount: Number(e.rexAmount),
        actualAmount,
        currency: e.rexCurrency,
        dayOfMonth: e.rexDayOfMonth,
        category: e.rexCategory,
        accountAlias: account?.bacAccountAlias || account?.bacBankName || null,
      };
    });

    // Totals by currency
    const totalsByCurrency: Record<string, number> = {};
    for (const item of items) {
      totalsByCurrency[item.currency] = (totalsByCurrency[item.currency] || 0) + item.expectedAmount;
    }

    return {
      month,
      items,
      totalsByCurrency,
      previousMonth: `${prevYear}-${String(prevMonth).padStart(2, '0')}`,
    };
  }
}
