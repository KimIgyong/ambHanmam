import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { PayrollEntryKrEntity } from '../entity/payroll-entry-kr.entity';
import { PayrollPeriodEntity } from '../entity/payroll-period.entity';
import { BusinessIncomeEntity } from '../entity/business-income.entity';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class KrReportService {
  constructor(
    @InjectRepository(PayrollEntryKrEntity)
    private readonly krEntryRepo: Repository<PayrollEntryKrEntity>,
    @InjectRepository(PayrollPeriodEntity)
    private readonly periodRepo: Repository<PayrollPeriodEntity>,
    @InjectRepository(BusinessIncomeEntity)
    private readonly bipRepo: Repository<BusinessIncomeEntity>,
  ) {}

  // ── 급여대장 Excel (KR) ──
  async generateKrPayrollRegister(periodId: string): Promise<ExcelJS.Buffer> {
    const { period, entries } = await this.getKrPeriodEntries(periodId);
    const monthStr = `${period.pypYear}-${String(period.pypMonth).padStart(2, '0')}`;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`급여대장 ${monthStr}`);

    // Title
    ws.mergeCells('A1', 'AC1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `급여대장 — ${monthStr}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Headers (A~AC = 29 columns)
    const headers = [
      'No', '코드', '성명', '부서',
      '기본급', '연장수당', '휴일수당', '야간수당', '기타수당', '연차수당', '상여',
      '자가운전', '식대', '보육수당',
      '과세합계', '비과세합계', '지급합계',
      '국민연금', '건강보험', '장기요양', '고용보험',
      '연금정산', '건강정산', '장기정산', '고용정산',
      '소득세', '지방소득세',
      '공제합계', '차인지급액',
    ];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, size: 9 };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      cell.border = { bottom: { style: 'thin' } };
    });

    // Data rows
    entries.forEach((e, i) => {
      ws.addRow([
        i + 1,
        e.employee?.empCode || '',
        e.employee?.empFullName || '',
        e.employee?.empDepartment || '',
        Number(e.pkrBasePay),
        Number(e.pkrOtExtend),
        Number(e.pkrOtHoliday),
        Number(e.pkrOtNight),
        Number(e.pkrOtEtc),
        Number(e.pkrAnnualLeave),
        Number(e.pkrBonus),
        Number(e.pkrVehicleSub),
        Number(e.pkrMealAllow),
        Number(e.pkrChildcare),
        Number(e.pkrTaxableTotal),
        Number(e.pkrExemptTotal),
        Number(e.pkrGrossTotal),
        Number(e.pkrPension),
        Number(e.pkrHealthIns),
        Number(e.pkrLongtermCare),
        Number(e.pkrEmployIns),
        Number(e.pkrPensionSettle),
        Number(e.pkrHealthSettle),
        Number(e.pkrLongtermSettle),
        Number(e.pkrEmploySettle),
        Number(e.pkrIncomeTax),
        Number(e.pkrLocalTax),
        Number(e.pkrDeductionTotal),
        Number(e.pkrNetPay),
      ]);
    });

    // Column widths + number format
    ws.getColumn(1).width = 4;
    ws.getColumn(2).width = 8;
    ws.getColumn(3).width = 10;
    ws.getColumn(4).width = 8;
    for (let col = 5; col <= 29; col++) {
      ws.getColumn(col).numFmt = '#,##0';
      ws.getColumn(col).width = 12;
    }

    // Totals row
    const sum = (field: keyof PayrollEntryKrEntity) =>
      entries.reduce((s, e) => s + Number(e[field]), 0);
    const totalsData = [
      '', '', '합계', '',
      sum('pkrBasePay'), sum('pkrOtExtend'), sum('pkrOtHoliday'), sum('pkrOtNight'),
      sum('pkrOtEtc'), sum('pkrAnnualLeave'), sum('pkrBonus'),
      sum('pkrVehicleSub'), sum('pkrMealAllow'), sum('pkrChildcare'),
      sum('pkrTaxableTotal'), sum('pkrExemptTotal'), sum('pkrGrossTotal'),
      sum('pkrPension'), sum('pkrHealthIns'), sum('pkrLongtermCare'), sum('pkrEmployIns'),
      sum('pkrPensionSettle'), sum('pkrHealthSettle'), sum('pkrLongtermSettle'), sum('pkrEmploySettle'),
      sum('pkrIncomeTax'), sum('pkrLocalTax'),
      sum('pkrDeductionTotal'), sum('pkrNetPay'),
    ];
    const totalsRow = ws.addRow(totalsData);
    totalsRow.font = { bold: true };
    totalsRow.eachCell((cell) => {
      cell.border = { top: { style: 'double' } };
    });

    return wb.xlsx.writeBuffer();
  }

  // ── 4대보험 집계표 Excel ──
  async generateKrInsuranceSummary(periodId: string): Promise<ExcelJS.Buffer> {
    const { period, entries } = await this.getKrPeriodEntries(periodId);
    const monthStr = `${period.pypYear}-${String(period.pypMonth).padStart(2, '0')}`;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`4대보험 ${monthStr}`);

    ws.mergeCells('A1', 'H1');
    ws.getCell('A1').value = `4대보험 집계표 — ${monthStr}`;
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    const headers = [
      'No', '코드', '성명', '과세합계',
      '국민연금', '건강보험', '장기요양', '고용보험', '보험합계',
    ];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, size: 10 };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    });

    entries.forEach((e, i) => {
      const insTotal = Number(e.pkrPension) + Number(e.pkrHealthIns) +
        Number(e.pkrLongtermCare) + Number(e.pkrEmployIns);
      ws.addRow([
        i + 1,
        e.employee?.empCode || '',
        e.employee?.empFullName || '',
        Number(e.pkrTaxableTotal),
        Number(e.pkrPension),
        Number(e.pkrHealthIns),
        Number(e.pkrLongtermCare),
        Number(e.pkrEmployIns),
        insTotal,
      ]);
    });

    ws.getColumn(1).width = 4;
    ws.getColumn(2).width = 8;
    ws.getColumn(3).width = 12;
    for (let col = 4; col <= 9; col++) {
      ws.getColumn(col).numFmt = '#,##0';
      ws.getColumn(col).width = 14;
    }

    // Totals
    const sum = (field: keyof PayrollEntryKrEntity) =>
      entries.reduce((s, e) => s + Number(e[field]), 0);
    const totRow = ws.addRow([
      '', '', '합계',
      sum('pkrTaxableTotal'),
      sum('pkrPension'), sum('pkrHealthIns'), sum('pkrLongtermCare'), sum('pkrEmployIns'),
      sum('pkrPension') + sum('pkrHealthIns') + sum('pkrLongtermCare') + sum('pkrEmployIns'),
    ]);
    totRow.font = { bold: true };
    totRow.eachCell((cell) => { cell.border = { top: { style: 'double' } }; });

    return wb.xlsx.writeBuffer();
  }

  // ── 사업소득 지급대장 Excel ──
  async generateBusinessIncomeRegister(entityId: string, yearMonth: string): Promise<ExcelJS.Buffer> {
    const payments = await this.bipRepo.find({
      where: { entId: entityId, bipYearMonth: yearMonth },
      relations: ['freelancer'],
      order: { bipCreatedAt: 'ASC' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`사업소득 ${yearMonth}`);

    ws.mergeCells('A1', 'N1');
    ws.getCell('A1').value = `사업소득 지급대장 — ${yearMonth}`;
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    const headers = [
      'No', '코드', '성명', '지급일',
      '지급액', '주휴수당', '인센티브', '총급여', '기지급금',
      '소득세', '지방소득세', '고용보험', '공제합계', '차인지급액',
    ];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, size: 10 };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    });

    payments.forEach((p, i) => {
      ws.addRow([
        i + 1,
        p.freelancer?.frlCode || '',
        p.freelancer?.frlFullName || '',
        p.bipPaymentDate || '',
        Number(p.bipGrossAmount),
        Number(p.bipWeeklyHoliday),
        Number(p.bipIncentive),
        Number(p.bipTotalAmount),
        Number(p.bipPrepaid),
        Number(p.bipIncomeTax),
        Number(p.bipLocalTax),
        Number(p.bipEmployIns),
        Number(p.bipDeductionTotal),
        Number(p.bipNetAmount),
      ]);
    });

    ws.getColumn(1).width = 4;
    ws.getColumn(2).width = 8;
    ws.getColumn(3).width = 12;
    ws.getColumn(4).width = 11;
    for (let col = 5; col <= 14; col++) {
      ws.getColumn(col).numFmt = '#,##0';
      ws.getColumn(col).width = 13;
    }

    // Totals
    const s = (field: keyof BusinessIncomeEntity) =>
      payments.reduce((acc, p) => acc + Number(p[field]), 0);
    const totRow = ws.addRow([
      '', '', '합계', '',
      s('bipGrossAmount'), s('bipWeeklyHoliday'), s('bipIncentive'),
      s('bipTotalAmount'), s('bipPrepaid'),
      s('bipIncomeTax'), s('bipLocalTax'), s('bipEmployIns'),
      s('bipDeductionTotal'), s('bipNetAmount'),
    ]);
    totRow.font = { bold: true };
    totRow.eachCell((cell) => { cell.border = { top: { style: 'double' } }; });

    return wb.xlsx.writeBuffer();
  }

  // ── 세무사 연동 엑셀 ──
  async generateTaxAccountantExcel(periodId: string, entityId: string, yearMonth: string): Promise<ExcelJS.Buffer> {
    const { period, entries } = await this.getKrPeriodEntries(periodId);
    const monthStr = `${period.pypYear}-${String(period.pypMonth).padStart(2, '0')}`;

    const bipPayments = await this.bipRepo.find({
      where: { entId: entityId, bipYearMonth: yearMonth },
      relations: ['freelancer'],
    });

    const wb = new ExcelJS.Workbook();

    // Sheet 1: 직원 급여
    const ws1 = wb.addWorksheet('직원급여');
    ws1.addRow(['코드', '성명', '과세합계', '국민연금', '건강보험', '장기요양', '고용보험', '소득세', '지방소득세', '차인지급액']);
    ws1.getRow(1).font = { bold: true };
    entries.forEach((e) => {
      ws1.addRow([
        e.employee?.empCode || '',
        e.employee?.empFullName || '',
        Number(e.pkrTaxableTotal),
        Number(e.pkrPension),
        Number(e.pkrHealthIns),
        Number(e.pkrLongtermCare),
        Number(e.pkrEmployIns),
        Number(e.pkrIncomeTax),
        Number(e.pkrLocalTax),
        Number(e.pkrNetPay),
      ]);
    });
    for (let col = 3; col <= 10; col++) {
      ws1.getColumn(col).numFmt = '#,##0';
      ws1.getColumn(col).width = 14;
    }
    ws1.getColumn(1).width = 8;
    ws1.getColumn(2).width = 12;

    // Sheet 2: 사업소득
    const ws2 = wb.addWorksheet('사업소득');
    ws2.addRow(['코드', '성명', '총급여', '소득세', '지방소득세', '고용보험', '공제합계', '차인지급액']);
    ws2.getRow(1).font = { bold: true };
    bipPayments.forEach((p) => {
      ws2.addRow([
        p.freelancer?.frlCode || '',
        p.freelancer?.frlFullName || '',
        Number(p.bipTotalAmount),
        Number(p.bipIncomeTax),
        Number(p.bipLocalTax),
        Number(p.bipEmployIns),
        Number(p.bipDeductionTotal),
        Number(p.bipNetAmount),
      ]);
    });
    for (let col = 3; col <= 8; col++) {
      ws2.getColumn(col).numFmt = '#,##0';
      ws2.getColumn(col).width = 14;
    }
    ws2.getColumn(1).width = 8;
    ws2.getColumn(2).width = 12;

    return wb.xlsx.writeBuffer();
  }

  private async getKrPeriodEntries(periodId: string) {
    const period = await this.periodRepo.findOne({ where: { pypId: periodId } });
    if (!period) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }
    const entries = await this.krEntryRepo.find({
      where: { pypId: periodId },
      relations: ['employee'],
      order: { employee: { empCode: 'ASC' } },
    });
    return { period, entries };
  }
}
