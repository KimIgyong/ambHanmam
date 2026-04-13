import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Observable } from 'rxjs';
import { BankAccountEntity } from '../entity/bank-account.entity';
import { TransactionEntity } from '../entity/transaction.entity';
import { CreateAccountRequest } from '../dto/request/create-account.request';
import { UpdateAccountRequest } from '../dto/request/update-account.request';
import { CreateTransactionRequest } from '../dto/request/create-transaction.request';
import { UpdateTransactionRequest } from '../dto/request/update-transaction.request';
import { BankAccountMapper } from '../mapper/bank-account.mapper';
import { TransactionMapper } from '../mapper/transaction.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { ClaudeService, ClaudeStreamEvent } from '../../../infrastructure/external/claude/claude.service';
import { AnalysisService } from './analysis.service';
import { BankAccountResponse, TransactionResponse, AccountSummaryResponse, MonthlyStatsResponse, TopVendorResponse } from '@amb/types';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(BankAccountEntity)
    private readonly accountRepo: Repository<BankAccountEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    private readonly claudeService: ClaudeService,
    private readonly analysisService: AnalysisService,
  ) {}

  // ─── Account CRUD ────────────────────────────────────────

  async getAccounts(entityId: string): Promise<BankAccountResponse[]> {
    const where: any = { bacDeletedAt: IsNull(), entId: entityId };

    const accounts = await this.accountRepo.find({
      where,
      order: { bacBankName: 'ASC', bacCurrency: 'ASC' },
    });

    if (accounts.length === 0) return [];

    // Batch query: get last transaction for each account in a single query
    const accountIds = accounts.map((a) => a.bacId);
    const lastTxns = await this.transactionRepo
      .createQueryBuilder('txn')
      .select('DISTINCT ON (txn.bac_id) txn.bac_id', 'bacId')
      .addSelect('txn.txn_cumulative_balance', 'cumulativeBalance')
      .addSelect('txn.txn_date', 'txnDate')
      .where('txn.bac_id IN (:...accountIds)', { accountIds })
      .andWhere('txn.txn_deleted_at IS NULL')
      .orderBy('txn.bac_id')
      .addOrderBy('txn.txn_date', 'DESC')
      .addOrderBy('txn.txn_created_at', 'DESC')
      .getRawMany<{ bacId: string; cumulativeBalance: string; txnDate: string }>();

    const balanceMap = new Map(lastTxns.map((t) => [t.bacId, { currentBalance: Number(t.cumulativeBalance), lastTransactionDate: t.txnDate }]));

    return accounts.map((account) => {
      const info = balanceMap.get(account.bacId);
      return BankAccountMapper.toResponse(
        account,
        info ? info.currentBalance : Number(account.bacOpeningBalance),
        info ? info.lastTransactionDate : null,
      );
    });
  }

  async getAccountById(id: string, entityId: string): Promise<BankAccountResponse> {
    const account = await this.accountRepo.findOne({ where: { bacId: id, entId: entityId, bacDeletedAt: IsNull() } });
    if (!account) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const { currentBalance, lastTransactionDate } = await this.getAccountBalanceInfo(account.bacId, Number(account.bacOpeningBalance));
    return BankAccountMapper.toResponse(account, currentBalance, lastTransactionDate);
  }

  async createAccount(dto: CreateAccountRequest, userId: string, entityId: string): Promise<BankAccountResponse> {
    const existing = await this.accountRepo.findOne({
      where: { bacAccountNumber: dto.account_number, entId: entityId, bacDeletedAt: IsNull() },
    });
    if (existing) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NUMBER_DUPLICATE, HttpStatus.CONFLICT);
    }

    const account = this.accountRepo.create({
      entId: entityId,
      usrId: userId,
      bacBankName: dto.bank_name,
      bacBranchName: dto.branch_name || null,
      bacAccountNumber: dto.account_number,
      bacAccountAlias: dto.account_alias || null,
      bacCurrency: dto.currency,
      bacOpeningBalance: dto.opening_balance || 0,
      bacOpeningDate: dto.opening_date || null,
    });

    const saved = await this.accountRepo.save(account);
    return BankAccountMapper.toResponse(saved, Number(saved.bacOpeningBalance), null);
  }

  async updateAccount(id: string, dto: UpdateAccountRequest, entityId: string): Promise<BankAccountResponse> {
    const account = await this.accountRepo.findOne({ where: { bacId: id, entId: entityId, bacDeletedAt: IsNull() } });
    if (!account) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (dto.bank_name !== undefined) account.bacBankName = dto.bank_name;
    if (dto.branch_name !== undefined) account.bacBranchName = dto.branch_name || null;
    if (dto.account_number !== undefined) account.bacAccountNumber = dto.account_number;
    if (dto.account_alias !== undefined) account.bacAccountAlias = dto.account_alias || null;
    if (dto.currency !== undefined) account.bacCurrency = dto.currency;
    if (dto.opening_balance !== undefined) account.bacOpeningBalance = dto.opening_balance;
    if (dto.opening_date !== undefined) account.bacOpeningDate = dto.opening_date || null;
    if (dto.is_active !== undefined) account.bacIsActive = dto.is_active;

    const saved = await this.accountRepo.save(account);
    const { currentBalance, lastTransactionDate } = await this.getAccountBalanceInfo(saved.bacId, Number(saved.bacOpeningBalance));
    return BankAccountMapper.toResponse(saved, currentBalance, lastTransactionDate);
  }

  async deleteAccount(id: string, entityId: string): Promise<void> {
    const account = await this.accountRepo.findOne({ where: { bacId: id, entId: entityId, bacDeletedAt: IsNull() } });
    if (!account) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    await this.accountRepo.softDelete(id);
  }

  async getAccountSummary(entityId: string): Promise<AccountSummaryResponse> {
    const accounts = await this.getAccounts(entityId);
    const totalsByCurrency: Record<string, number> = {};

    for (const account of accounts) {
      if (!account.isActive) continue;
      const currency = account.currency;
      totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + account.currentBalance;
    }

    return { accounts, totalsByCurrency };
  }

  // ─── Transaction CRUD ────────────────────────────────────

  async getTransactions(
    accountId: string,
    entityId: string,
    filters?: {
      date_from?: string;
      date_to?: string;
      vendor?: string;
      description?: string;
      flow_type?: 'DEPOSIT' | 'WITHDRAWAL';
      sort_order?: 'ASC' | 'DESC';
      page?: number;
      size?: number;
    },
  ): Promise<{ data: TransactionResponse[]; totalCount: number }> {
    const account = await this.accountRepo.findOne({ where: { bacId: accountId, entId: entityId, bacDeletedAt: IsNull() } });
    if (!account) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const qb = this.transactionRepo
      .createQueryBuilder('txn')
      .where('txn.bac_id = :accountId', { accountId })
      .andWhere('txn.txn_deleted_at IS NULL');

    if (filters?.date_from) {
      qb.andWhere('txn.txn_date >= :dateFrom', { dateFrom: filters.date_from });
    }
    if (filters?.date_to) {
      qb.andWhere('txn.txn_date <= :dateTo', { dateTo: filters.date_to });
    }
    if (filters?.vendor) {
      qb.andWhere('txn.txn_vendor ILIKE :vendor', { vendor: `%${filters.vendor}%` });
    }
    if (filters?.description) {
      qb.andWhere('txn.txn_description ILIKE :description', { description: `%${filters.description}%` });
    }
    if (filters?.flow_type === 'DEPOSIT') {
      qb.andWhere('txn.txn_balance > 0');
    }
    if (filters?.flow_type === 'WITHDRAWAL') {
      qb.andWhere('txn.txn_balance < 0');
    }

    const sortOrder = filters?.sort_order || 'DESC';
    qb.orderBy('txn.txn_seq_no', sortOrder).addOrderBy('txn.txn_date', sortOrder).addOrderBy('txn.txn_created_at', sortOrder);

    const page = filters?.page || 1;
    const size = filters?.size || 100;
    qb.skip((page - 1) * size).take(size);

    const [transactions, totalCount] = await qb.getManyAndCount();
    return {
      data: transactions.map(TransactionMapper.toResponse),
      totalCount,
    };
  }

  async createTransaction(
    accountId: string,
    entityId: string,
    dto: CreateTransactionRequest,
    userId: string,
  ): Promise<TransactionResponse> {
    const account = await this.accountRepo.findOne({ where: { bacId: accountId, entId: entityId, bacDeletedAt: IsNull() } });
    if (!account) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const netValue = dto.net_value;
    const vat = dto.vat || 0;
    const bankCharge = dto.bank_charge || 0;
    const totalValue = netValue + vat;
    const balance = totalValue + bankCharge;

    // Auto-assign next sequence number
    const maxSeq = await this.transactionRepo
      .createQueryBuilder('txn')
      .select('COALESCE(MAX(txn.txn_seq_no), 0)', 'maxSeq')
      .where('txn.bac_id = :accountId', { accountId })
      .andWhere('txn.txn_deleted_at IS NULL')
      .getRawOne();
    const nextSeqNo = (maxSeq?.maxSeq || 0) + 1;

    const txn = this.transactionRepo.create({
      bacId: accountId,
      usrId: userId,
      txnSeqNo: nextSeqNo,
      txnDate: dto.transaction_date,
      txnProjectName: dto.project_name || null,
      txnNetValue: netValue,
      txnVat: vat,
      txnBankCharge: bankCharge,
      txnTotalValue: totalValue,
      txnBalance: balance,
      txnCumulativeBalance: 0,
      txnVendor: dto.vendor || null,
      txnDescription: dto.description || null,
    });

    const saved = await this.transactionRepo.save(txn);
    await this.recalculateCumulativeBalance(accountId, dto.transaction_date);

    const updated = await this.transactionRepo.findOne({ where: { txnId: saved.txnId } });
    return TransactionMapper.toResponse(updated!);
  }

  async updateTransaction(
    accountId: string,
    txnId: string,
    dto: UpdateTransactionRequest,
    entityId: string,
  ): Promise<TransactionResponse> {
    // Verify account belongs to entity
    const account = await this.accountRepo.findOne({ where: { bacId: accountId, entId: entityId, bacDeletedAt: IsNull() } });
    if (!account) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const txn = await this.transactionRepo.findOne({
      where: { txnId, bacId: accountId, txnDeletedAt: IsNull() },
    });
    if (!txn) {
      throw new HttpException(ERROR_CODE.TRANSACTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const earliestDate = dto.transaction_date && dto.transaction_date < txn.txnDate ? dto.transaction_date : txn.txnDate;

    if (dto.transaction_date !== undefined) txn.txnDate = dto.transaction_date;
    if (dto.project_name !== undefined) txn.txnProjectName = dto.project_name || null;
    if (dto.net_value !== undefined) txn.txnNetValue = dto.net_value;
    if (dto.vat !== undefined) txn.txnVat = dto.vat;
    if (dto.bank_charge !== undefined) txn.txnBankCharge = dto.bank_charge;
    if (dto.vendor !== undefined) txn.txnVendor = dto.vendor || null;
    if (dto.description !== undefined) txn.txnDescription = dto.description || null;

    const netValue = Number(txn.txnNetValue);
    const vat = Number(txn.txnVat);
    const bankCharge = Number(txn.txnBankCharge);
    txn.txnTotalValue = netValue + vat;
    txn.txnBalance = netValue + vat + bankCharge;

    await this.transactionRepo.save(txn);
    await this.recalculateCumulativeBalance(accountId, earliestDate);

    const updated = await this.transactionRepo.findOne({ where: { txnId } });
    return TransactionMapper.toResponse(updated!);
  }

  async deleteTransaction(accountId: string, txnId: string, entityId: string): Promise<void> {
    // Verify account belongs to entity
    const account = await this.accountRepo.findOne({ where: { bacId: accountId, entId: entityId, bacDeletedAt: IsNull() } });
    if (!account) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const txn = await this.transactionRepo.findOne({
      where: { txnId, bacId: accountId, txnDeletedAt: IsNull() },
    });
    if (!txn) {
      throw new HttpException(ERROR_CODE.TRANSACTION_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const dateToRecalc = txn.txnDate;
    await this.transactionRepo.softDelete(txnId);
    await this.recalculateCumulativeBalance(accountId, dateToRecalc);
  }

  // ─── Statistics ─────────────────────────────────────────

  async getMonthlyStats(
    accountId: string,
    entityId: string,
    startMonth?: string,
    endMonth?: string,
  ): Promise<MonthlyStatsResponse[]> {
    const account = await this.accountRepo.findOne({
      where: { bacId: accountId, entId: entityId, bacDeletedAt: IsNull() },
    });
    if (!account) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const qb = this.transactionRepo
      .createQueryBuilder('txn')
      .select("TO_CHAR(DATE_TRUNC('month', txn.txn_date), 'YYYY-MM')", 'month')
      .addSelect('SUM(CASE WHEN txn.txn_balance > 0 THEN txn.txn_balance ELSE 0 END)', 'deposit')
      .addSelect('SUM(CASE WHEN txn.txn_balance < 0 THEN ABS(txn.txn_balance) ELSE 0 END)', 'withdrawal')
      .where('txn.bac_id = :accountId', { accountId })
      .andWhere('txn.txn_deleted_at IS NULL');

    if (startMonth) {
      qb.andWhere('txn.txn_date >= :startDate', { startDate: `${startMonth}-01` });
    }
    if (endMonth) {
      const [y, m] = endMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      qb.andWhere('txn.txn_date <= :endDate', { endDate: `${endMonth}-${String(lastDay).padStart(2, '0')}` });
    }

    qb.groupBy("DATE_TRUNC('month', txn.txn_date)")
      .orderBy("DATE_TRUNC('month', txn.txn_date)", 'ASC');

    const raw = await qb.getRawMany<{ month: string; deposit: string; withdrawal: string }>();

    return raw.map((r) => ({
      month: r.month,
      deposit: Number(r.deposit),
      withdrawal: Number(r.withdrawal),
      net: Number(r.deposit) - Number(r.withdrawal),
    }));
  }

  async getConsolidatedMonthlyStats(
    accountIds: string[],
    entityId: string,
    startMonth?: string,
    endMonth?: string,
  ): Promise<MonthlyStatsResponse[]> {
    if (accountIds.length === 0) return [];

    // Verify all accounts belong to entity
    const accounts = await this.accountRepo
      .createQueryBuilder('a')
      .where('a.bac_id IN (:...accountIds)', { accountIds })
      .andWhere('a.ent_id = :entityId', { entityId })
      .andWhere('a.bac_deleted_at IS NULL')
      .getMany();

    const validIds = accounts.map((a) => a.bacId);
    if (validIds.length === 0) return [];

    const qb = this.transactionRepo
      .createQueryBuilder('txn')
      .select("TO_CHAR(DATE_TRUNC('month', txn.txn_date), 'YYYY-MM')", 'month')
      .addSelect('SUM(CASE WHEN txn.txn_balance > 0 THEN txn.txn_balance ELSE 0 END)', 'deposit')
      .addSelect('SUM(CASE WHEN txn.txn_balance < 0 THEN ABS(txn.txn_balance) ELSE 0 END)', 'withdrawal')
      .where('txn.bac_id IN (:...validIds)', { validIds })
      .andWhere('txn.txn_deleted_at IS NULL');

    if (startMonth) {
      qb.andWhere('txn.txn_date >= :startDate', { startDate: `${startMonth}-01` });
    }
    if (endMonth) {
      const [y, m] = endMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      qb.andWhere('txn.txn_date <= :endDate', { endDate: `${endMonth}-${String(lastDay).padStart(2, '0')}` });
    }

    qb.groupBy("DATE_TRUNC('month', txn.txn_date)")
      .orderBy("DATE_TRUNC('month', txn.txn_date)", 'ASC');

    const raw = await qb.getRawMany<{ month: string; deposit: string; withdrawal: string }>();

    return raw.map((r) => ({
      month: r.month,
      deposit: Number(r.deposit),
      withdrawal: Number(r.withdrawal),
      net: Number(r.deposit) - Number(r.withdrawal),
    }));
  }

  async getTopVendors(
    accountId: string,
    entityId: string,
    startMonth?: string,
    endMonth?: string,
    limit = 5,
  ): Promise<TopVendorResponse[]> {
    const account = await this.accountRepo.findOne({
      where: { bacId: accountId, entId: entityId, bacDeletedAt: IsNull() },
    });
    if (!account) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const qb = this.transactionRepo
      .createQueryBuilder('txn')
      .select('txn.txn_vendor', 'vendor')
      .addSelect('SUM(ABS(txn.txn_balance))', 'totalAmount')
      .addSelect('COUNT(*)::int', 'count')
      .where('txn.bac_id = :accountId', { accountId })
      .andWhere('txn.txn_deleted_at IS NULL')
      .andWhere('txn.txn_balance < 0')
      .andWhere('txn.txn_vendor IS NOT NULL')
      .andWhere("txn.txn_vendor != ''");

    if (startMonth) {
      qb.andWhere('txn.txn_date >= :startDate', { startDate: `${startMonth}-01` });
    }
    if (endMonth) {
      const [y, m] = endMonth.split('-').map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      qb.andWhere('txn.txn_date <= :endDate', { endDate: `${endMonth}-${String(lastDay).padStart(2, '0')}` });
    }

    qb.groupBy('txn.txn_vendor')
      .orderBy('SUM(ABS(txn.txn_balance))', 'DESC')
      .limit(limit);

    const raw = await qb.getRawMany<{ vendor: string; totalAmount: string; count: number }>();

    return raw.map((r) => ({
      vendor: r.vendor,
      totalAmount: Number(r.totalAmount),
      count: r.count,
    }));
  }

  // ─── Balance Recalculation ───────────────────────────────

  async recalculateCumulativeBalance(accountId: string, fromDate?: string): Promise<void> {
    const account = await this.accountRepo.findOne({ where: { bacId: accountId } });
    if (!account) return;

    const transactions = await this.transactionRepo
      .createQueryBuilder('txn')
      .where('txn.bac_id = :accountId', { accountId })
      .andWhere('txn.txn_deleted_at IS NULL')
      .orderBy('txn.txn_seq_no', 'ASC')
      .addOrderBy('txn.txn_date', 'ASC')
      .addOrderBy('txn.txn_created_at', 'ASC')
      .getMany();

    let cumulativeBalance = Number(account.bacOpeningBalance);

    for (const txn of transactions) {
      cumulativeBalance += Number(txn.txnBalance);
      txn.txnCumulativeBalance = cumulativeBalance;
    }

    if (transactions.length > 0) {
      await this.transactionRepo.save(transactions);
    }
  }

  // ─── Helper ──────────────────────────────────────────────

  // ─── AI Analysis ───────────────────────────────────────

  aiAnalysis(
    accountId: string,
    entityId: string,
    userId: string,
    params?: { date_from?: string; date_to?: string; prompt_id?: string },
  ): Observable<{ type: string; content: string }> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          const account = await this.accountRepo.findOne({
            where: { bacId: accountId, entId: entityId, bacDeletedAt: IsNull() },
          });
          if (!account) {
            subscriber.next({ type: 'error', content: 'Account not found' });
            subscriber.complete();
            return;
          }

          // Fetch transactions for analysis period
          const qb = this.transactionRepo
            .createQueryBuilder('txn')
            .where('txn.bac_id = :accountId', { accountId })
            .andWhere('txn.txn_deleted_at IS NULL');

          if (params?.date_from) {
            qb.andWhere('txn.txn_date >= :dateFrom', { dateFrom: params.date_from });
          }
          if (params?.date_to) {
            qb.andWhere('txn.txn_date <= :dateTo', { dateTo: params.date_to });
          }

          qb.orderBy('txn.txn_date', 'ASC').addOrderBy('txn.txn_seq_no', 'ASC');
          const transactions = await qb.getMany();

          if (transactions.length === 0) {
            subscriber.next({ type: 'error', content: 'No transactions found for the selected period' });
            subscriber.complete();
            return;
          }

          // Build summary data for AI
          const totalDeposit = transactions
            .filter((t) => Number(t.txnBalance) > 0)
            .reduce((s, t) => s + Number(t.txnBalance), 0);
          const totalWithdrawal = transactions
            .filter((t) => Number(t.txnBalance) < 0)
            .reduce((s, t) => s + Math.abs(Number(t.txnBalance)), 0);

          // Vendor aggregation
          const vendorMap = new Map<string, { total: number; count: number }>();
          for (const txn of transactions) {
            const vendor = txn.txnVendor || '(미분류)';
            const amt = Math.abs(Number(txn.txnBalance));
            const prev = vendorMap.get(vendor) || { total: 0, count: 0 };
            vendorMap.set(vendor, { total: prev.total + amt, count: prev.count + 1 });
          }

          // Monthly aggregation
          const monthlyMap = new Map<string, { deposit: number; withdrawal: number }>();
          for (const txn of transactions) {
            const month = txn.txnDate.substring(0, 7);
            const prev = monthlyMap.get(month) || { deposit: 0, withdrawal: 0 };
            const bal = Number(txn.txnBalance);
            if (bal > 0) prev.deposit += bal;
            else prev.withdrawal += Math.abs(bal);
            monthlyMap.set(month, prev);
          }

          const monthlyData = Array.from(monthlyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, d]) => `${month}: 입금 ${d.deposit.toLocaleString()} / 출금 ${d.withdrawal.toLocaleString()}`)
            .join('\n');

          const topVendors = Array.from(vendorMap.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 15)
            .map(([v, d]) => `${v}: ${d.total.toLocaleString()} ${account.bacCurrency} (${d.count}건)`)
            .join('\n');

          // Recent large transactions (top 10)
          const largeTxns = [...transactions]
            .sort((a, b) => Math.abs(Number(b.txnBalance)) - Math.abs(Number(a.txnBalance)))
            .slice(0, 10)
            .map((t) => `${t.txnDate} | ${t.txnVendor || '-'} | ${Number(t.txnBalance).toLocaleString()} ${account.bacCurrency} | ${t.txnDescription || '-'}`)
            .join('\n');

          const dateRange = params?.date_from && params?.date_to
            ? `${params.date_from} ~ ${params.date_to}`
            : params?.date_from
              ? `${params.date_from} ~ 현재`
              : params?.date_to
                ? `시작 ~ ${params.date_to}`
                : '전체 기간';

          // Load custom prompt if specified, otherwise use default
          let customPrompt = params?.prompt_id
            ? await this.analysisService.getPromptById(params.prompt_id, entityId)
            : await this.analysisService.getDefaultOrFirstPrompt(entityId);

          const defaultSystemPrompt = `You are a financial analyst specializing in business account transaction analysis.
Analyze the provided bank account transaction data and generate a comprehensive analysis report.
Write your response in Korean. Use markdown formatting.
Be specific with numbers and percentages. Provide actionable insights.`;

          const defaultUserPrompt = `다음 은행 계좌의 입출금 내역을 분석하여 리포트를 작성해주세요.

## 계좌 정보
- 은행: {{bank_name}}
- 계좌번호: {{account_number}}
- 통화: {{currency}}
- 분석 기간: {{date_range}}
- 총 거래 건수: {{transaction_count}}건

## 요약
- 총 입금: {{total_deposit}} {{currency}}
- 총 출금: {{total_withdrawal}} {{currency}}
- 순 변동: {{net_change}} {{currency}}

## 월별 입출금
{{monthly_data}}

## 주요 거래처 (금액 기준 상위)
{{top_vendors}}

## 주요 대형 거래 (금액 기준 상위 10건)
{{large_transactions}}

위 데이터를 기반으로 다음 항목을 포함한 분석 리포트를 작성해주세요:

## 1. 종합 요약
(핵심 수치와 전반적인 자금 흐름 요약)

## 2. 월별 추이 분석
(입출금 추이, 증감 패턴, 특이 월 분석)

## 3. 거래처 분석
(주요 거래처 비중, 거래 집중도, 특이사항)

## 4. 대형 거래 분석
(대형 입출금 건의 특징, 일회성 vs 반복성)

## 5. 리스크 및 주의사항
(자금 흐름상 주의할 점, 비정상적 패턴)

## 6. 개선 제안
(비용 최적화, 자금 관리 개선 방안)`;

          const systemPrompt = customPrompt?.anpSystemPrompt || defaultSystemPrompt;
          const userTemplate = customPrompt?.anpUserPrompt || defaultUserPrompt;

          const replacements: Record<string, string> = {
            '{{bank_name}}': `${account.bacBankName}${account.bacBranchName ? ` (${account.bacBranchName})` : ''}`,
            '{{account_number}}': account.bacAccountNumber,
            '{{currency}}': account.bacCurrency,
            '{{date_range}}': dateRange,
            '{{transaction_count}}': String(transactions.length),
            '{{total_deposit}}': totalDeposit.toLocaleString(),
            '{{total_withdrawal}}': totalWithdrawal.toLocaleString(),
            '{{net_change}}': (totalDeposit - totalWithdrawal).toLocaleString(),
            '{{monthly_data}}': monthlyData,
            '{{top_vendors}}': topVendors,
            '{{large_transactions}}': largeTxns,
          };

          let userMessage = userTemplate;
          for (const [key, value] of Object.entries(replacements)) {
            userMessage = userMessage.split(key).join(value);
          }

          const stream$ = this.claudeService.streamMessage(
            systemPrompt,
            [{ role: 'user', content: userMessage }],
            { entId: entityId, usrId: userId, sourceType: 'ACCOUNTING_AI_ANALYSIS' },
          );

          stream$.subscribe({
            next: (event: ClaudeStreamEvent) => {
              if (event.type === 'content' && event.content) {
                subscriber.next({ type: 'content', content: event.content });
              } else if (event.type === 'done') {
                subscriber.next({ type: 'done', content: '' });
              } else if (event.type === 'error') {
                subscriber.next({ type: 'error', content: event.error || 'Unknown error' });
              }
            },
            error: (err) => {
              subscriber.next({ type: 'error', content: err.message || 'Stream error' });
              subscriber.complete();
            },
            complete: () => {
              subscriber.complete();
            },
          });
        } catch (err) {
          subscriber.next({ type: 'error', content: err instanceof Error ? err.message : 'Internal error' });
          subscriber.complete();
        }
      })();
    });
  }

  // ─── Chat Assistant ──────────────────────────────────────

  chatAssistant(
    entityId: string,
    userId: string,
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Observable<{ type: string; content: string }> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          // Gather accounting context
          const accounts = await this.getAccounts(entityId);
          const activeAccounts = accounts.filter((a) => a.isActive);

          const accountSummary = activeAccounts.map((a) =>
            `- ${a.accountAlias || a.bankName} (${a.accountNumber}): ${Number(a.currentBalance).toLocaleString()} ${a.currency}`,
          ).join('\n') || '등록된 계좌 없음';

          const totalsByCurrency: Record<string, number> = {};
          for (const a of activeAccounts) {
            totalsByCurrency[a.currency] = (totalsByCurrency[a.currency] || 0) + a.currentBalance;
          }
          const balanceSummary = Object.entries(totalsByCurrency)
            .map(([cur, total]) => `${cur}: ${total.toLocaleString()}`)
            .join(', ') || '없음';

          // Recent transactions (last 30 days, all accounts)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const dateFrom = thirtyDaysAgo.toISOString().split('T')[0];

          const recentTxnRows = await this.transactionRepo
            .createQueryBuilder('txn')
            .innerJoin(BankAccountEntity, 'bac', 'bac.bac_id = txn.bac_id')
            .select([
              'txn.txn_date', 'txn.txn_vendor', 'txn.txn_description',
              'txn.txn_balance', 'txn.txn_cumulative_balance',
              'bac.bac_account_alias', 'bac.bac_bank_name', 'bac.bac_currency',
            ])
            .where('bac.ent_id = :entityId', { entityId })
            .andWhere('bac.bac_deleted_at IS NULL')
            .andWhere('txn.txn_deleted_at IS NULL')
            .andWhere('txn.txn_date >= :dateFrom', { dateFrom })
            .orderBy('txn.txn_date', 'DESC')
            .addOrderBy('txn.txn_created_at', 'DESC')
            .limit(50)
            .getRawMany();

          const recentTxnSummary = recentTxnRows.length > 0
            ? recentTxnRows.map((r) =>
              `${r.txn_date} | ${r.bac_account_alias || r.bac_bank_name} | ${r.txn_vendor || '-'} | ${Number(r.txn_balance).toLocaleString()} ${r.bac_currency} | ${r.txn_description || '-'}`,
            ).join('\n')
            : '최근 30일 거래 없음';

          // Monthly stats (last 6 months, all accounts combined)
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          const monthFrom = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

          const monthlyRows = await this.transactionRepo
            .createQueryBuilder('txn')
            .innerJoin(BankAccountEntity, 'bac', 'bac.bac_id = txn.bac_id')
            .select("TO_CHAR(DATE_TRUNC('month', txn.txn_date), 'YYYY-MM')", 'month')
            .addSelect('bac.bac_currency', 'currency')
            .addSelect('SUM(CASE WHEN txn.txn_balance > 0 THEN txn.txn_balance ELSE 0 END)', 'deposit')
            .addSelect('SUM(CASE WHEN txn.txn_balance < 0 THEN ABS(txn.txn_balance) ELSE 0 END)', 'withdrawal')
            .where('bac.ent_id = :entityId', { entityId })
            .andWhere('bac.bac_deleted_at IS NULL')
            .andWhere('txn.txn_deleted_at IS NULL')
            .andWhere('txn.txn_date >= :monthFrom', { monthFrom })
            .groupBy("DATE_TRUNC('month', txn.txn_date)")
            .addGroupBy('bac.bac_currency')
            .orderBy("DATE_TRUNC('month', txn.txn_date)", 'ASC')
            .getRawMany();

          const monthlySummary = monthlyRows.length > 0
            ? monthlyRows.map((r) =>
              `${r.month} (${r.currency}): 입금 ${Number(r.deposit).toLocaleString()} / 출금 ${Number(r.withdrawal).toLocaleString()}`,
            ).join('\n')
            : '최근 6개월 통계 없음';

          // Recurring expenses
          const recurringExpenses = await this.transactionRepo.manager
            .createQueryBuilder()
            .select(['rex_name', 'rex_vendor', 'rex_amount', 'rex_currency', 'rex_day_of_month', 'rex_is_active'])
            .from('amb_recurring_expenses', 'rex')
            .where('rex.ent_id = :entityId', { entityId })
            .andWhere('rex.rex_deleted_at IS NULL')
            .orderBy('rex.rex_day_of_month', 'ASC')
            .getRawMany();

          const recurringList = recurringExpenses.length > 0
            ? recurringExpenses.map((r) =>
              `- ${r.rex_name}: ${Number(r.rex_amount).toLocaleString()} ${r.rex_currency} (매월 ${r.rex_day_of_month}일, ${r.rex_vendor || '-'}, ${r.rex_is_active ? '활성' : '비활성'})`,
            ).join('\n')
            : '등록된 정기 지출 없음';

          const today = new Date().toISOString().split('T')[0];

          const systemPrompt = `You are an expert accounting AI assistant for a company's financial management system.
You have access to the company's real-time accounting data provided below. Use this data to answer questions, write reports, and provide financial insights.

## Current Accounting Data (as of ${today})

### Account Balances
${accountSummary}

### Total by Currency
${balanceSummary}

### Monthly Stats (Last 6 Months)
${monthlySummary}

### Recent Transactions (Last 30 Days, Latest 50)
Date | Account | Vendor | Amount | Description
${recentTxnSummary}

### Recurring Expenses
${recurringList}

## Instructions
- Always respond in Korean
- Use markdown formatting for reports and analysis
- Be specific with numbers - reference the actual data above
- When writing reports, use professional financial language
- If asked about data you don't have, clearly state what information is missing
- You can help with: financial reports, expense analysis, cash flow analysis, budget planning, vendor analysis, anomaly detection, forecasting
- For complex analyses, structure your response with clear headings and sections`;

          const messages = [
            ...history,
            { role: 'user' as const, content: message },
          ];

          const stream$ = this.claudeService.streamMessage(
            systemPrompt,
            messages,
            { entId: entityId, usrId: userId, sourceType: 'ACCOUNTING_CHAT' },
          );

          stream$.subscribe({
            next: (event: ClaudeStreamEvent) => {
              if (event.type === 'content' && event.content) {
                subscriber.next({ type: 'content', content: event.content });
              } else if (event.type === 'done') {
                subscriber.next({ type: 'done', content: '' });
              } else if (event.type === 'error') {
                subscriber.next({ type: 'error', content: event.error || 'Unknown error' });
              }
            },
            error: (err) => {
              subscriber.next({ type: 'error', content: err.message || 'Stream error' });
              subscriber.complete();
            },
            complete: () => subscriber.complete(),
          });
        } catch (err) {
          subscriber.next({ type: 'error', content: err instanceof Error ? err.message : 'Internal error' });
          subscriber.complete();
        }
      })();
    });
  }

  // ─── Helper ──────────────────────────────────────────────

  private async getAccountBalanceInfo(
    accountId: string,
    openingBalance: number,
  ): Promise<{ currentBalance: number; lastTransactionDate: string | null }> {
    const lastTxn = await this.transactionRepo
      .createQueryBuilder('txn')
      .where('txn.bac_id = :accountId', { accountId })
      .andWhere('txn.txn_deleted_at IS NULL')
      .orderBy('txn.txn_date', 'DESC')
      .addOrderBy('txn.txn_created_at', 'DESC')
      .getOne();

    if (!lastTxn) {
      return { currentBalance: openingBalance, lastTransactionDate: null };
    }

    return {
      currentBalance: Number(lastTxn.txnCumulativeBalance),
      lastTransactionDate: lastTxn.txnDate,
    };
  }
}
