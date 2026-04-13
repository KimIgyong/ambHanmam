import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { InvoiceEntity } from '../entity/invoice.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { BillingDocumentService } from './billing-document.service';

@Injectable()
export class InvoicePdfService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly documentService: BillingDocumentService,
  ) {}

  async generatePdf(invoiceId: string, entityId: string): Promise<{ buffer: Buffer; filename: string; partnerId: string | null }> {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
      relations: ['partner', 'contract', 'items', 'hrEntity'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const entity = invoice.hrEntity || await this.entityRepo.findOne({ where: { entId: entityId } });
    const country = entity?.entCountry || '';
    const currency = invoice.invCurrency;

    // Load stamp and signature images for approved invoices
    let stampImage: Buffer | null = null;
    let signatureImage: Buffer | null = null;

    if (invoice.invApprovalStatus === 'APPROVED_ADMIN') {
      if (entity?.entStampImage) {
        stampImage = entity.entStampImage;
      }
      if (invoice.invApproverAdminId) {
        const approver = await this.userRepo.findOne({ where: { usrId: invoice.invApproverAdminId } });
        if (approver?.usrSignatureImage) {
          signatureImage = approver.usrSignatureImage;
        }
      }
    }

    let buffer: Buffer;

    if (country === 'KR' && currency === 'KRW') {
      buffer = await this.buildKrTaxInvoice(invoice, entity, stampImage, signatureImage);
    } else if (country === 'KR') {
      buffer = await this.buildKrUsdInvoice(invoice, entity, stampImage, signatureImage);
    } else {
      buffer = await this.buildVnInvoice(invoice, entity, stampImage, signatureImage);
    }

    const safeNumber = invoice.invNumber.replace(/[^a-zA-Z0-9\-]/g, '_');
    const filename = `Invoice_${safeNumber}.pdf`;

    return { buffer, filename, partnerId: invoice.partner?.ptnId || null };
  }

  async saveToDrive(
    invoiceId: string,
    entityId: string,
    partnerId: string,
    buffer: Buffer,
    filename: string,
    uploadedBy?: string,
  ) {
    return this.documentService.savePdfToDrive(
      entityId, 'INVOICE', invoiceId, partnerId, buffer, filename, uploadedBy,
    );
  }

  // ──────────── VN Commercial Invoice (English) ────────────
  private buildVnInvoice(invoice: InvoiceEntity, entity: HrEntityEntity | null, stampImage?: Buffer | null, signatureImage?: Buffer | null): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const ccy = invoice.invCurrency;

      // ── Header ──
      doc.fontSize(14).font('Helvetica-Bold').text(entity?.entNameEn || entity?.entName || 'AMOEBA CO., LTD', { align: 'center' });
      doc.fontSize(8).font('Helvetica');
      if (entity?.entAddress) doc.text(entity.entAddress, { align: 'center' });
      if (entity?.entPhone) doc.text(`Tel: ${entity.entPhone}`, { align: 'center' });
      if (entity?.entEmail) doc.text(`Email: ${entity.entEmail}`, { align: 'center' });
      if (entity?.entRegNo) doc.text(`Tax Code: ${entity.entRegNo}`, { align: 'center' });
      doc.moveDown(1);

      // ── Title ──
      doc.fontSize(16).font('Helvetica-Bold').text('COMMERCIAL INVOICE', { align: 'center' });
      doc.moveDown(0.5);

      // ── Invoice Info Row ──
      doc.fontSize(9).font('Helvetica');
      const infoY = doc.y;
      doc.text(`Invoice No.: ${invoice.invNumber}`, 40, infoY);
      doc.text(`Date: ${invoice.invDate}`, 350, infoY);
      doc.moveDown(0.3);
      if (invoice.invInternalCode) {
        doc.text(`Internal Code: ${invoice.invInternalCode}`, 40);
      }
      if (invoice.invDueDate) {
        doc.text(`Due Date: ${invoice.invDueDate}`, 350, doc.y - (invoice.invInternalCode ? 12 : 0));
      }
      doc.moveDown(0.5);

      // ── Bill To ──
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica-Bold').text('Bill To:');
      doc.fontSize(9).font('Helvetica');
      doc.text(invoice.partner?.ptnCompanyName || '');
      if (invoice.partner?.ptnAddress) doc.text(invoice.partner.ptnAddress);
      if (invoice.partner?.ptnTaxId) doc.text(`Tax ID: ${invoice.partner.ptnTaxId}`);
      if (invoice.partner?.ptnContactName) doc.text(`Attn: ${invoice.partner.ptnContactName}`);
      doc.moveDown(0.5);

      // ── Service Period ──
      if (invoice.invServicePeriodStart && invoice.invServicePeriodEnd) {
        doc.text(`Service Period: ${invoice.invServicePeriodStart} ~ ${invoice.invServicePeriodEnd}`);
        doc.moveDown(0.3);
      }

      // ── Items Table ──
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      // Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text('No.', 45, tableTop, { width: 30 });
      doc.text('Description', 80, tableTop, { width: 230 });
      doc.text('Qty', 315, tableTop, { width: 50, align: 'right' });
      doc.text('Unit Price', 370, tableTop, { width: 80, align: 'right' });
      doc.text('Amount', 455, tableTop, { width: 95, align: 'right' });
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      // Table Rows
      const items = (invoice.items || []).sort((a, b) => a.itmSeq - b.itmSeq);
      doc.font('Helvetica').fontSize(8);
      items.forEach((item, idx) => {
        const rowY = doc.y;
        doc.text(String(idx + 1), 45, rowY, { width: 30 });
        doc.text(item.itmDescription, 80, rowY, { width: 230 });
        doc.text(String(Number(item.itmQuantity)), 315, rowY, { width: 50, align: 'right' });
        doc.text(fmt(Number(item.itmUnitPrice)), 370, rowY, { width: 80, align: 'right' });
        doc.text(fmt(Number(item.itmAmount)), 455, rowY, { width: 95, align: 'right' });
        doc.moveDown(0.5);
      });

      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // ── Totals ──
      const addTotal = (label: string, value: string, bold = false) => {
        const y = doc.y;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
        doc.text(label, 350, y, { width: 100, align: 'right' });
        doc.text(value, 455, y, { width: 95, align: 'right' });
        doc.moveDown(0.3);
      };

      addTotal('Subtotal:', `${ccy} ${fmt(Number(invoice.invSubtotal))}`);
      if (Number(invoice.invTaxRate) > 0) {
        addTotal(`Tax (${Number(invoice.invTaxRate)}%):`, `${ccy} ${fmt(Number(invoice.invTaxAmount))}`);
      }
      addTotal('TOTAL:', `${ccy} ${fmt(Number(invoice.invTotal))}`, true);

      doc.moveDown(1);

      // ── Bank Information ──
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(9).text('Bank Information');
      doc.font('Helvetica').fontSize(8);
      if (entity?.entCountry === 'VN') {
        doc.text('Bank: Shinhan Bank Vietnam - Ho Chi Minh City Branch');
        doc.text(`Account Name: ${entity?.entNameEn || entity?.entName || 'AMOEBA CO., LTD'}`);
        doc.text('Currency: USD');
      } else {
        doc.text(`Account Holder: ${entity?.entNameEn || entity?.entName || ''}`);
      }
      doc.moveDown(1.5);

      // ── Signature ──
      doc.font('Helvetica').fontSize(9);
      doc.text('Authorized by:', 380, doc.y);
      doc.moveDown(0.5);

      // Insert stamp and signature images if available
      const sigStartY = doc.y;
      if (stampImage) {
        try { doc.image(stampImage, 395, sigStartY, { width: 60, height: 60 }); } catch { /* skip invalid image */ }
      }
      if (signatureImage) {
        try { doc.image(signatureImage, 470, sigStartY, { width: 60, height: 40 }); } catch { /* skip invalid image */ }
      }

      doc.y = sigStartY + (stampImage || signatureImage ? 65 : 30);
      doc.moveTo(380, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);
      doc.text(entity?.entRepresentative || 'Chairman', 380, doc.y, { width: 165, align: 'center' });

      doc.moveDown(2);
      doc.fontSize(7).fillColor('#999999').text('This is a computer-generated invoice.', { align: 'center' });

      doc.end();
    });
  }

  // ──────────── KR Invoice (USD) ────────────
  private buildKrUsdInvoice(invoice: InvoiceEntity, entity: HrEntityEntity | null, stampImage?: Buffer | null, signatureImage?: Buffer | null): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fmt = (n: number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const ccy = invoice.invCurrency;

      // ── Header ──
      doc.fontSize(14).font('Helvetica-Bold').text(entity?.entNameEn || 'AMOEBACOMPANY CO., LTD', { align: 'center' });
      doc.fontSize(8).font('Helvetica');
      if (entity?.entAddress) doc.text(entity.entAddress, { align: 'center' });
      if (entity?.entPhone) doc.text(`Tel: ${entity.entPhone}`, { align: 'center' });
      if (entity?.entEmail) doc.text(`Email: ${entity.entEmail}`, { align: 'center' });
      doc.moveDown(1);

      // ── Title ──
      doc.fontSize(16).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);

      // ── Invoice Info ──
      const infoY = doc.y;
      doc.fontSize(9).font('Helvetica');
      doc.text(`Invoice No.: ${invoice.invNumber}`, 40, infoY);
      doc.text(`Date: ${invoice.invDate}`, 350, infoY);
      doc.moveDown(0.3);
      if (invoice.invDueDate) {
        doc.text(`Payment Due: ${invoice.invDueDate}`, 350);
      }
      doc.moveDown(0.5);

      // ── Bill To ──
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica-Bold').text('Bill To:');
      doc.fontSize(9).font('Helvetica');
      doc.text(invoice.partner?.ptnCompanyName || '');
      if (invoice.partner?.ptnCompanyNameLocal) doc.text(invoice.partner.ptnCompanyNameLocal);
      if (invoice.partner?.ptnAddress) doc.text(invoice.partner.ptnAddress);
      if (invoice.partner?.ptnContactName) doc.text(`Attn: ${invoice.partner.ptnContactName}`);
      doc.moveDown(0.5);

      // ── Contract Reference ──
      if (invoice.contract?.ctrTitle) {
        doc.text(`Contract: ${invoice.contract.ctrTitle}`);
      }
      if (invoice.invServicePeriodStart && invoice.invServicePeriodEnd) {
        doc.text(`Service Period: ${invoice.invServicePeriodStart} ~ ${invoice.invServicePeriodEnd}`);
      }
      doc.moveDown(0.5);

      // ── Items Table ──
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      const tableTop = doc.y;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text('No.', 45, tableTop, { width: 30 });
      doc.text('Description', 80, tableTop, { width: 230 });
      doc.text('Qty', 315, tableTop, { width: 50, align: 'right' });
      doc.text('Unit Price', 370, tableTop, { width: 80, align: 'right' });
      doc.text('Amount', 455, tableTop, { width: 95, align: 'right' });
      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);

      const items = (invoice.items || []).sort((a, b) => a.itmSeq - b.itmSeq);
      doc.font('Helvetica').fontSize(8);
      items.forEach((item, idx) => {
        const rowY = doc.y;
        doc.text(String(idx + 1), 45, rowY, { width: 30 });
        doc.text(item.itmDescription, 80, rowY, { width: 230 });
        doc.text(String(Number(item.itmQuantity)), 315, rowY, { width: 50, align: 'right' });
        doc.text(fmt(Number(item.itmUnitPrice)), 370, rowY, { width: 80, align: 'right' });
        doc.text(fmt(Number(item.itmAmount)), 455, rowY, { width: 95, align: 'right' });
        doc.moveDown(0.5);
      });

      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.5);

      // ── Totals ──
      const addTotal = (label: string, value: string, bold = false) => {
        const y = doc.y;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
        doc.text(label, 350, y, { width: 100, align: 'right' });
        doc.text(value, 455, y, { width: 95, align: 'right' });
        doc.moveDown(0.3);
      };

      addTotal('Subtotal:', `${ccy} ${fmt(Number(invoice.invSubtotal))}`);
      if (Number(invoice.invTaxRate) > 0) {
        addTotal(`Tax (${Number(invoice.invTaxRate)}%):`, `${ccy} ${fmt(Number(invoice.invTaxAmount))}`);
      }
      addTotal('TOTAL:', `${ccy} ${fmt(Number(invoice.invTotal))}`, true);

      doc.moveDown(1);

      // ── Bank Info ──
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(9).text('Wire Transfer Information');
      doc.font('Helvetica').fontSize(8);
      doc.text('Bank: Industrial Bank of Korea (IBK)');
      doc.text('SWIFT Code: IBKOKRSE');
      doc.text(`Account Name: ${entity?.entNameEn || entity?.entName || 'AMOEBACOMPANY CO., LTD'}`);
      doc.text(`Currency: ${ccy}`);
      doc.moveDown(1.5);

      // ── Signature ──
      doc.font('Helvetica').fontSize(9);
      doc.text('Authorized by:', 380, doc.y);
      doc.moveDown(0.5);

      const sigStartY2 = doc.y;
      if (stampImage) {
        try { doc.image(stampImage, 395, sigStartY2, { width: 60, height: 60 }); } catch { /* skip */ }
      }
      if (signatureImage) {
        try { doc.image(signatureImage, 470, sigStartY2, { width: 60, height: 40 }); } catch { /* skip */ }
      }

      doc.y = sigStartY2 + (stampImage || signatureImage ? 65 : 30);
      doc.moveTo(380, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);
      doc.text(entity?.entRepresentative || 'CEO', 380, doc.y, { width: 165, align: 'center' });

      doc.moveDown(2);
      doc.fontSize(7).fillColor('#999999').text('This is a computer-generated invoice.', { align: 'center' });

      doc.end();
    });
  }

  // ──────────── KR Tax Invoice (세금계산서, KRW) ────────────
  private buildKrTaxInvoice(invoice: InvoiceEntity, entity: HrEntityEntity | null, stampImage?: Buffer | null, signatureImage?: Buffer | null): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 30 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const fmtKrw = (n: number) => Math.round(Number(n)).toLocaleString('ko-KR');

      // Since pdfkit doesn't natively render Korean glyphs without a Korean font,
      // we use Helvetica and present the tax invoice in a bilingual format.
      // Fields use English labels with Korean terms in parentheses.

      // ── Title ──
      doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('(Se-geum-gye-san-seo)', { align: 'center' });
      doc.moveDown(0.8);

      // ── Invoice Number & Date ──
      doc.fontSize(9).font('Helvetica');
      const infoY = doc.y;
      doc.text(`Invoice No.: ${invoice.invNumber}`, 35, infoY);
      doc.text(`Date: ${invoice.invDate}`, 400, infoY);
      doc.moveDown(0.8);

      // ── Supplier / Buyer Box ──
      const boxY = doc.y;
      const boxW = 255;
      const boxH = 85;

      // Supplier box
      doc.rect(35, boxY, boxW, boxH).stroke();
      doc.font('Helvetica-Bold').fontSize(9).text('SUPPLIER (Gong-geup-ja)', 42, boxY + 5);
      doc.font('Helvetica').fontSize(8);
      doc.text(`Business Name: ${entity?.entNameEn || entity?.entName || ''}`, 42, boxY + 20);
      doc.text(`Reg. No.: ${entity?.entRegNo || ''}`, 42, boxY + 33);
      doc.text(`Representative: ${entity?.entRepresentative || ''}`, 42, boxY + 46);
      doc.text(`Address: ${entity?.entAddress || ''}`, 42, boxY + 59, { width: 240 });

      // Buyer box
      doc.rect(300, boxY, boxW, boxH).stroke();
      doc.font('Helvetica-Bold').fontSize(9).text('BUYER (Gong-geup-bat-neun-ja)', 307, boxY + 5);
      doc.font('Helvetica').fontSize(8);
      doc.text(`Business Name: ${invoice.partner?.ptnCompanyName || ''}`, 307, boxY + 20);
      doc.text(`Reg. No.: ${invoice.partner?.ptnTaxId || ''}`, 307, boxY + 33);
      doc.text(`Representative: ${invoice.partner?.ptnCeoName || invoice.partner?.ptnContactName || ''}`, 307, boxY + 46);
      doc.text(`Address: ${invoice.partner?.ptnAddress || ''}`, 307, boxY + 59, { width: 240 });

      doc.y = boxY + boxH + 15;

      // ── Service Period ──
      if (invoice.invServicePeriodStart && invoice.invServicePeriodEnd) {
        doc.fontSize(8).text(`Service Period: ${invoice.invServicePeriodStart} ~ ${invoice.invServicePeriodEnd}`, 35);
        doc.moveDown(0.5);
      }

      // ── Items Table ──
      const tblX = 35;
      const tblW = 525;
      const colWidths = [30, 215, 50, 75, 75, 80];
      const headers = ['No.', 'Description', 'Qty', 'Unit Price', 'Supply Amt', 'Tax (VAT)'];

      // Header row
      const headerY = doc.y;
      doc.rect(tblX, headerY, tblW, 18).fillAndStroke('#f0f0f0', '#000000');
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(7);
      let xPos = tblX;
      headers.forEach((h, i) => {
        const align = i >= 2 ? 'right' : 'left';
        doc.text(h, xPos + 3, headerY + 5, { width: colWidths[i] - 6, align });
        xPos += colWidths[i];
      });

      doc.moveDown(0.3);
      let rowStartY = headerY + 18;

      // Data rows
      const items = (invoice.items || []).sort((a, b) => a.itmSeq - b.itmSeq);
      doc.font('Helvetica').fontSize(7);
      items.forEach((item, idx) => {
        const amt = Number(item.itmAmount);
        const vatForItem = Number(invoice.invTaxRate) > 0
          ? Math.round(amt * Number(invoice.invTaxRate)) / 100
          : 0;

        doc.rect(tblX, rowStartY, tblW, 16).stroke();
        xPos = tblX;
        const vals = [
          String(idx + 1),
          item.itmDescription,
          String(Number(item.itmQuantity)),
          fmtKrw(Number(item.itmUnitPrice)),
          fmtKrw(amt),
          fmtKrw(vatForItem),
        ];
        vals.forEach((v, i) => {
          const align = i >= 2 ? 'right' : 'left';
          doc.text(v, xPos + 3, rowStartY + 4, { width: colWidths[i] - 6, align });
          xPos += colWidths[i];
        });
        rowStartY += 16;
      });

      doc.y = rowStartY + 10;

      // ── Totals ──
      doc.moveTo(tblX, doc.y).lineTo(tblX + tblW, doc.y).stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica').fontSize(9);
      const addTotalRow = (label: string, value: string, bold = false) => {
        const y = doc.y;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
        doc.text(label, 350, y, { width: 110, align: 'right' });
        doc.text(value, 465, y, { width: 90, align: 'right' });
        doc.moveDown(0.3);
      };

      addTotalRow('Supply Amount (Gong-geup-ga-aek):', `KRW ${fmtKrw(Number(invoice.invSubtotal))}`);
      addTotalRow('VAT (Bu-ga-se):', `KRW ${fmtKrw(Number(invoice.invTaxAmount))}`);
      addTotalRow('Total (Hap-gye):', `KRW ${fmtKrw(Number(invoice.invTotal))}`, true);

      doc.moveDown(1);

      // ── Note ──
      if (invoice.invNote) {
        doc.moveTo(tblX, doc.y).lineTo(tblX + tblW, doc.y).stroke();
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(8).text('Remarks (Bi-go):', tblX);
        doc.font('Helvetica').fontSize(8).text(invoice.invNote, tblX, doc.y, { width: tblW });
        doc.moveDown(0.5);
      }

      // ── Signature ──
      doc.moveDown(1);
      doc.font('Helvetica').fontSize(9);

      const sigY = doc.y;
      doc.text('Supplier (Signature / Seal)', 50, sigY);
      doc.text('Buyer (Signature / Seal)', 350, sigY);
      doc.moveDown(0.5);

      // Insert stamp and signature images on the Supplier side
      const sigImgY = doc.y;
      if (stampImage) {
        try { doc.image(stampImage, 80, sigImgY, { width: 55, height: 55 }); } catch { /* skip */ }
      }
      if (signatureImage) {
        try { doc.image(signatureImage, 150, sigImgY, { width: 55, height: 35 }); } catch { /* skip */ }
      }

      doc.y = sigImgY + (stampImage || signatureImage ? 60 : 30);
      const lineY = doc.y;
      doc.moveTo(50, lineY).lineTo(240, lineY).stroke();
      doc.moveTo(350, lineY).lineTo(540, lineY).stroke();
      doc.moveDown(0.3);
      doc.fontSize(8);
      doc.text(entity?.entRepresentative || '', 50, doc.y, { width: 190, align: 'center' });
      doc.text(invoice.partner?.ptnCeoName || invoice.partner?.ptnContactName || '', 350, doc.y - 11, { width: 190, align: 'center' });

      doc.moveDown(2);
      doc.fontSize(7).fillColor('#999999').text('This is a computer-generated tax invoice.', { align: 'center' });

      doc.end();
    });
  }
}
