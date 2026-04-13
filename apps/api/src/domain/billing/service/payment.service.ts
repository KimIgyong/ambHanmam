import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { PaymentEntity } from '../entity/payment.entity';
import { InvoiceEntity } from '../entity/invoice.entity';
import { CreatePaymentRequest } from '../dto/request/create-payment.request';
import { PaymentMapper } from '../mapper/payment.mapper';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
  ) {}

  async findAll(entityId: string, query?: { invoice_id?: string; direction?: string; search?: string; year_month?: string }) {
    const qb = this.paymentRepo
      .createQueryBuilder('pay')
      .leftJoinAndSelect('pay.invoice', 'invoice')
      .leftJoinAndSelect('invoice.partner', 'partner')
      .where('pay.entId = :entityId', { entityId })
      .orderBy('pay.payDate', 'DESC')
      .addOrderBy('pay.payCreatedAt', 'DESC');

    if (query?.invoice_id) {
      qb.andWhere('pay.invId = :invoiceId', { invoiceId: query.invoice_id });
    }
    if (query?.direction) {
      qb.andWhere('invoice.invDirection = :direction', { direction: query.direction });
    }
    if (query?.search) {
      qb.andWhere('(invoice.invNumber ILIKE :search OR partner.ptnCompanyName ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }
    if (query?.year_month) {
      const [year, month] = query.year_month.split('-').map(Number);
      const startDate = `${query.year_month}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${query.year_month}-${lastDay.toString().padStart(2, '0')}`;
      qb.andWhere('pay.payDate >= :startDate AND pay.payDate <= :endDate', { startDate, endDate });
    }

    const payments = await qb.getMany();
    return payments.map(PaymentMapper.toResponse);
  }

  async findByInvoice(invoiceId: string, entityId: string) {
    const payments = await this.paymentRepo.find({
      where: { invId: invoiceId, entId: entityId },
      relations: ['invoice', 'invoice.partner'],
      order: { payDate: 'DESC' },
    });
    return payments.map(PaymentMapper.toResponse);
  }

  async create(dto: CreatePaymentRequest, entityId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: dto.invoice_id, entId: entityId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const immutableStatuses = ['CANCELLED', 'VOID'];
    if (immutableStatuses.includes(invoice.invStatus)) {
      throw new BadRequestException('Cannot add payment to a cancelled or void invoice');
    }

    // Check payment doesn't exceed outstanding balance
    const outstanding = Number(invoice.invTotal) - Number(invoice.invPaidAmount);
    if (dto.amount > outstanding) {
      throw new BadRequestException(`Payment amount (${dto.amount}) exceeds outstanding balance (${outstanding})`);
    }

    const payment = this.paymentRepo.create({
      entId: entityId,
      invId: dto.invoice_id,
      payAmount: dto.amount,
      payCurrency: dto.currency,
      payDate: dto.date,
      payMethod: dto.method || 'BANK_TRANSFER',
      payReference: dto.reference || null,
      payNote: dto.note || null,
    } as DeepPartial<PaymentEntity>);

    const saved: PaymentEntity = await this.paymentRepo.save(payment as PaymentEntity);

    // Update invoice paid amount and status
    const newPaidAmount = Number(invoice.invPaidAmount) + dto.amount;
    invoice.invPaidAmount = newPaidAmount;
    invoice.invPaidDate = dto.date;

    if (newPaidAmount >= Number(invoice.invTotal)) {
      invoice.invStatus = 'PAID';
    }

    await this.invoiceRepo.save(invoice);

    // Re-fetch with relations
    const result = await this.paymentRepo.findOne({
      where: { payId: saved.payId },
      relations: ['invoice', 'invoice.partner'],
    });
    return PaymentMapper.toResponse(result!);
  }

  async delete(paymentId: string, entityId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { payId: paymentId, entId: entityId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    // Reverse the paid amount on the invoice
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: payment.invId },
    });
    if (invoice) {
      invoice.invPaidAmount = Number(invoice.invPaidAmount) - Number(payment.payAmount);
      if (invoice.invPaidAmount < 0) invoice.invPaidAmount = 0;

      // Revert status if it was PAID
      if (invoice.invStatus === 'PAID' && invoice.invPaidAmount < Number(invoice.invTotal)) {
        // Check due date to determine if OVERDUE
        const today = new Date().toISOString().substring(0, 10);
        if (invoice.invDueDate && invoice.invDueDate < today) {
          invoice.invStatus = 'OVERDUE';
        } else {
          invoice.invStatus = 'ISSUED';
        }
      }
      await this.invoiceRepo.save(invoice);
    }

    await this.paymentRepo.softRemove(payment);
  }

  async getOutstandingSummary(entityId: string) {
    // Receivable outstanding (invoices we need to collect)
    const receivable = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.invTotal - inv.invPaidAmount)', 'outstanding')
      .addSelect('COUNT(*)', 'count')
      .addSelect('inv.invCurrency', 'currency')
      .where('inv.entId = :entityId', { entityId })
      .andWhere('inv.invDirection = :dir', { dir: 'RECEIVABLE' })
      .andWhere('inv.invStatus IN (:...statuses)', { statuses: ['ISSUED', 'SENT', 'OVERDUE'] })
      .groupBy('inv.invCurrency')
      .getRawMany();

    // Payable outstanding (invoices we need to pay)
    const payable = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.invTotal - inv.invPaidAmount)', 'outstanding')
      .addSelect('COUNT(*)', 'count')
      .addSelect('inv.invCurrency', 'currency')
      .where('inv.entId = :entityId', { entityId })
      .andWhere('inv.invDirection = :dir', { dir: 'PAYABLE' })
      .andWhere('inv.invStatus IN (:...statuses)', { statuses: ['ISSUED', 'SENT', 'OVERDUE'] })
      .groupBy('inv.invCurrency')
      .getRawMany();

    return { receivable, payable };
  }
}
