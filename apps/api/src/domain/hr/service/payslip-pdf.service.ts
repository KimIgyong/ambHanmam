import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { PayrollDetailEntity } from '../entity/payroll-detail.entity';
import { PayrollPeriodEntity } from '../entity/payroll-period.entity';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class PayslipPdfService {
  constructor(
    @InjectRepository(PayrollDetailEntity)
    private readonly detailRepo: Repository<PayrollDetailEntity>,
    @InjectRepository(PayrollPeriodEntity)
    private readonly periodRepo: Repository<PayrollPeriodEntity>,
  ) {}

  async generatePayslip(periodId: string, empId: string): Promise<Buffer> {
    const period = await this.periodRepo.findOne({ where: { pypId: periodId } });
    if (!period) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }

    const detail = await this.detailRepo.findOne({
      where: { pypId: periodId, empId },
      relations: ['employee'],
    });
    if (!detail) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }

    return this.buildPdf(period, detail);
  }

  private buildPdf(period: PayrollPeriodEntity, detail: PayrollDetailEntity): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fmt = (n: number) => Math.round(Number(n)).toLocaleString('vi-VN');
      const monthStr = `${String(period.pypMonth).padStart(2, '0')}/${period.pypYear}`;

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('AMOEBA COMPANY', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`PAYSLIP - ${monthStr}`, { align: 'center' });
      doc.moveDown(0.5);

      // Divider
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Employee Info
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Employee: ${detail.employee?.empFullName || ''}`);
      doc.font('Helvetica');
      doc.text(`Code: ${detail.employee?.empCode || ''}`);
      doc.text(`Department: ${detail.employee?.empDepartment || ''}`);
      if (period.pypPaymentDate) {
        doc.text(`Payment Date: ${period.pypPaymentDate}`);
      }
      doc.moveDown(0.5);

      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Helper for two-column rows
      const addRow = (label: string, value: string, bold = false) => {
        const y = doc.y;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
        doc.text(label, 50, y, { width: 280, continued: false });
        doc.text(value, 350, y, { width: 180, align: 'right' });
        doc.moveDown(0.2);
      };

      // Section: Earnings
      doc.font('Helvetica-Bold').fontSize(10).text('EARNINGS', 50);
      doc.moveDown(0.3);

      addRow('Working Days (Standard / Actual)', `${detail.pydStandardWorkingDays} / ${Number(detail.pydActualWorkingDays)}`);
      addRow('Base Salary', fmt(detail.pydBaseSalary));
      addRow('Actual Salary', fmt(detail.pydActualSalary));
      addRow('Meal Allowance', fmt(detail.pydMealAllowance));
      addRow('CSKH Allowance', fmt(detail.pydCskhAllowance));
      addRow('Fuel Allowance', fmt(detail.pydFuelAllowance));
      addRow('Other Allowance', fmt(detail.pydOtherAllowance));
      addRow('Total Income', fmt(detail.pydTotalIncome), true);

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Section: Deductions - Insurance
      doc.font('Helvetica-Bold').fontSize(10).text('DEDUCTIONS - INSURANCE', 50);
      doc.moveDown(0.3);

      addRow('Employee SI (8%)', fmt(detail.pydEmployeeSi));
      addRow('Employee HI (1.5%)', fmt(detail.pydEmployeeHi));
      addRow('Employee UI (1%)', fmt(detail.pydEmployeeUi));
      addRow('Total Employee Insurance', fmt(detail.pydTotalEmployeeInsurance), true);

      doc.moveDown(0.3);

      // Section: Deductions - Tax
      doc.font('Helvetica-Bold').fontSize(10).text('DEDUCTIONS - TAX', 50);
      doc.moveDown(0.3);

      addRow('Self Deduction', fmt(detail.pydSelfDeduction));
      addRow(`Dependent Deduction (${detail.pydNumDependents} persons)`, fmt(detail.pydDependentDeduction));
      addRow('Tax-exempt Income', fmt(detail.pydTaxExemptIncome));
      addRow('Taxable Income', fmt(detail.pydTaxableIncome));
      addRow('PIT Amount', fmt(detail.pydPitAmount), true);

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Section: Extras
      if (Number(detail.pydOtAmount) > 0 || Number(detail.pydBonus) > 0 || Number(detail.pydAdjustment) > 0) {
        doc.font('Helvetica-Bold').fontSize(10).text('EXTRAS', 50);
        doc.moveDown(0.3);
        if (Number(detail.pydOtAmount) > 0) addRow('Overtime', fmt(detail.pydOtAmount));
        if (Number(detail.pydAnnualLeaveSalary) > 0) addRow('Annual Leave Salary', fmt(detail.pydAnnualLeaveSalary));
        if (Number(detail.pydBonus) > 0) addRow('Bonus', fmt(detail.pydBonus));
        if (Number(detail.pydAdjustment) !== 0) addRow('Adjustment', fmt(detail.pydAdjustment));
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);
      }

      // Net Salary
      doc.font('Helvetica-Bold').fontSize(12).text('NET SALARY', 50);
      doc.font('Helvetica-Bold').fontSize(14).text(`${fmt(detail.pydNetSalaryVnd)} VND`, 350, doc.y - 16, { width: 180, align: 'right' });
      doc.moveDown(1);

      // Company Insurance Info (for reference)
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(8).fillColor('#888888');
      doc.text('Company Insurance Contribution (for reference):', 50);
      doc.text(
        `SI: ${fmt(detail.pydCompanySiSickness)} + ${fmt(detail.pydCompanySiAccident)} + ${fmt(detail.pydCompanySiRetirement)} | HI: ${fmt(detail.pydCompanyHi)} | UI: ${fmt(detail.pydCompanyUi)} | Union: ${fmt(detail.pydCompanyUnion)} | Total: ${fmt(detail.pydTotalCompanyInsurance)}`,
        50,
      );

      doc.moveDown(2);
      doc.fillColor('#000000').fontSize(8).text('This is a computer-generated document.', { align: 'center' });

      doc.end();
    });
  }
}
