import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { InvoiceEntity } from '../entity/invoice.entity';
import { InvoiceItemEntity } from '../entity/invoice-item.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { CreateInvoiceRequest } from '../dto/request/create-invoice.request';
import { UpdateInvoiceRequest } from '../dto/request/update-invoice.request';
import { InvoiceMapper } from '../mapper/invoice.mapper';
import { InvoiceNumberingService } from './invoice-numbering.service';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ISSUED', 'CANCELLED'],
  ISSUED: ['SENT', 'PAID', 'OVERDUE', 'VOID'],
  SENT: ['PAID', 'OVERDUE', 'VOID'],
  OVERDUE: ['PAID', 'VOID'],
  PAID: [],
  CANCELLED: [],
  VOID: [],
};

const IMMUTABLE_STATUSES = ['PAID', 'CANCELLED', 'VOID'];

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(InvoiceItemEntity)
    private readonly itemRepo: Repository<InvoiceItemEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    private readonly numberingService: InvoiceNumberingService,
  ) {}

  async findAll(entityId: string, query?: { status?: string; direction?: string; search?: string; year_month?: string; partner_id?: string; page?: number; size?: number }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query?.size) || 50));

    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.partner', 'partner')
      .leftJoinAndSelect('inv.contract', 'contract')
      .leftJoinAndSelect('inv.items', 'items')
      .where('inv.entId = :entityId', { entityId })
      .orderBy('inv.invDate', 'DESC')
      .addOrderBy('inv.invCreatedAt', 'DESC');

    if (query?.status) {
      qb.andWhere('inv.invStatus = :status', { status: query.status });
    }
    if (query?.direction) {
      qb.andWhere('inv.invDirection = :direction', { direction: query.direction });
    }
    if (query?.search) {
      qb.andWhere('(inv.invNumber ILIKE :search OR partner.ptnCompanyName ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query?.partner_id) {
      qb.andWhere('inv.ptnId = :partnerId', { partnerId: query.partner_id });
    }
    if (query?.year_month) {
      const [year, month] = query.year_month.split('-').map(Number);
      const startDate = `${query.year_month}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${query.year_month}-${lastDay.toString().padStart(2, '0')}`;
      qb.andWhere('inv.invDate >= :startDate AND inv.invDate <= :endDate', { startDate, endDate });
    }

    qb.skip((page - 1) * size).take(size);
    const [invoices, totalCount] = await qb.getManyAndCount();
    const totalPages = Math.ceil(totalCount / size);

    return {
      data: invoices.map(InvoiceMapper.toResponse),
      pagination: { page, size, totalCount, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    };
  }

  async findById(id: string, entityId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: id, entId: entityId },
      relations: ['partner', 'contract', 'items'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return InvoiceMapper.toResponse(invoice);
  }

  async create(dto: CreateInvoiceRequest, entityId: string) {
    const entity = await this.entityRepo.findOne({ where: { entId: entityId } });
    if (!entity) throw new NotFoundException('Entity not found');

    const invNumber = await this.numberingService.generateNumber(
      entityId,
      entity.entCountry,
      dto.currency,
      dto.date,
    );

    const invoice = this.invoiceRepo.create({
      entId: entityId,
      ptnId: dto.partner_id,
      ctrId: dto.contract_id || null,
      sowId: dto.sow_id || null,
      invNumber: invNumber,
      invDirection: dto.direction,
      invDate: dto.date,
      invDueDate: dto.due_date || null,
      invServicePeriodStart: dto.service_period_start || null,
      invServicePeriodEnd: dto.service_period_end || null,
      invSubtotal: dto.subtotal,
      invTaxRate: dto.tax_rate || 0,
      invTaxAmount: dto.tax_amount || 0,
      invTotal: dto.total,
      invCurrency: dto.currency,
      invStatus: 'DRAFT',
      invInternalCode: dto.internal_code || null,
      invTaxInvoiceType: dto.tax_invoice_type || null,
      invNote: dto.note || null,
    } as DeepPartial<InvoiceEntity>);

    const saved: InvoiceEntity = await this.invoiceRepo.save(invoice as InvoiceEntity);

    // Save items
    if (dto.items && dto.items.length > 0) {
      const items = dto.items.map((item) =>
        this.itemRepo.create({
          invId: saved.invId,
          itmSeq: item.seq,
          itmDescription: item.description,
          itmQuantity: item.quantity,
          itmUnitPrice: item.unit_price,
          itmAmount: item.amount,
        } as DeepPartial<InvoiceItemEntity>),
      );
      await this.itemRepo.save(items as InvoiceItemEntity[]);
    }

    return this.findById(saved.invId, entityId);
  }

  async update(id: string, dto: UpdateInvoiceRequest, entityId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: id, entId: entityId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (IMMUTABLE_STATUSES.includes(invoice.invStatus)) {
      throw new BadRequestException('Finalized invoice cannot be modified');
    }

    // Handle status transition
    if (dto.status && dto.status !== invoice.invStatus) {
      const allowed = VALID_TRANSITIONS[invoice.invStatus] || [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Invalid status transition: ${invoice.invStatus} → ${dto.status}`,
        );
      }
      invoice.invStatus = dto.status;
    }

    if (dto.contract_id !== undefined) (invoice as any).ctrId = dto.contract_id || null;
    if (dto.sow_id !== undefined) (invoice as any).sowId = dto.sow_id || null;
    if (dto.direction) invoice.invDirection = dto.direction;
    if (dto.date) invoice.invDate = dto.date;
    if (dto.due_date !== undefined) (invoice as any).invDueDate = dto.due_date || null;
    if (dto.service_period_start !== undefined) (invoice as any).invServicePeriodStart = dto.service_period_start || null;
    if (dto.service_period_end !== undefined) (invoice as any).invServicePeriodEnd = dto.service_period_end || null;
    if (dto.subtotal !== undefined) invoice.invSubtotal = dto.subtotal;
    if (dto.tax_rate !== undefined) invoice.invTaxRate = dto.tax_rate;
    if (dto.tax_amount !== undefined) invoice.invTaxAmount = dto.tax_amount;
    if (dto.total !== undefined) invoice.invTotal = dto.total;
    if (dto.internal_code !== undefined) (invoice as any).invInternalCode = dto.internal_code || null;
    if (dto.tax_invoice_type !== undefined) (invoice as any).invTaxInvoiceType = dto.tax_invoice_type || null;
    if (dto.note !== undefined) (invoice as any).invNote = dto.note || null;

    await this.invoiceRepo.save(invoice);

    // Update items if provided
    if (dto.items !== undefined) {
      await this.itemRepo.delete({ invId: id });
      if (dto.items.length > 0) {
        const items = dto.items.map((item) =>
          this.itemRepo.create({
            invId: id,
            itmSeq: item.seq,
            itmDescription: item.description,
            itmQuantity: item.quantity,
            itmUnitPrice: item.unit_price,
            itmAmount: item.amount,
          }),
        );
        await this.itemRepo.save(items);
      }
    }

    return this.findById(id, entityId);
  }

  async delete(id: string, entityId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: id, entId: entityId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (IMMUTABLE_STATUSES.includes(invoice.invStatus)) {
      throw new BadRequestException('Finalized invoice cannot be deleted');
    }

    await this.invoiceRepo.softRemove(invoice);
  }

  async voidAndReissue(id: string, entityId: string) {
    const original = await this.invoiceRepo.findOne({
      where: { invId: id, entId: entityId },
      relations: ['items'],
    });
    if (!original) throw new NotFoundException('Invoice not found');

    const allowed = VALID_TRANSITIONS[original.invStatus] || [];
    if (!allowed.includes('VOID')) {
      throw new BadRequestException(`Cannot void invoice in ${original.invStatus} status`);
    }

    // Void original
    original.invStatus = 'VOID';
    await this.invoiceRepo.save(original);

    // Create new DRAFT copy
    const entity = await this.entityRepo.findOne({ where: { entId: entityId } });
    const newNumber = await this.numberingService.generateNumber(
      entityId,
      entity?.entCountry || '',
      original.invCurrency,
      original.invDate,
    );

    const newInvoice = this.invoiceRepo.create({
      entId: entityId,
      ptnId: original.ptnId,
      ctrId: original.ctrId,
      sowId: original.sowId,
      invNumber: newNumber,
      invDirection: original.invDirection,
      invDate: original.invDate,
      invDueDate: original.invDueDate,
      invServicePeriodStart: original.invServicePeriodStart,
      invServicePeriodEnd: original.invServicePeriodEnd,
      invSubtotal: original.invSubtotal,
      invTaxRate: original.invTaxRate,
      invTaxAmount: original.invTaxAmount,
      invTotal: original.invTotal,
      invCurrency: original.invCurrency,
      invStatus: 'DRAFT',
      invInternalCode: original.invInternalCode,
      invTaxInvoiceType: original.invTaxInvoiceType,
      invNote: original.invNote ? `[Re-issued from ${original.invNumber}] ${original.invNote}` : `Re-issued from ${original.invNumber}`,
    });

    const saved = await this.invoiceRepo.save(newInvoice);

    // Copy items
    if (original.items && original.items.length > 0) {
      const items = original.items.map((item) =>
        this.itemRepo.create({
          invId: saved.invId,
          itmSeq: item.itmSeq,
          itmDescription: item.itmDescription,
          itmQuantity: item.itmQuantity,
          itmUnitPrice: item.itmUnitPrice,
          itmAmount: item.itmAmount,
        }),
      );
      await this.itemRepo.save(items);
    }

    return this.findById(saved.invId, entityId);
  }
}
