import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity } from '../entity/invoice.entity';

@Injectable()
export class InvoiceNumberingService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
  ) {}

  async generateNumber(entityId: string, entityCountry: string, currency: string, date: string): Promise<string> {
    const country = (entityCountry || '').toUpperCase();

    if (country === 'VN') {
      return this.generateVnNumber(entityId);
    }

    if (country === 'KR') {
      if (currency === 'KRW') {
        return this.generateKrKrwNumber(entityId, date);
      }
      return this.generateKrUsdNumber(entityId, date);
    }

    // Default: entity code based
    return this.generateDefaultNumber(entityId, date);
  }

  /**
   * VN: No.{seq} (cumulative sequential number)
   */
  private async generateVnNumber(entityId: string): Promise<string> {
    const count = await this.invoiceRepo.count({ where: { entId: entityId } });
    const seq = count + 1;
    return `No.${seq}`;
  }

  /**
   * KR USD: AMKR-INV-{YYYYMM}-{seq}{suffix}
   */
  private async generateKrUsdNumber(entityId: string, date: string): Promise<string> {
    const yyyymm = date.substring(0, 7).replace('-', '');
    const monthCount = await this.getMonthCount(entityId, date);
    const seq = String(monthCount + 1).padStart(3, '0');
    return `AMKR-INV-${yyyymm}-${seq}`;
  }

  /**
   * KR KRW: TAX-{YYYYMM}-{seq}
   */
  private async generateKrKrwNumber(entityId: string, date: string): Promise<string> {
    const yyyymm = date.substring(0, 7).replace('-', '');
    const monthCount = await this.getMonthCount(entityId, date);
    const seq = String(monthCount + 1).padStart(3, '0');
    return `TAX-${yyyymm}-${seq}`;
  }

  /**
   * Default: INV-{YYYYMM}-{seq}
   */
  private async generateDefaultNumber(entityId: string, date: string): Promise<string> {
    const yyyymm = date.substring(0, 7).replace('-', '');
    const monthCount = await this.getMonthCount(entityId, date);
    const seq = String(monthCount + 1).padStart(3, '0');
    return `INV-${yyyymm}-${seq}`;
  }

  private async getMonthCount(entityId: string, date: string): Promise<number> {
    const yearMonth = date.substring(0, 7); // YYYY-MM
    const startDate = `${yearMonth}-01`;
    const endDate = `${yearMonth}-31`;

    return this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.ent_id = :entityId', { entityId })
      .andWhere('inv.inv_date >= :startDate', { startDate })
      .andWhere('inv.inv_date <= :endDate', { endDate })
      .getCount();
  }
}
