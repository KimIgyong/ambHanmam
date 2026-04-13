import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { InvoiceEntity } from '../entity/invoice.entity';
import { ContractEntity } from '../entity/contract.entity';
import { PartnerEntity } from '../entity/partner.entity';
import { PaymentEntity } from '../entity/payment.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Injectable()
export class BillingReportService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepo: Repository<PartnerEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
  ) {}

  /**
   * Monthly revenue/cost summary for a given year
   */
  async getRevenueSummary(entityId: string, year: number) {
    const months: { month: number; receivable: number; payable: number; currency: string }[] = [];

    for (let m = 1; m <= 12; m++) {
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0); // last day of month
      const start = startDate.toISOString().substring(0, 10);
      const end = endDate.toISOString().substring(0, 10);

      const receivable = await this.invoiceRepo
        .createQueryBuilder('inv')
        .select('COALESCE(SUM(inv.invTotal), 0)', 'total')
        .addSelect('inv.invCurrency', 'currency')
        .where('inv.entId = :entityId', { entityId })
        .andWhere('inv.invDirection = :dir', { dir: 'RECEIVABLE' })
        .andWhere('inv.invDate >= :start AND inv.invDate <= :end', { start, end })
        .andWhere('inv.invStatus NOT IN (:...excluded)', { excluded: ['CANCELLED', 'VOID'] })
        .groupBy('inv.invCurrency')
        .getRawMany();

      const payable = await this.invoiceRepo
        .createQueryBuilder('inv')
        .select('COALESCE(SUM(inv.invTotal), 0)', 'total')
        .addSelect('inv.invCurrency', 'currency')
        .where('inv.entId = :entityId', { entityId })
        .andWhere('inv.invDirection = :dir', { dir: 'PAYABLE' })
        .andWhere('inv.invDate >= :start AND inv.invDate <= :end', { start, end })
        .andWhere('inv.invStatus NOT IN (:...excluded)', { excluded: ['CANCELLED', 'VOID'] })
        .groupBy('inv.invCurrency')
        .getRawMany();

      // Aggregate across currencies (simplified — first currency wins)
      const recTotal = receivable.reduce((s, r) => s + Number(r.total), 0);
      const payTotal = payable.reduce((s, r) => s + Number(r.total), 0);
      const currency = receivable[0]?.currency || payable[0]?.currency || 'USD';

      months.push({ month: m, receivable: recTotal, payable: payTotal, currency });
    }

    return months;
  }

  /**
   * Outstanding receivable/payable invoices
   */
  async getOutstandingReport(entityId: string) {
    const invoices = await this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.partner', 'partner')
      .where('inv.entId = :entityId', { entityId })
      .andWhere('inv.invStatus IN (:...statuses)', { statuses: ['ISSUED', 'SENT', 'OVERDUE'] })
      .orderBy('inv.invDueDate', 'ASC')
      .getMany();

    return invoices.map((inv) => ({
      invoiceId: inv.invId,
      number: inv.invNumber,
      direction: inv.invDirection,
      partnerName: inv.partner?.ptnCompanyName || '',
      date: inv.invDate,
      dueDate: inv.invDueDate,
      total: Number(inv.invTotal),
      paidAmount: Number(inv.invPaidAmount),
      outstanding: Number(inv.invTotal) - Number(inv.invPaidAmount),
      currency: inv.invCurrency,
      status: inv.invStatus,
      isOverdue: inv.invDueDate && inv.invDueDate < new Date().toISOString().substring(0, 10),
    }));
  }

  /**
   * Contract expiration timeline (next 6 months)
   */
  async getContractTimeline(entityId: string) {
    const today = new Date().toISOString().substring(0, 10);
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const endDate = sixMonthsLater.toISOString().substring(0, 10);

    const contracts = await this.contractRepo
      .createQueryBuilder('ctr')
      .leftJoinAndSelect('ctr.partner', 'partner')
      .where('ctr.entId = :entityId', { entityId })
      .andWhere('ctr.ctrStatus IN (:...statuses)', { statuses: ['ACTIVE', 'EXPIRING'] })
      .andWhere('ctr.ctrEndDate IS NOT NULL')
      .andWhere('ctr.ctrEndDate >= :today AND ctr.ctrEndDate <= :endDate', { today, endDate })
      .orderBy('ctr.ctrEndDate', 'ASC')
      .getMany();

    return contracts.map((ctr) => ({
      contractId: ctr.ctrId,
      title: ctr.ctrTitle,
      partnerName: ctr.partner?.ptnCompanyName || '',
      direction: ctr.ctrDirection,
      endDate: ctr.ctrEndDate,
      amount: Number(ctr.ctrAmount),
      currency: ctr.ctrCurrency,
      autoRenew: ctr.ctrAutoRenew,
      daysRemaining: Math.ceil((new Date(ctr.ctrEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    }));
  }

  /**
   * Partner type distribution
   */
  async getPartnerDistribution(entityId: string) {
    const result = await this.partnerRepo
      .createQueryBuilder('ptn')
      .select('ptn.ptnType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('ptn.entId = :entityId', { entityId })
      .andWhere('ptn.ptnStatus = :status', { status: 'ACTIVE' })
      .groupBy('ptn.ptnType')
      .getRawMany();

    return result.map((r) => ({ type: r.type, count: Number(r.count) }));
  }

  /**
   * Dashboard summary cards
   */
  async getDashboardSummary(entityId: string) {
    const today = new Date();
    const todayStr = today.toISOString().substring(0, 10);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().substring(0, 10);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().substring(0, 10);

    // This month's revenue
    const revenue = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.invTotal), 0)', 'total')
      .where('inv.entId = :entityId', { entityId })
      .andWhere('inv.invDirection = :dir', { dir: 'RECEIVABLE' })
      .andWhere('inv.invDate >= :start AND inv.invDate <= :end', { start: monthStart, end: monthEnd })
      .andWhere('inv.invStatus NOT IN (:...excluded)', { excluded: ['CANCELLED', 'VOID'] })
      .getRawOne();

    // Outstanding receivable
    const receivable = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.invTotal - inv.invPaidAmount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('inv.entId = :entityId', { entityId })
      .andWhere('inv.invDirection = :dir', { dir: 'RECEIVABLE' })
      .andWhere('inv.invStatus IN (:...statuses)', { statuses: ['ISSUED', 'SENT', 'OVERDUE'] })
      .getRawOne();

    // Outstanding payable
    const payable = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('COALESCE(SUM(inv.invTotal - inv.invPaidAmount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('inv.entId = :entityId', { entityId })
      .andWhere('inv.invDirection = :dir', { dir: 'PAYABLE' })
      .andWhere('inv.invStatus IN (:...statuses)', { statuses: ['ISSUED', 'SENT', 'OVERDUE'] })
      .getRawOne();

    // Expiring contracts (next 30 days)
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const expiringContracts = await this.contractRepo
      .createQueryBuilder('ctr')
      .where('ctr.entId = :entityId', { entityId })
      .andWhere('ctr.ctrStatus IN (:...statuses)', { statuses: ['ACTIVE', 'EXPIRING'] })
      .andWhere('ctr.ctrEndDate IS NOT NULL')
      .andWhere('ctr.ctrEndDate >= :today AND ctr.ctrEndDate <= :end', {
        today: todayStr,
        end: thirtyDaysLater.toISOString().substring(0, 10),
      })
      .getCount();

    // Overdue invoices count
    const overdueCount = await this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.entId = :entityId', { entityId })
      .andWhere('inv.invStatus = :status', { status: 'OVERDUE' })
      .getCount();

    return {
      monthlyRevenue: Number(revenue?.total) || 0,
      receivableOutstanding: Number(receivable?.total) || 0,
      receivableCount: Number(receivable?.count) || 0,
      payableOutstanding: Number(payable?.total) || 0,
      payableCount: Number(payable?.count) || 0,
      expiringContracts,
      overdueCount,
    };
  }

  /**
   * Export invoices to Excel
   */
  async exportInvoicesToExcel(entityId: string, params?: { year?: number; direction?: string }): Promise<ExcelJS.Buffer> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.partner', 'partner')
      .leftJoinAndSelect('inv.contract', 'contract')
      .where('inv.entId = :entityId', { entityId })
      .andWhere('inv.invStatus NOT IN (:...excluded)', { excluded: ['CANCELLED', 'VOID'] })
      .orderBy('inv.invDate', 'ASC');

    if (params?.year) {
      qb.andWhere('inv.invDate >= :start AND inv.invDate <= :end', {
        start: `${params.year}-01-01`,
        end: `${params.year}-12-31`,
      });
    }
    if (params?.direction) {
      qb.andWhere('inv.invDirection = :dir', { dir: params.direction });
    }

    const invoices = await qb.getMany();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Invoices');

    // Title
    ws.mergeCells('A1', 'J1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `Invoice Report${params?.year ? ` - ${params.year}` : ''}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Headers
    const headers = [
      'No.', 'Invoice No.', 'Date', 'Due Date', 'Partner',
      'Direction', 'Subtotal', 'Tax', 'Total', 'Status',
    ];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = { bottom: { style: 'thin' } };
    });

    // Data
    invoices.forEach((inv, idx) => {
      ws.addRow([
        idx + 1,
        inv.invNumber,
        inv.invDate,
        inv.invDueDate || '',
        inv.partner?.ptnCompanyName || '',
        inv.invDirection,
        Number(inv.invSubtotal),
        Number(inv.invTaxAmount),
        Number(inv.invTotal),
        inv.invStatus,
      ]);
    });

    // Column widths
    ws.columns = [
      { width: 5 }, { width: 20 }, { width: 12 }, { width: 12 }, { width: 25 },
      { width: 12 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 },
    ];

    // Number format for currency columns
    ws.getColumn(7).numFmt = '#,##0.00';
    ws.getColumn(8).numFmt = '#,##0.00';
    ws.getColumn(9).numFmt = '#,##0.00';

    return await wb.xlsx.writeBuffer();
  }

  /**
   * Monthly fee matrix — partner × month(1~12) pivot
   */
  async getMonthlyFeeMatrix(entityId: string, year: number) {
    const invoices = await this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.partner', 'partner')
      .where('inv.entId = :entityId', { entityId })
      .andWhere('inv.invDate >= :start AND inv.invDate <= :end', {
        start: `${year}-01-01`,
        end: `${year}-12-31`,
      })
      .andWhere('inv.invStatus NOT IN (:...excluded)', { excluded: ['CANCELLED', 'VOID'] })
      .orderBy('partner.ptnCompanyName', 'ASC')
      .getMany();

    // Group by partner
    const partnerMap = new Map<string, {
      partnerId: string;
      name: string;
      code: string;
      values: { month: number; receivable: number; payable: number }[];
    }>();

    for (const inv of invoices) {
      const pid = inv.ptnId;
      if (!partnerMap.has(pid)) {
        partnerMap.set(pid, {
          partnerId: pid,
          name: inv.partner?.ptnCompanyName || '',
          code: inv.partner?.ptnCode || '',
          values: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, receivable: 0, payable: 0 })),
        });
      }
      const entry = partnerMap.get(pid)!;
      const month = new Date(inv.invDate).getMonth(); // 0-based
      if (inv.invDirection === 'RECEIVABLE') {
        entry.values[month].receivable += Number(inv.invTotal);
      } else {
        entry.values[month].payable += Number(inv.invTotal);
      }
    }

    const data = Array.from(partnerMap.values());
    const partners = data.map((d) => ({ partnerId: d.partnerId, name: d.name, code: d.code }));

    return { partners, data: data.map((d) => ({ partnerId: d.partnerId, values: d.values })) };
  }

  /**
   * Export monthly matrix to Excel pivot sheet
   */
  async exportMonthlyMatrixToExcel(entityId: string, year: number): Promise<ExcelJS.Buffer> {
    const matrix = await this.getMonthlyFeeMatrix(entityId, year);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Monthly Matrix');

    // Title
    ws.mergeCells('A1', 'N1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `Monthly Fee Matrix - ${year}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Headers: Partner | Jan | Feb | ... | Dec | Total
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const headerRow = ws.addRow(['Partner', ...months, 'Total']);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = { bottom: { style: 'thin' } };
    });

    // Data rows
    const grandTotal = new Array(12).fill(0);
    for (const partner of matrix.partners) {
      const pData = matrix.data.find((d) => d.partnerId === partner.partnerId);
      const vals = pData?.values || [];
      const rowVals = vals.map((v) => v.receivable - v.payable);
      const rowTotal = rowVals.reduce((s, v) => s + v, 0);
      rowVals.forEach((v, i) => { grandTotal[i] += v; });
      ws.addRow([partner.name, ...rowVals, rowTotal]);
    }

    // Total row
    const totalRow = ws.addRow(['Total', ...grandTotal, grandTotal.reduce((s, v) => s + v, 0)]);
    totalRow.font = { bold: true };

    // Column widths
    ws.getColumn(1).width = 25;
    for (let i = 2; i <= 14; i++) {
      ws.getColumn(i).width = 12;
      ws.getColumn(i).numFmt = '#,##0';
    }

    return await wb.xlsx.writeBuffer();
  }

  /**
   * Tax invoice history — KRW invoices or those with invTaxInvoiceType
   */
  async getTaxInvoiceHistory(entityId: string, params: { year?: number; month?: number }) {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.partner', 'partner')
      .where('inv.entId = :entityId', { entityId })
      .andWhere('inv.invStatus NOT IN (:...excluded)', { excluded: ['CANCELLED', 'VOID'] })
      .andWhere('(inv.invCurrency = :krw OR inv.invTaxInvoiceType IS NOT NULL)', { krw: 'KRW' })
      .orderBy('inv.invDate', 'DESC');

    if (params.year) {
      if (params.month) {
        const start = `${params.year}-${String(params.month).padStart(2, '0')}-01`;
        const endDate = new Date(params.year, params.month, 0);
        const end = `${params.year}-${String(params.month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        qb.andWhere('inv.invDate >= :start AND inv.invDate <= :end', { start, end });
      } else {
        qb.andWhere('inv.invDate >= :start AND inv.invDate <= :end', {
          start: `${params.year}-01-01`,
          end: `${params.year}-12-31`,
        });
      }
    }

    const invoices = await qb.getMany();

    return invoices.map((inv) => ({
      invoiceId: inv.invId,
      number: inv.invNumber,
      date: inv.invDate,
      partnerName: inv.partner?.ptnCompanyName || '',
      taxId: inv.partner?.ptnTaxId || '',
      direction: inv.invDirection,
      subtotal: Number(inv.invSubtotal),
      taxAmount: Number(inv.invTaxAmount),
      total: Number(inv.invTotal),
      taxInvoiceType: inv.invTaxInvoiceType || null,
      currency: inv.invCurrency,
      status: inv.invStatus,
    }));
  }

  /**
   * Export tax invoices to Excel
   */
  async exportTaxInvoicesToExcel(entityId: string, params: { year?: number; month?: number }): Promise<ExcelJS.Buffer> {
    const items = await this.getTaxInvoiceHistory(entityId, params);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Tax Invoices');

    // Title
    ws.mergeCells('A1', 'I1');
    const titleCell = ws.getCell('A1');
    titleCell.value = `Tax Invoice History${params.year ? ` - ${params.year}` : ''}${params.month ? `/${String(params.month).padStart(2, '0')}` : ''}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Headers
    const headers = ['No.', 'Date', 'Invoice No.', 'Partner', 'Tax ID', 'Supply Amount', 'VAT', 'Total', 'Type'];
    const headerRow = ws.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      cell.border = { bottom: { style: 'thin' } };
    });

    items.forEach((item, idx) => {
      ws.addRow([
        idx + 1,
        item.date,
        item.number,
        item.partnerName,
        item.taxId,
        item.subtotal,
        item.taxAmount,
        item.total,
        item.taxInvoiceType || '-',
      ]);
    });

    ws.columns = [
      { width: 5 }, { width: 12 }, { width: 20 }, { width: 25 }, { width: 15 },
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 },
    ];
    ws.getColumn(6).numFmt = '#,##0';
    ws.getColumn(7).numFmt = '#,##0';
    ws.getColumn(8).numFmt = '#,##0';

    return await wb.xlsx.writeBuffer();
  }

  /**
   * Category breakdown — ACTIVE/EXPIRING contracts grouped by ctr_category
   */
  async getCategoryBreakdown(entityId: string) {
    const result = await this.contractRepo
      .createQueryBuilder('ctr')
      .select('ctr.ctrCategory', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(ctr.ctrAmount), 0)', 'totalAmount')
      .addSelect(`SUM(CASE WHEN ctr.ctrDirection = 'RECEIVABLE' THEN 1 ELSE 0 END)`, 'receivableCount')
      .addSelect(`SUM(CASE WHEN ctr.ctrDirection = 'PAYABLE' THEN 1 ELSE 0 END)`, 'payableCount')
      .where('ctr.entId = :entityId', { entityId })
      .andWhere('ctr.ctrStatus IN (:...statuses)', { statuses: ['ACTIVE', 'EXPIRING'] })
      .groupBy('ctr.ctrCategory')
      .getRawMany();

    return result.map((r) => ({
      category: r.category,
      count: Number(r.count),
      totalAmount: Number(r.totalAmount),
      receivableCount: Number(r.receivableCount),
      payableCount: Number(r.payableCount),
    }));
  }

  /**
   * Consolidated summary for the current entity
   */
  async getConsolidatedSummary(entityId: string) {
    const entities = await this.entityRepo.find({
      where: { entId: entityId, entStatus: 'ACTIVE' },
      order: { entCode: 'ASC' },
    });

    const results = [];
    for (const ent of entities) {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().substring(0, 10);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().substring(0, 10);

      const revenue = await this.invoiceRepo
        .createQueryBuilder('inv')
        .select('COALESCE(SUM(inv.invTotal), 0)', 'total')
        .where('inv.entId = :eid', { eid: ent.entId })
        .andWhere('inv.invDirection = :dir', { dir: 'RECEIVABLE' })
        .andWhere('inv.invDate >= :start AND inv.invDate <= :end', { start: monthStart, end: monthEnd })
        .andWhere('inv.invStatus NOT IN (:...excluded)', { excluded: ['CANCELLED', 'VOID'] })
        .getRawOne();

      const receivable = await this.invoiceRepo
        .createQueryBuilder('inv')
        .select('COALESCE(SUM(inv.invTotal - inv.invPaidAmount), 0)', 'total')
        .where('inv.entId = :eid', { eid: ent.entId })
        .andWhere('inv.invDirection = :dir', { dir: 'RECEIVABLE' })
        .andWhere('inv.invStatus IN (:...statuses)', { statuses: ['ISSUED', 'SENT', 'OVERDUE'] })
        .getRawOne();

      const payable = await this.invoiceRepo
        .createQueryBuilder('inv')
        .select('COALESCE(SUM(inv.invTotal - inv.invPaidAmount), 0)', 'total')
        .where('inv.entId = :eid', { eid: ent.entId })
        .andWhere('inv.invDirection = :dir', { dir: 'PAYABLE' })
        .andWhere('inv.invStatus IN (:...statuses)', { statuses: ['ISSUED', 'SENT', 'OVERDUE'] })
        .getRawOne();

      const activeContracts = await this.contractRepo
        .createQueryBuilder('ctr')
        .where('ctr.entId = :eid', { eid: ent.entId })
        .andWhere('ctr.ctrStatus IN (:...statuses)', { statuses: ['ACTIVE', 'EXPIRING'] })
        .getCount();

      results.push({
        entityId: ent.entId,
        name: ent.entName,
        code: ent.entCode,
        country: ent.entCountry,
        currency: ent.entCurrency,
        monthlyRevenue: Number(revenue?.total) || 0,
        receivableOutstanding: Number(receivable?.total) || 0,
        payableOutstanding: Number(payable?.total) || 0,
        activeContracts,
      });
    }

    return results;
  }
}
