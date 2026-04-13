import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseExecutionEntity } from '../entity/expense-execution.entity';
import { MonthlyReportQueryDto } from '../dto/expense-report.dto';
import * as ExcelJS from 'exceljs';

export interface MonthlyReportResult {
  year: number;
  month: number;
  totalCount: number;
  totalAmount: number;
  executedCount: number;
  executedAmount: number;
  byCategory: { category: string; count: number; totalAmount: number }[];
  items: {
    requestId: string;
    requestNumber: string;
    title: string;
    requesterName: string;
    category: string;
    amount: number;
    executionDate: string | Date;
    approver1Name: string | null;
    approver2Name: string | null;
  }[];
}

@Injectable()
export class ExpenseReportService {
  constructor(
    @InjectRepository(ExpenseExecutionEntity)
    private readonly executionRepo: Repository<ExpenseExecutionEntity>,
  ) {}

  async getMonthlyReport(entityId: string, query: MonthlyReportQueryDto): Promise<MonthlyReportResult> {
    const { year, month } = query;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const executions = await this.executionRepo
      .createQueryBuilder('ex')
      .innerJoinAndSelect('ex.request', 'req')
      .where('req.entId = :entityId', { entityId })
      .andWhere('ex.exdExecutedAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('ex.exdExecutedAt', 'ASC')
      .getMany();

    // 집계
    const byCurrencyMap = new Map<string, { approvedAmount: number; executedAmount: number; count: number }>();
    const byCategoryMap = new Map<string, { count: number; approvedAmount: number; executedAmount: number }>();
    const byMethodMap = new Map<string, { amount: number; count: number }>();

    for (const ex of executions) {
      const req = ex.request;
      // 통화별
      const cur = ex.exdCurrency;
      if (!byCurrencyMap.has(cur)) byCurrencyMap.set(cur, { approvedAmount: 0, executedAmount: 0, count: 0 });
      const curEntry = byCurrencyMap.get(cur)!;
      curEntry.approvedAmount += Number(req.exrTotalAmount);
      curEntry.executedAmount += Number(ex.exdAmount);
      curEntry.count++;

      // 카테고리별
      const cat = req.exrCategory;
      if (!byCategoryMap.has(cat)) byCategoryMap.set(cat, { count: 0, approvedAmount: 0, executedAmount: 0 });
      const catEntry = byCategoryMap.get(cat)!;
      catEntry.count++;
      catEntry.approvedAmount += Number(req.exrTotalAmount);
      catEntry.executedAmount += Number(ex.exdAmount);

      // 방법별
      const method = ex.exdMethod;
      if (!byMethodMap.has(method)) byMethodMap.set(method, { amount: 0, count: 0 });
      const mEntry = byMethodMap.get(method)!;
      mEntry.amount += Number(ex.exdAmount);
      mEntry.count++;
    }

    const totalExecutedAmount = executions.reduce((sum, ex) => sum + Number(ex.exdAmount), 0);

    return {
      year,
      month,
      totalCount: executions.length,
      totalAmount: totalExecutedAmount,
      executedCount: executions.length,
      executedAmount: totalExecutedAmount,
      byCategory: Array.from(byCategoryMap.entries()).map(([category, v]) => ({
        category,
        count: v.count,
        totalAmount: v.executedAmount,
      })),
      items: executions.map((ex) => ({
        requestId: ex.request.exrId,
        requestNumber: ex.request.exrNumber || '',
        title: ex.request.exrTitle,
        requesterName: '',
        category: ex.request.exrCategory,
        amount: Number(ex.exdAmount),
        executionDate: ex.exdExecutedAt,
        approver1Name: null,
        approver2Name: null,
      })),
    };
  }

  async exportMonthlyReportToExcel(entityId: string, query: MonthlyReportQueryDto): Promise<ExcelJS.Buffer> {
    const report = await this.getMonthlyReport(entityId, query);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`${query.year}년 ${query.month}월 실적`);

    // 제목
    ws.mergeCells('A1', 'H1');
    ws.getCell('A1').value = `${query.year}년 ${query.month}월 지출 실적 리포트`;
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    // 헤더
    const headerRow = ws.addRow(['번호', '결의서번호', '제목', '카테고리', '집행일', '집행금액', '통화', '집행방법', '증빙유형']);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    headerRow.eachCell((cell) => {
      cell.border = { bottom: { style: 'thin' } };
    });

    // 데이터
    report.items.forEach((item, idx) => {
      ws.addRow([
        idx + 1,
        item.requestNumber,
        item.title,
        item.category,
        item.executionDate,
        item.amount,
        '',
        '',
        '',
      ]);
    });

    ws.getColumn(6).numFmt = '#,##0.00';
    ws.columns = [
      { width: 5 }, { width: 20 }, { width: 30 }, { width: 15 },
      { width: 12 }, { width: 15 }, { width: 8 }, { width: 12 }, { width: 15 },
    ];

    return wb.xlsx.writeBuffer();
  }
}
