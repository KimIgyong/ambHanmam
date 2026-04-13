import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { PayrollEntryKrEntity } from '../entity/payroll-entry-kr.entity';
import { PayrollPeriodEntity } from '../entity/payroll-period.entity';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class KrPayslipPdfService {
  constructor(
    @InjectRepository(PayrollEntryKrEntity)
    private readonly krEntryRepo: Repository<PayrollEntryKrEntity>,
    @InjectRepository(PayrollPeriodEntity)
    private readonly periodRepo: Repository<PayrollPeriodEntity>,
  ) {}

  async generatePayslip(periodId: string, empId: string): Promise<Buffer> {
    const period = await this.periodRepo.findOne({ where: { pypId: periodId } });
    if (!period) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }

    const entry = await this.krEntryRepo.findOne({
      where: { pypId: periodId, empId },
      relations: ['employee'],
    });
    if (!entry) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }

    return this.buildPdf(period, entry);
  }

  private buildPdf(period: PayrollPeriodEntity, e: PayrollEntryKrEntity): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fmt = (n: number) => Math.round(Number(n)).toLocaleString('ko-KR');
      const monthStr = `${period.pypYear}-${String(period.pypMonth).padStart(2, '0')}`;

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('AMOEBA COMPANY', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`PAY STATEMENT - ${monthStr}`, { align: 'center' });
      doc.moveDown(0.5);

      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // Employee Info
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Employee: ${e.employee?.empFullName || ''}`);
      doc.font('Helvetica');
      doc.text(`Code: ${e.employee?.empCode || ''}`);
      doc.text(`Department: ${e.employee?.empDepartment || ''}`);
      if (period.pypPaymentDate) {
        doc.text(`Payment Date: ${period.pypPaymentDate}`);
      }
      doc.moveDown(0.5);

      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      const addRow = (label: string, value: string, bold = false) => {
        const y = doc.y;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
        doc.text(label, 50, y, { width: 280, continued: false });
        doc.text(value, 350, y, { width: 180, align: 'right' });
        doc.moveDown(0.2);
      };

      // Section: Earnings (지급 항목)
      doc.font('Helvetica-Bold').fontSize(10).text('EARNINGS', 50);
      doc.moveDown(0.3);

      addRow('Base Pay (기본급)', fmt(e.pkrBasePay));
      addRow('OT - Extended (연장수당)', fmt(e.pkrOtExtend));
      addRow('OT - Holiday (휴일수당)', fmt(e.pkrOtHoliday));
      addRow('OT - Night (야간수당)', fmt(e.pkrOtNight));
      addRow('OT - Other (기타수당)', fmt(e.pkrOtEtc));
      addRow('Annual Leave (연차수당)', fmt(e.pkrAnnualLeave));
      addRow('Bonus (상여)', fmt(e.pkrBonus));

      doc.moveDown(0.2);
      addRow('Taxable Total (과세합계)', fmt(e.pkrTaxableTotal), true);

      doc.moveDown(0.3);

      // Non-taxable
      doc.font('Helvetica-Bold').fontSize(10).text('NON-TAXABLE (비과세)', 50);
      doc.moveDown(0.3);

      addRow('Vehicle Subsidy (자가운전)', fmt(e.pkrVehicleSub));
      addRow('Meal Allowance (식대)', fmt(e.pkrMealAllow));
      addRow('Childcare (보육수당)', fmt(e.pkrChildcare));
      addRow('Non-taxable Total (비과세합계)', fmt(e.pkrExemptTotal), true);

      doc.moveDown(0.2);
      addRow('GROSS TOTAL (지급합계)', fmt(e.pkrGrossTotal), true);

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Section: Deductions - 4대보험
      doc.font('Helvetica-Bold').fontSize(10).text('DEDUCTIONS - INSURANCE (4대보험)', 50);
      doc.moveDown(0.3);

      addRow('National Pension (국민연금)', fmt(e.pkrPension));
      addRow('Health Insurance (건강보험)', fmt(e.pkrHealthIns));
      addRow('Long-term Care (장기요양)', fmt(e.pkrLongtermCare));
      addRow('Employment Ins. (고용보험)', fmt(e.pkrEmployIns));

      if (Number(e.pkrPensionSettle) || Number(e.pkrHealthSettle) ||
          Number(e.pkrLongtermSettle) || Number(e.pkrEmploySettle)) {
        doc.moveDown(0.2);
        addRow('Pension Settlement (연금정산)', fmt(e.pkrPensionSettle));
        addRow('Health Settlement (건강정산)', fmt(e.pkrHealthSettle));
        addRow('Longterm Settlement (장기정산)', fmt(e.pkrLongtermSettle));
        addRow('Employ Settlement (고용정산)', fmt(e.pkrEmploySettle));
      }

      doc.moveDown(0.3);

      // Section: Deductions - Tax
      doc.font('Helvetica-Bold').fontSize(10).text('DEDUCTIONS - TAX (세금)', 50);
      doc.moveDown(0.3);

      addRow('Income Tax (소득세)', fmt(e.pkrIncomeTax));
      addRow('Local Tax (지방소득세)', fmt(e.pkrLocalTax));

      if (Number(e.pkrYearendTax) || Number(e.pkrYearendLocal)) {
        addRow('Year-end Tax (연말정산 소득세)', fmt(e.pkrYearendTax));
        addRow('Year-end Local (연말정산 지방세)', fmt(e.pkrYearendLocal));
      }

      if (Number(e.pkrPrepaid)) {
        addRow('Prepaid (기지급)', fmt(e.pkrPrepaid));
      }

      doc.moveDown(0.2);
      addRow('Total Deduction (공제합계)', fmt(e.pkrDeductionTotal), true);

      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Net Pay
      doc.font('Helvetica-Bold').fontSize(12).text('NET PAY (차인지급액)', 50);
      doc.font('Helvetica-Bold').fontSize(14).text(
        `${fmt(e.pkrNetPay)} KRW`, 350, doc.y - 16,
        { width: 180, align: 'right' },
      );
      doc.moveDown(2);

      doc.fillColor('#000000').fontSize(8).text('This is a computer-generated document.', { align: 'center' });

      doc.end();
    });
  }
}
