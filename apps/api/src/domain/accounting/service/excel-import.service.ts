import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { BankAccountEntity } from '../entity/bank-account.entity';
import { TransactionEntity } from '../entity/transaction.entity';
import { AccountingService } from './accounting.service';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

interface SheetParseResult {
  accountNumber: string;
  bankName: string;
  branchName: string | null;
  currency: string;
  openingBalance: number;
  openingDate: string | null;
  transactions: ParsedTransaction[];
}

interface ParsedTransaction {
  seqNo: number;
  date: string;
  projectName: string | null;
  netValue: number;
  vat: number;
  bankCharge: number;
  vendor: string | null;
  description: string | null;
}

@Injectable()
export class ExcelImportService {
  constructor(
    @InjectRepository(BankAccountEntity)
    private readonly accountRepo: Repository<BankAccountEntity>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    private readonly accountingService: AccountingService,
  ) {}

  async importExcel(
    buffer: Buffer,
    userId: string,
    entityId: string,
  ): Promise<{ accountsCreated: number; transactionsImported: number; sheets: string[] }> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as any);
    } catch {
      throw new HttpException(ERROR_CODE.EXCEL_PARSE_ERROR, HttpStatus.BAD_REQUEST);
    }

    let accountsCreated = 0;
    let transactionsImported = 0;
    const sheets: string[] = [];

    for (const worksheet of workbook.worksheets) {
      try {
        const parsed = this.parseSheet(worksheet);
        if (!parsed || parsed.transactions.length === 0) continue;

        sheets.push(worksheet.name);

        // Find or create account (scoped to entity)
        let account = await this.accountRepo.findOne({
          where: { bacAccountNumber: parsed.accountNumber, entId: entityId, bacDeletedAt: IsNull() },
        });

        if (!account) {
          account = this.accountRepo.create({
            entId: entityId,
            usrId: userId,
            bacBankName: parsed.bankName,
            bacBranchName: parsed.branchName,
            bacAccountNumber: parsed.accountNumber,
            bacAccountAlias: `${parsed.bankName.split(' - ')[0]} ${parsed.currency}`,
            bacCurrency: parsed.currency,
            bacOpeningBalance: parsed.openingBalance,
            bacOpeningDate: parsed.openingDate,
          });
          account = await this.accountRepo.save(account);
          accountsCreated++;
        }

        // Delete existing transactions and replace with new data
        await this.deleteExistingTransactions(account.bacId);
        const imported = await this.importTransactionsToAccount(
          parsed.transactions,
          account.bacId,
          userId,
        );
        transactionsImported += imported;

        // Recalculate cumulative balance
        await this.accountingService.recalculateCumulativeBalance(account.bacId);
      } catch (e) {
        // Skip sheets with errors, continue with others
        console.error(`Error parsing sheet "${worksheet.name}":`, e);
      }
    }

    return { accountsCreated, transactionsImported, sheets };
  }

  async importTransactionsForAccount(
    buffer: Buffer,
    accountId: string,
    userId: string,
    entityId: string,
  ): Promise<{ transactionsImported: number }> {
    const account = await this.accountRepo.findOne({
      where: { bacId: accountId, entId: entityId, bacDeletedAt: IsNull() },
    });
    if (!account) {
      throw new HttpException(ERROR_CODE.ACCOUNT_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(buffer as any);
    } catch {
      throw new HttpException(ERROR_CODE.EXCEL_PARSE_ERROR, HttpStatus.BAD_REQUEST);
    }

    if (workbook.worksheets.length === 0) {
      throw new HttpException(ERROR_CODE.EXCEL_INVALID_FORMAT, HttpStatus.BAD_REQUEST);
    }

    let transactionsImported = 0;

    // Try to find a sheet matching this account's account number
    let matchedParsed: SheetParseResult | null = null;
    for (const worksheet of workbook.worksheets) {
      const parsed = this.parseSheet(worksheet);
      if (parsed && parsed.accountNumber === account.bacAccountNumber) {
        matchedParsed = parsed;
        break;
      }
    }

    // Fallback: if only one sheet or no match, use the first sheet
    if (!matchedParsed) {
      const parsed = this.parseSheet(workbook.worksheets[0]);
      if (parsed) matchedParsed = parsed;
    }

    if (matchedParsed && matchedParsed.transactions.length > 0) {
      // Delete existing transactions and replace with new data
      await this.deleteExistingTransactions(accountId);
      transactionsImported = await this.importTransactionsToAccount(
        matchedParsed.transactions,
        accountId,
        userId,
      );
      await this.accountingService.recalculateCumulativeBalance(accountId);
    }

    return { transactionsImported };
  }

  private parseSheet(worksheet: ExcelJS.Worksheet): SheetParseResult | null {
    const sheetName = worksheet.name;

    // Extract currency from sheet name suffix
    let currency = 'VND';
    if (sheetName.includes('_USD')) {
      currency = 'USD';
    } else if (sheetName.includes('_Capital')) {
      currency = 'VND'; // Capital accounts default to VND
    } else if (sheetName.includes('_KRW')) {
      currency = 'KRW';
    }

    // Row 5: Bank name (column E, shifted +1 due to seq_no column A)
    const bankNameRaw = this.getCellValue(worksheet, 5, 5);
    if (!bankNameRaw) return null;

    const bankNameStr = String(bankNameRaw);
    let bankName = bankNameStr;
    let branchName: string | null = null;

    // Split "SHINHAN BANK - SAI GON BRANCH" into bank name and branch
    const dashIndex = bankNameStr.indexOf(' - ');
    if (dashIndex > 0) {
      bankName = bankNameStr.substring(0, dashIndex).trim();
      branchName = bankNameStr.substring(dashIndex + 3).trim();
    }

    // Row 6: Account number (column E, shifted +1)
    const accountNumberRaw = this.getCellValue(worksheet, 6, 5);
    if (!accountNumberRaw) return null;
    const accountNumber = String(accountNumberRaw).replace(/^Account No\s*:\s*/i, '').trim();

    // Row 8: Opening date (column B, shifted +1) and opening balance (column J)
    const openingDateRaw = this.getCellValue(worksheet, 8, 2);
    let openingDate: string | null = null;
    if (openingDateRaw) {
      const dateStr = String(openingDateRaw).replace(/^From\s+/i, '').trim();
      openingDate = this.parseDateString(dateStr);
    }

    const openingBalanceRaw = this.getCellValue(worksheet, 8, 10);
    const openingBalance = this.parseNumber(openingBalanceRaw);

    // Parse transactions from row 11 onwards
    const transactions: ParsedTransaction[] = [];
    const rowCount = worksheet.rowCount;

    for (let rowNum = 11; rowNum <= rowCount; rowNum++) {
      // Column A (1): Sequence number
      const seqRaw = this.getCellValue(worksheet, rowNum, 1);
      const seqNo = typeof seqRaw === 'number' ? seqRaw : parseInt(String(seqRaw), 10);
      if (!seqNo || isNaN(seqNo)) continue;

      // Column B (2): Transaction date
      const dateRaw = this.getCellValue(worksheet, rowNum, 2);
      if (!dateRaw) continue;

      const date = this.parseExcelDate(dateRaw);
      if (!date) continue;

      // Columns C-F shifted +1 from original
      const projectName = this.getCellStringOrNull(worksheet, rowNum, 3);
      const netValue = this.parseNumber(this.getCellValue(worksheet, rowNum, 4));
      const vat = this.parseNumber(this.getCellValue(worksheet, rowNum, 5));
      const bankCharge = this.parseNumber(this.getCellValue(worksheet, rowNum, 6));
      const vendor = this.getCellStringOrNull(worksheet, rowNum, 10);
      const description = this.getCellStringOrNull(worksheet, rowNum, 11);

      transactions.push({
        seqNo,
        date,
        projectName,
        netValue,
        vat,
        bankCharge,
        vendor,
        description,
      });
    }

    // Sort by sequence number to maintain Excel order
    transactions.sort((a, b) => a.seqNo - b.seqNo);

    return {
      accountNumber,
      bankName,
      branchName,
      currency,
      openingBalance,
      openingDate,
      transactions,
    };
  }

  private async deleteExistingTransactions(accountId: string): Promise<void> {
    await this.transactionRepo
      .createQueryBuilder()
      .delete()
      .from(TransactionEntity)
      .where('bac_id = :accountId', { accountId })
      .execute();
  }

  private async importTransactionsToAccount(
    transactions: ParsedTransaction[],
    accountId: string,
    userId: string,
  ): Promise<number> {
    const entities = transactions.map((txn) => {
      const totalValue = txn.netValue + txn.vat;
      const balance = totalValue + txn.bankCharge;

      return this.transactionRepo.create({
        bacId: accountId,
        usrId: userId,
        txnSeqNo: txn.seqNo,
        txnDate: txn.date,
        txnProjectName: txn.projectName,
        txnNetValue: txn.netValue,
        txnVat: txn.vat,
        txnBankCharge: txn.bankCharge,
        txnTotalValue: totalValue,
        txnBalance: balance,
        txnCumulativeBalance: 0,
        txnVendor: txn.vendor,
        txnDescription: txn.description,
      });
    });

    // Batch insert for performance
    const batchSize = 100;
    for (let i = 0; i < entities.length; i += batchSize) {
      await this.transactionRepo.save(entities.slice(i, i + batchSize));
    }

    return entities.length;
  }

  private getCellValue(worksheet: ExcelJS.Worksheet, row: number, col: number): unknown {
    const cell = worksheet.getCell(row, col);
    if (!cell) return null;
    // If it's a formula, use the result
    if (cell.formula || (cell as any).sharedFormula) {
      return cell.result !== undefined ? cell.result : cell.value;
    }
    return cell.value;
  }

  private getCellStringOrNull(worksheet: ExcelJS.Worksheet, row: number, col: number): string | null {
    const val = this.getCellValue(worksheet, row, col);
    if (val === null || val === undefined || val === '') return null;
    return String(val).trim();
  }

  private parseNumber(value: unknown): number {
    if (value === null || value === undefined || value === '' || value === '-') return 0;

    if (typeof value === 'number') return value;

    const str = String(value).trim();

    // Handle parenthesized negative numbers: (3,200,000) → -3200000
    const parenMatch = str.match(/^\((.+)\)$/);
    if (parenMatch) {
      const inner = parenMatch[1].replace(/,/g, '');
      return -parseFloat(inner) || 0;
    }

    // Remove commas and parse
    const cleaned = str.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private parseExcelDate(value: unknown): string | null {
    if (!value) return null;

    // If it's a Date object (common with exceljs)
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    // If it's a string, try to parse
    const str = String(value).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    return this.parseDateString(str);
  }

  private parseDateString(str: string): string | null {
    // DD/MM/YYYY format
    const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      return `${dmyMatch[3]}-${month}-${day}`;
    }

    // Try Date.parse as fallback
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }

    return null;
  }
}
