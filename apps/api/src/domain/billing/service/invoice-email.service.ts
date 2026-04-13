import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity } from '../entity/invoice.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { InvoicePdfService } from './invoice-pdf.service';
import { MailService } from '../../../infrastructure/external/mail/mail.service';
import { SendInvoiceEmailRequest } from '../dto/request/send-invoice-email.request';

@Injectable()
export class InvoiceEmailService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly mailService: MailService,
  ) {}

  async sendInvoiceEmail(invoiceId: string, entityId: string, dto: SendInvoiceEmailRequest) {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
      relations: ['partner'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const entity = await this.entityRepo.findOne({ where: { entId: entityId } });
    const entityName = entity?.entNameEn || entity?.entName || 'AMB Management';

    // Generate PDF
    const { buffer, filename } = await this.invoicePdfService.generatePdf(invoiceId, entityId);

    // Build subject
    const subject = dto.subject || `Invoice ${invoice.invNumber} from ${entityName}`;

    // Build HTML
    const partnerName = invoice.partner?.ptnCompanyName || '';
    const bodyText = dto.body || `Please find attached invoice ${invoice.invNumber}.`;
    const html = this.buildEmailHtml(entityName, partnerName, invoice.invNumber, bodyText, invoice);

    // Send email
    const sent = await this.mailService.sendRawEmail({
      to: dto.to,
      cc: dto.cc,
      subject,
      html,
      attachments: [{ filename, content: buffer, contentType: 'application/pdf' }],
    });

    if (!sent) {
      throw new Error('Failed to send email');
    }

    // Update invoice status to SENT if currently ISSUED
    if (invoice.invStatus === 'ISSUED') {
      await this.invoiceRepo.update(
        { invId: invoiceId, entId: entityId },
        { invStatus: 'SENT' },
      );
    }

    return { sent: true, to: dto.to, subject };
  }

  private buildEmailHtml(
    entityName: string,
    partnerName: string,
    invNumber: string,
    bodyText: string,
    invoice: InvoiceEntity,
  ): string {
    const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: #EA580C; padding: 20px 24px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px;">${entityName}</h2>
        </div>
        <div style="padding: 24px;">
          <p style="color: #374151; font-size: 14px;">Dear ${partnerName},</p>
          <p style="color: #374151; font-size: 14px;">${bodyText.replace(/\n/g, '<br/>')}</p>
          <div style="background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; color: #374151;">
              <tr>
                <td style="padding: 4px 0;"><strong>Invoice No.:</strong></td>
                <td style="text-align: right;">${invNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;"><strong>Date:</strong></td>
                <td style="text-align: right;">${invoice.invDate}</td>
              </tr>
              ${invoice.invDueDate ? `<tr><td style="padding: 4px 0;"><strong>Due Date:</strong></td><td style="text-align: right;">${invoice.invDueDate}</td></tr>` : ''}
              <tr>
                <td style="padding: 4px 0; border-top: 1px solid #FDBA74; padding-top: 8px;"><strong>Total:</strong></td>
                <td style="text-align: right; border-top: 1px solid #FDBA74; padding-top: 8px; font-size: 16px; font-weight: bold; color: #EA580C;">${invoice.invCurrency} ${fmt(Number(invoice.invTotal))}</td>
              </tr>
            </table>
          </div>
          <p style="color: #6B7280; font-size: 12px;">The invoice PDF is attached to this email.</p>
        </div>
        <div style="background: #F9FAFB; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9CA3AF; font-size: 11px; margin: 0; text-align: center;">
            This email was sent by ${entityName} via AMB Management System.
          </p>
        </div>
      </div>
    `;
  }
}
