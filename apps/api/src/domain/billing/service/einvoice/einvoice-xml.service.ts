import { Injectable, BadRequestException } from '@nestjs/common';
import { InvoiceEntity } from '../../entity/invoice.entity';
import { EinvoiceXmlData } from './tvan-api.interface';

/**
 * GDT 표준 XML 생성 서비스
 * Decree 123/2020 + Circular 32/2025 규격
 */
@Injectable()
export class EinvoiceXmlService {
  /**
   * InvoiceEntity → EinvoiceXmlData 변환
   */
  buildXmlData(
    invoice: InvoiceEntity,
    formNumber: string,
    referenceCode: string,
  ): EinvoiceXmlData {
    const entity = invoice.hrEntity;
    const partner = invoice.partner;

    if (!entity) throw new BadRequestException('Invoice entity (hrEntity) relation not loaded');
    if (!partner) throw new BadRequestException('Invoice partner relation not loaded');
    if (!entity.entRegNo) throw new BadRequestException('Seller tax code (MST) is not set on entity');
    if (!partner.ptnTaxId) throw new BadRequestException('Buyer tax code (MST) is not set on partner');
    if (!invoice.items || invoice.items.length === 0) throw new BadRequestException('Invoice must have at least one item');

    return {
      seller: {
        taxCode: entity.entRegNo,
        name: entity.entNameEn || entity.entName,
        nameEn: entity.entNameEn,
        address: entity.entAddress || '',
        phone: entity.entPhone,
        email: entity.entEmail,
        representative: entity.entRepresentative,
      },
      buyer: {
        taxCode: partner.ptnTaxId,
        name: partner.ptnCompanyName,
        nameLocal: partner.ptnCompanyNameLocal,
        address: partner.ptnAddress || '',
        contactName: partner.ptnContactName,
        email: partner.ptnContactEmail,
      },
      invoice: {
        invNumber: invoice.invNumber,
        invDate: invoice.invDate,
        currency: invoice.invCurrency,
        formNumber,
        referenceCode,
        paymentMethod: 'TM/CK', // 현금/이체
      },
      items: (invoice.items || []).map((item) => ({
        seq: item.itmSeq,
        description: item.itmDescription,
        quantity: Number(item.itmQuantity),
        unitPrice: Number(item.itmUnitPrice),
        amount: Number(item.itmAmount),
      })),
      totals: {
        subtotal: Number(invoice.invSubtotal),
        taxRate: Number(invoice.invTaxRate),
        taxAmount: Number(invoice.invTaxAmount),
        total: Number(invoice.invTotal),
      },
    };
  }

  /**
   * EinvoiceXmlData → GDT 표준 XML 문자열 생성
   * <HDon> 루트 엘리먼트
   */
  generateXml(data: EinvoiceXmlData): string {
    const itemsXml = data.items
      .map(
        (item) => `
      <HHDVu>
        <STT>${item.seq}</STT>
        <THHDVu>${this.escapeXml(item.description)}</THHDVu>
        <DVTinh></DVTinh>
        <SLuong>${item.quantity}</SLuong>
        <DGia>${item.unitPrice}</DGia>
        <ThTien>${item.amount}</ThTien>
        <TSuat>${data.totals.taxRate}%</TSuat>
      </HHDVu>`,
      )
      .join('');

    // 세율 표시: -1이면 KCT (면세)
    const taxRateDisplay = data.totals.taxRate === -1 ? 'KCT' : `${data.totals.taxRate}%`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <DLHDon>
    <TTChung>
      <THDon>HÓA ĐƠN GIÁ TRỊ GIA TĂNG</THDon>
      <KHMSHDon>${data.invoice.formNumber}</KHMSHDon>
      <KHHDon>${this.escapeXml(data.invoice.referenceCode)}</KHHDon>
      <SHDon>${this.escapeXml(data.invoice.invNumber)}</SHDon>
      <NLap>${data.invoice.invDate}</NLap>
      <DVTTe>${data.invoice.currency}</DVTTe>
      <HTTToan>${this.escapeXml(data.invoice.paymentMethod || '')}</HTTToan>
    </TTChung>
    <NDHDon>
      <NBan>
        <Ten>${this.escapeXml(data.seller.name)}</Ten>
        <MST>${this.escapeXml(data.seller.taxCode)}</MST>
        <DChi>${this.escapeXml(data.seller.address)}</DChi>
        ${data.seller.phone ? `<SDThoai>${this.escapeXml(data.seller.phone)}</SDThoai>` : ''}
        ${data.seller.email ? `<DCTDTu>${this.escapeXml(data.seller.email)}</DCTDTu>` : ''}
      </NBan>
      <NMua>
        <Ten>${this.escapeXml(data.buyer.name)}</Ten>
        <MST>${this.escapeXml(data.buyer.taxCode)}</MST>
        <DChi>${this.escapeXml(data.buyer.address)}</DChi>
        ${data.buyer.contactName ? `<HVTNMHang>${this.escapeXml(data.buyer.contactName)}</HVTNMHang>` : ''}
        ${data.buyer.email ? `<DCTDTu>${this.escapeXml(data.buyer.email)}</DCTDTu>` : ''}
      </NMua>
      <DSHHDVu>${itemsXml}
      </DSHHDVu>
      <TToan>
        <TgTCThue>${data.totals.subtotal}</TgTCThue>
        <TgTThue>${data.totals.taxAmount}</TgTThue>
        <TTCKTMai>0</TTCKTMai>
        <TgTTTBSo>${data.totals.total}</TgTTTBSo>
        <DSLTSuat>
          <LTSuat>
            <TSuat>${taxRateDisplay}</TSuat>
            <ThTien>${data.totals.subtotal}</ThTien>
            <TThue>${data.totals.taxAmount}</TThue>
          </LTSuat>
        </DSLTSuat>
      </TToan>
    </NDHDon>
  </DLHDon>
  <DSCKS>
    <!-- 디지털 서명은 TVAN 업체에서 처리 -->
  </DSCKS>
</HDon>`;

    return xml;
  }

  private escapeXml(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
