import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { PayrollDetailEntity } from '../entity/payroll-detail.entity';
import { PayrollPeriodEntity } from '../entity/payroll-period.entity';
import { EmployeeEntity } from '../entity/employee.entity';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class HrReportService {
  constructor(
    @InjectRepository(PayrollDetailEntity)
    private readonly detailRepo: Repository<PayrollDetailEntity>,
    @InjectRepository(PayrollPeriodEntity)
    private readonly periodRepo: Repository<PayrollPeriodEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  /** 급여대장 Excel */
  async generatePayrollRegister(periodId: string, entityId: string): Promise<ExcelJS.Buffer> {
    const { period, details } = await this.getPeriodWithDetails(periodId, entityId);
    const monthStr = `${String(period.pypMonth).padStart(2, '0')}-${period.pypYear}`;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Payroll ${monthStr}`);

    // Title
    ws.mergeCells('A1', 'N1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `PAYROLL REGISTER - ${monthStr}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Headers
    const headers = [
      'No', 'Code', 'Name', 'Dept', 'Base Salary', 'Actual Salary',
      'Allowances', 'Total Income', 'Emp Insurance', 'PIT',
      'OT + Extras', 'Net Salary (VND)', 'Working Days', 'Status',
    ];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, size: 10 };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.border = { bottom: { style: 'thin' } };
    });

    // Data rows
    details.forEach((d, i) => {
      const allowances = Number(d.pydMealAllowance) + Number(d.pydCskhAllowance) +
        Number(d.pydFuelAllowance) + Number(d.pydOtherAllowance);
      const extras = Number(d.pydOtAmount) + Number(d.pydAnnualLeaveSalary) +
        Number(d.pydBonus) + Number(d.pydAdjustment);

      const row = ws.addRow([
        i + 1,
        d.employee?.empCode || '',
        d.employee?.empFullName || '',
        d.employee?.empDepartment || '',
        Number(d.pydBaseSalary),
        Number(d.pydActualSalary),
        allowances,
        Number(d.pydTotalIncome),
        Number(d.pydTotalEmployeeInsurance),
        Number(d.pydPitAmount),
        extras,
        Number(d.pydNetSalaryVnd),
        `${Number(d.pydActualWorkingDays)}/${d.pydStandardWorkingDays}`,
        d.employee?.empStatus || '',
      ]);
      row.alignment = { vertical: 'middle' };
    });

    // Number format for currency columns
    [5, 6, 7, 8, 9, 10, 11, 12].forEach((col) => {
      ws.getColumn(col).numFmt = '#,##0';
      ws.getColumn(col).width = 16;
    });
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 10;
    ws.getColumn(3).width = 22;
    ws.getColumn(4).width = 14;
    ws.getColumn(13).width = 12;
    ws.getColumn(14).width = 12;

    // Totals row
    const totals = ws.addRow([
      '', '', 'TOTAL', '',
      details.reduce((s, d) => s + Number(d.pydBaseSalary), 0),
      details.reduce((s, d) => s + Number(d.pydActualSalary), 0),
      details.reduce((s, d) => s + Number(d.pydMealAllowance) + Number(d.pydCskhAllowance) + Number(d.pydFuelAllowance) + Number(d.pydOtherAllowance), 0),
      details.reduce((s, d) => s + Number(d.pydTotalIncome), 0),
      details.reduce((s, d) => s + Number(d.pydTotalEmployeeInsurance), 0),
      details.reduce((s, d) => s + Number(d.pydPitAmount), 0),
      details.reduce((s, d) => s + Number(d.pydOtAmount) + Number(d.pydAnnualLeaveSalary) + Number(d.pydBonus) + Number(d.pydAdjustment), 0),
      details.reduce((s, d) => s + Number(d.pydNetSalaryVnd), 0),
      '', '',
    ]);
    totals.font = { bold: true };
    totals.eachCell((cell) => {
      cell.border = { top: { style: 'double' } };
    });

    return wb.xlsx.writeBuffer();
  }

  /** 보험 내역 Excel */
  async generateInsuranceReport(periodId: string, entityId: string): Promise<ExcelJS.Buffer> {
    const { period, details } = await this.getPeriodWithDetails(periodId, entityId);
    const monthStr = `${String(period.pypMonth).padStart(2, '0')}-${period.pypYear}`;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Insurance ${monthStr}`);

    ws.mergeCells('A1', 'M1');
    ws.getCell('A1').value = `INSURANCE REPORT - ${monthStr}`;
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    const headers = [
      'No', 'Code', 'Name', 'SI Base', 'UI Base',
      'Co. SI', 'Co. HI', 'Co. UI', 'Co. Union', 'Co. Total',
      'Emp. SI', 'Emp. HI', 'Emp. UI', 'Emp. Total',
    ];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, size: 10 };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    });

    details.forEach((d, i) => {
      ws.addRow([
        i + 1,
        d.employee?.empCode || '',
        d.employee?.empFullName || '',
        Number(d.pydInsuranceBaseSi),
        Number(d.pydInsuranceBaseUi),
        Number(d.pydCompanySiSickness) + Number(d.pydCompanySiAccident) + Number(d.pydCompanySiRetirement),
        Number(d.pydCompanyHi),
        Number(d.pydCompanyUi),
        Number(d.pydCompanyUnion),
        Number(d.pydTotalCompanyInsurance),
        Number(d.pydEmployeeSi),
        Number(d.pydEmployeeHi),
        Number(d.pydEmployeeUi),
        Number(d.pydTotalEmployeeInsurance),
      ]);
    });

    for (let col = 4; col <= 14; col++) {
      ws.getColumn(col).numFmt = '#,##0';
      ws.getColumn(col).width = 14;
    }
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 10;
    ws.getColumn(3).width = 22;

    return wb.xlsx.writeBuffer();
  }

  /** PIT 세금 보고서 Excel */
  async generatePitReport(periodId: string, entityId: string): Promise<ExcelJS.Buffer> {
    const { period, details } = await this.getPeriodWithDetails(periodId, entityId);
    const monthStr = `${String(period.pypMonth).padStart(2, '0')}-${period.pypYear}`;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`PIT ${monthStr}`);

    ws.mergeCells('A1', 'J1');
    ws.getCell('A1').value = `PIT REPORT - ${monthStr}`;
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    const headers = [
      'No', 'Code', 'Name', 'Total Income', 'Emp. Insurance',
      'Self Deduction', 'Dep. Deduction', 'Tax-exempt', 'Taxable Income', 'PIT Amount',
    ];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, size: 10 };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    });

    details.forEach((d, i) => {
      ws.addRow([
        i + 1,
        d.employee?.empCode || '',
        d.employee?.empFullName || '',
        Number(d.pydTotalIncome),
        Number(d.pydTotalEmployeeInsurance),
        Number(d.pydSelfDeduction),
        Number(d.pydDependentDeduction),
        Number(d.pydTaxExemptIncome),
        Number(d.pydTaxableIncome),
        Number(d.pydPitAmount),
      ]);
    });

    for (let col = 4; col <= 10; col++) {
      ws.getColumn(col).numFmt = '#,##0';
      ws.getColumn(col).width = 16;
    }
    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 10;
    ws.getColumn(3).width = 22;

    return wb.xlsx.writeBuffer();
  }

  /** 직원 명부 Excel */
  async generateEmployeeRoster(entityId: string): Promise<ExcelJS.Buffer> {
    const employees = await this.employeeRepo.find({
      where: [
        { empStatus: 'OFFICIAL', entId: entityId },
        { empStatus: 'PROBATION', entId: entityId },
      ],
      order: { empCode: 'ASC' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Employee Roster');

    ws.mergeCells('A1', 'H1');
    ws.getCell('A1').value = 'EMPLOYEE ROSTER';
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    const headers = ['No', 'Code', 'Full Name', 'Department', 'Position', 'Start Date', 'Status', 'Region'];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true, size: 10 };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    });

    employees.forEach((emp, i) => {
      ws.addRow([
        i + 1,
        emp.empCode,
        emp.empFullName,
        emp.empDepartment,
        emp.empPosition || '',
        emp.empStartDate,
        emp.empStatus,
        emp.empRegion || '',
      ]);
    });

    ws.getColumn(1).width = 5;
    ws.getColumn(2).width = 10;
    ws.getColumn(3).width = 22;
    ws.getColumn(4).width = 16;
    ws.getColumn(5).width = 16;
    ws.getColumn(6).width = 12;
    ws.getColumn(7).width = 12;
    ws.getColumn(8).width = 10;

    return wb.xlsx.writeBuffer();
  }

  private async getPeriodWithDetails(periodId: string, entityId: string) {
    const period = await this.periodRepo.findOne({ where: { pypId: periodId, entId: entityId } });
    if (!period) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }

    const details = await this.detailRepo.find({
      where: { pypId: periodId },
      relations: ['employee'],
      order: { employee: { empCode: 'ASC' } },
    });

    return { period, details };
  }
}
