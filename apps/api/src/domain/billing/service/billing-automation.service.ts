import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DeepPartial } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ContractEntity } from '../entity/contract.entity';
import { InvoiceEntity } from '../entity/invoice.entity';
import { InvoiceItemEntity } from '../entity/invoice-item.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { InvoiceNumberingService } from './invoice-numbering.service';
import { WorkReportService } from './work-report.service';
import { InvoiceTodoService } from './invoice-todo.service';

@Injectable()
export class BillingAutomationService {
  private readonly logger = new Logger(BillingAutomationService.name);
  private isCronRunning = false;

  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(InvoiceItemEntity)
    private readonly itemRepo: Repository<InvoiceItemEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    private readonly numberingService: InvoiceNumberingService,
    private readonly workReportService: WorkReportService,
    private readonly todoService: InvoiceTodoService,
  ) {}

  /**
   * Get all contracts eligible for billing in the given month
   */
  async getDueContracts(entityId: string, yearMonth: string) {
    const [year, month] = yearMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();

    const contracts = await this.contractRepo
      .createQueryBuilder('ctr')
      .leftJoinAndSelect('ctr.partner', 'partner')
      .where('ctr.entId = :entityId', { entityId })
      .andWhere('ctr.ctrStatus = :status', { status: 'ACTIVE' })
      .andWhere('ctr.ctrAutoGenerate = :auto', { auto: true })
      .andWhere('ctr.ctrStartDate <= :endOfMonth', { endOfMonth: `${yearMonth}-${lastDay}` })
      .andWhere('(ctr.ctrEndDate IS NULL OR ctr.ctrEndDate >= :startOfMonth)', { startOfMonth: `${yearMonth}-01` })
      .orderBy('ctr.ctrTitle', 'ASC')
      .getMany();

    // Check which contracts already have invoices for this month
    const contractIds = contracts.map((c) => c.ctrId);
    let existingInvoiceContractIds: string[] = [];

    if (contractIds.length > 0) {
      const existing = await this.invoiceRepo
        .createQueryBuilder('inv')
        .select('inv.ctrId')
        .where('inv.ctrId IN (:...ids)', { ids: contractIds })
        .andWhere('inv.invDate >= :start AND inv.invDate <= :end', {
          start: `${yearMonth}-01`,
          end: `${yearMonth}-31`,
        })
        .andWhere('inv.entId = :entityId', { entityId })
        .getRawMany();
      existingInvoiceContractIds = existing.map((e) => e.inv_ctr_id || e.ctr_id);
    }

    return contracts.map((ctr) => ({
      contractId: ctr.ctrId,
      title: ctr.ctrTitle,
      partnerName: ctr.partner?.ptnCompanyName || '',
      partnerCode: ctr.partner?.ptnCode || '',
      direction: ctr.ctrDirection,
      type: ctr.ctrType,
      amount: Number(ctr.ctrAmount),
      currency: ctr.ctrCurrency,
      billingDay: ctr.ctrBillingDay,
      billingPeriod: ctr.ctrBillingPeriod,
      unitPrice: ctr.ctrUnitPrice ? Number(ctr.ctrUnitPrice) : null,
      unitDesc: ctr.ctrUnitDesc,
      alreadyGenerated: existingInvoiceContractIds.includes(ctr.ctrId),
    }));
  }

  /**
   * Generate monthly invoices for FIXED contracts
   */
  async generateMonthlyInvoices(entityId: string, yearMonth: string) {
    const [year, month] = yearMonth.split('-').map(Number);
    const entity = await this.entityRepo.findOne({ where: { entId: entityId } });
    if (!entity) return { generated: 0, skipped: 0, invoiceIds: [] };

    const dueContracts = await this.getDueContracts(entityId, yearMonth);
    const eligible = dueContracts.filter((c) => !c.alreadyGenerated && c.type === 'FIXED');

    const invoiceIds: string[] = [];
    let skipped = 0;

    for (const contract of eligible) {
      try {
        // Determine service period based on billingPeriod
        let periodStart: string;
        let periodEnd: string;

        if (contract.billingPeriod === 'PREVIOUS_MONTH') {
          // Previous month
          const prevMonth = month === 1 ? 12 : month - 1;
          const prevYear = month === 1 ? year - 1 : year;
          periodStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
          const lastDay = new Date(prevYear, prevMonth, 0).getDate();
          periodEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${lastDay}`;
        } else {
          // Current month (default)
          periodStart = `${yearMonth}-01`;
          const lastDay = new Date(year, month, 0).getDate();
          periodEnd = `${yearMonth}-${lastDay}`;
        }

        const billingDay = contract.billingDay || 1;
        const invoiceDate = `${yearMonth}-${String(billingDay).padStart(2, '0')}`;

        const invNumber = await this.numberingService.generateNumber(
          entityId,
          entity.entCountry,
          contract.currency,
          invoiceDate,
        );

        const invoice = this.invoiceRepo.create({
          entId: entityId,
          ptnId: (await this.contractRepo.findOne({ where: { ctrId: contract.contractId } }))!.ptnId,
          ctrId: contract.contractId,
          invNumber,
          invDirection: contract.direction,
          invDate: invoiceDate,
          invServicePeriodStart: periodStart,
          invServicePeriodEnd: periodEnd,
          invSubtotal: contract.amount,
          invTaxRate: 0,
          invTaxAmount: 0,
          invTotal: contract.amount,
          invCurrency: contract.currency,
          invStatus: 'DRAFT',
        });

        const saved = await this.invoiceRepo.save(invoice);

        // Create a single line item for the fixed amount
        const item = this.itemRepo.create({
          invId: saved.invId,
          itmSeq: 1,
          itmDescription: `${contract.title} (${periodStart} ~ ${periodEnd})`,
          itmQuantity: 1,
          itmUnitPrice: contract.amount,
          itmAmount: contract.amount,
        });
        await this.itemRepo.save(item);

        invoiceIds.push(saved.invId);
      } catch {
        skipped++;
      }
    }

    return {
      generated: invoiceIds.length,
      skipped,
      invoiceIds,
    };
  }

  /**
   * Get billing calendar for a given month — groups due contracts by billingDay
   */
  async getBillingCalendar(entityId: string, yearMonth: string) {
    const [year, month] = yearMonth.split('-').map(Number);
    const dueContracts = await this.getDueContracts(entityId, yearMonth);

    const dateMap = new Map<string, any[]>();

    for (const ctr of dueContracts) {
      const day = ctr.billingDay || 1;
      const lastDay = new Date(year, month, 0).getDate();
      const actualDay = Math.min(day, lastDay);
      const dateStr = `${yearMonth}-${String(actualDay).padStart(2, '0')}`;

      if (!dateMap.has(dateStr)) dateMap.set(dateStr, []);
      dateMap.get(dateStr)!.push({
        contractId: ctr.contractId,
        title: ctr.title,
        partnerName: ctr.partnerName,
        amount: ctr.amount,
        currency: ctr.currency,
        direction: ctr.direction,
        generated: ctr.alreadyGenerated,
      });
    }

    return Array.from(dateMap.entries())
      .map(([date, contracts]) => ({ date, contracts }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get overdue billings — contracts whose billingDay has passed this month but no invoice generated
   */
  async getOverdueBillings(entityId: string) {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = now.getDate();

    const dueContracts = await this.getDueContracts(entityId, yearMonth);

    return dueContracts
      .filter((ctr) => {
        const billingDay = ctr.billingDay || 1;
        return billingDay <= today && !ctr.alreadyGenerated;
      })
      .map((ctr) => {
        const billingDay = ctr.billingDay || 1;
        const daysOverdue = today - billingDay;
        return {
          contractId: ctr.contractId,
          title: ctr.title,
          partnerName: ctr.partnerName,
          direction: ctr.direction,
          amount: ctr.amount,
          currency: ctr.currency,
          billingDay,
          daysOverdue,
          type: ctr.type,
        };
      });
  }

  /**
   * Get USAGE_BASED contracts for manual quantity entry
   */
  async getUsageBasedDrafts(entityId: string, yearMonth: string) {
    const dueContracts = await this.getDueContracts(entityId, yearMonth);
    return dueContracts.filter((c) => c.type === 'USAGE_BASED' && !c.alreadyGenerated);
  }

  /**
   * Daily billing check cron — runs at 09:00 every day.
   * Generates invoices for contracts whose billingDay matches today.
   */
  @Cron('0 9 * * *')
  async dailyBillingCheck() {
    if (this.isCronRunning) return;
    this.isCronRunning = true;

    try {
      const now = new Date();
      const today = now.getDate();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      this.logger.log(`Daily billing check started for ${yearMonth}, day=${today}`);

      const entities = await this.entityRepo.find({ where: { entStatus: 'ACTIVE' } });

      for (const entity of entities) {
        await this.processEntityBilling(entity, yearMonth, today);
      }

      this.logger.log('Daily billing check completed');
    } catch (error) {
      this.logger.error(`Daily billing check failed: ${error.message}`, error.stack);
    } finally {
      this.isCronRunning = false;
    }
  }

  /**
   * Process billing for a single entity (FIXED + USAGE_BASED).
   */
  private async processEntityBilling(entity: HrEntityEntity, yearMonth: string, today: number) {
    const [year, month] = yearMonth.split('-').map(Number);
    const dueContracts = await this.getDueContracts(entity.entId, yearMonth);

    // Only process contracts whose billingDay is today
    const todayContracts = dueContracts.filter((c) => {
      const billingDay = c.billingDay || 1;
      return billingDay === today && !c.alreadyGenerated;
    });

    if (todayContracts.length === 0) return;

    this.logger.log(`Processing ${todayContracts.length} contracts for entity ${entity.entCode}`);

    for (const contract of todayContracts) {
      try {
        if (contract.type === 'FIXED') {
          await this.generateFixedInvoice(entity, contract, yearMonth, year, month);
        } else if (contract.type === 'USAGE_BASED') {
          await this.generateUsageBasedInvoice(entity, contract, yearMonth, year, month);
        }
      } catch (error) {
        this.logger.error(`Failed to generate invoice for contract ${contract.contractId}: ${error.message}`);
      }
    }
  }

  /**
   * Generate a FIXED invoice (same logic as generateMonthlyInvoices but for a single contract).
   */
  private async generateFixedInvoice(
    entity: HrEntityEntity,
    contract: { contractId: string; direction: string; amount: number; currency: string; billingDay: number | null; billingPeriod: string | null; title: string },
    yearMonth: string,
    year: number,
    month: number,
  ) {
    const { periodStart, periodEnd } = this.getServicePeriod(contract.billingPeriod, yearMonth, year, month);
    const billingDay = contract.billingDay || 1;
    const invoiceDate = `${yearMonth}-${String(billingDay).padStart(2, '0')}`;

    // Determine tax rate for KR + KRW
    let taxRate = 0;
    let taxAmount = 0;
    let subtotal = contract.amount;
    if (entity.entCountry === 'KR' && contract.currency === 'KRW') {
      taxRate = 10;
      taxAmount = Math.round(subtotal * taxRate / 100);
    }

    const invNumber = await this.numberingService.generateNumber(entity.entId, entity.entCountry, contract.currency, invoiceDate);
    const fullContract = await this.contractRepo.findOne({ where: { ctrId: contract.contractId }, relations: ['partner'] });

    const invoice = this.invoiceRepo.create({
      entId: entity.entId,
      ptnId: fullContract!.ptnId,
      ctrId: contract.contractId,
      invNumber,
      invDirection: contract.direction,
      invDate: invoiceDate,
      invServicePeriodStart: periodStart,
      invServicePeriodEnd: periodEnd,
      invSubtotal: subtotal,
      invTaxRate: taxRate,
      invTaxAmount: taxAmount,
      invTotal: subtotal + taxAmount,
      invCurrency: contract.currency,
      invStatus: 'DRAFT',
      invTaxInvoiceType: (entity.entCountry === 'KR' && contract.currency === 'KRW') ? 'SYSTEM' : null,
    } as DeepPartial<InvoiceEntity>);

    const saved: InvoiceEntity = await this.invoiceRepo.save(invoice as InvoiceEntity);

    const item = this.itemRepo.create({
      invId: saved.invId,
      itmSeq: 1,
      itmDescription: `${contract.title} (${periodStart} ~ ${periodEnd})`,
      itmQuantity: 1,
      itmUnitPrice: subtotal,
      itmAmount: subtotal,
    } as DeepPartial<InvoiceItemEntity>);
    await this.itemRepo.save(item);

    // Create todo for assigned user
    if (fullContract?.ctrAssignedUserId) {
      const savedWithRelations = await this.invoiceRepo.findOne({
        where: { invId: saved.invId },
        relations: ['partner'],
      });
      if (savedWithRelations) {
        await this.todoService.createAutoGeneratedTodo(savedWithRelations, fullContract.ctrAssignedUserId);
      }
    }

    this.logger.log(`Generated FIXED invoice ${invNumber} for ${contract.title}`);
  }

  /**
   * Generate a USAGE_BASED invoice using Google Sheets work report data.
   */
  private async generateUsageBasedInvoice(
    entity: HrEntityEntity,
    contract: { contractId: string; direction: string; amount: number; currency: string; billingDay: number | null; billingPeriod: string | null; title: string },
    yearMonth: string,
    year: number,
    month: number,
  ) {
    // Determine which month's report to fetch (based on billingPeriod)
    let reportYearMonth = yearMonth;
    if (contract.billingPeriod === 'PREVIOUS_MONTH') {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      reportYearMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    }

    const report = await this.workReportService.fetchWorkReport(contract.contractId, reportYearMonth);
    if (!report || report.items.length === 0) {
      this.logger.warn(`No work report data for USAGE_BASED contract ${contract.contractId} (${reportYearMonth})`);
      return;
    }

    const { periodStart, periodEnd } = this.getServicePeriod(contract.billingPeriod, yearMonth, year, month);
    const billingDay = contract.billingDay || 1;
    const invoiceDate = `${yearMonth}-${String(billingDay).padStart(2, '0')}`;

    // Tax for KR + KRW
    let taxRate = 0;
    let taxAmount = 0;
    if (entity.entCountry === 'KR' && contract.currency === 'KRW') {
      taxRate = 10;
      taxAmount = Math.round(report.total * taxRate / 100);
    }

    const invNumber = await this.numberingService.generateNumber(entity.entId, entity.entCountry, contract.currency, invoiceDate);
    const fullContract = await this.contractRepo.findOne({ where: { ctrId: contract.contractId }, relations: ['partner'] });

    const invoice = this.invoiceRepo.create({
      entId: entity.entId,
      ptnId: fullContract!.ptnId,
      ctrId: contract.contractId,
      invNumber,
      invDirection: contract.direction,
      invDate: invoiceDate,
      invServicePeriodStart: periodStart,
      invServicePeriodEnd: periodEnd,
      invSubtotal: report.total,
      invTaxRate: taxRate,
      invTaxAmount: taxAmount,
      invTotal: report.total + taxAmount,
      invCurrency: contract.currency,
      invStatus: 'DRAFT',
      invGsheetUrl: fullContract?.ctrGsheetUrl || null,
      invTaxInvoiceType: (entity.entCountry === 'KR' && contract.currency === 'KRW') ? 'SYSTEM' : null,
    } as DeepPartial<InvoiceEntity>);

    const saved: InvoiceEntity = await this.invoiceRepo.save(invoice as InvoiceEntity);

    // Create line items from work report
    for (let i = 0; i < report.items.length; i++) {
      const rItem = report.items[i];
      const item = this.itemRepo.create({
        invId: saved.invId,
        itmSeq: i + 1,
        itmDescription: rItem.description,
        itmQuantity: rItem.quantity,
        itmUnitPrice: rItem.unitPrice,
        itmAmount: rItem.amount,
      } as DeepPartial<InvoiceItemEntity>);
      await this.itemRepo.save(item);
    }

    // Create todo for assigned user
    if (fullContract?.ctrAssignedUserId) {
      const savedWithRelations = await this.invoiceRepo.findOne({
        where: { invId: saved.invId },
        relations: ['partner'],
      });
      if (savedWithRelations) {
        await this.todoService.createAutoGeneratedTodo(savedWithRelations, fullContract.ctrAssignedUserId);
      }
    }

    this.logger.log(`Generated USAGE_BASED invoice ${invNumber} for ${contract.title} (${report.items.length} items from sheet "${report.sheetTabName}")`);
  }

  private getServicePeriod(billingPeriod: string | null, yearMonth: string, year: number, month: number) {
    if (billingPeriod === 'PREVIOUS_MONTH') {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const periodStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(prevYear, prevMonth, 0).getDate();
      const periodEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${lastDay}`;
      return { periodStart, periodEnd };
    }
    const periodStart = `${yearMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const periodEnd = `${yearMonth}-${lastDay}`;
    return { periodStart, periodEnd };
  }
}
