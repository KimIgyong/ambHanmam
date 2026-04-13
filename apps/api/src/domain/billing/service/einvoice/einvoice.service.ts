import {
  Injectable,
  Logger,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InvoiceEntity } from '../../entity/invoice.entity';
import { EinvoiceXmlService } from './einvoice-xml.service';
import { TVAN_API_SERVICE, ITvanApiService } from './tvan-api.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EinvoiceService {
  private readonly logger = new Logger(EinvoiceService.name);

  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @Inject(TVAN_API_SERVICE)
    private readonly tvanApi: ITvanApiService,
    private readonly xmlService: EinvoiceXmlService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 전자세금계산서 발행
   */
  async issueEinvoice(invoiceId: string, entityId: string): Promise<InvoiceEntity> {
    // 1. 인보이스 조회 (relations 포함)
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
      relations: ['hrEntity', 'partner', 'items'],
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    // 2. 검증
    if (invoice.invApprovalStatus !== 'APPROVED_ADMIN') {
      throw new BadRequestException('Invoice must be fully approved (APPROVED_ADMIN) before issuing e-invoice');
    }

    if (invoice.invEinvStatus !== 'NONE' && invoice.invEinvStatus !== 'FAILED') {
      throw new BadRequestException(`Cannot issue e-invoice: current status is ${invoice.invEinvStatus}`);
    }

    if (invoice.hrEntity?.entCountry !== 'VN') {
      throw new BadRequestException('E-invoice is only available for Vietnamese entities');
    }

    if (!invoice.partner?.ptnTaxId) {
      throw new BadRequestException('Partner tax code (MST) is required for e-invoice');
    }

    // 3. PENDING 상태 업데이트
    invoice.invEinvStatus = 'PENDING';
    (invoice as any).invEinvError = null;
    await this.invoiceRepo.save(invoice);

    try {
      // 4. XML 데이터 빌드 + XML 생성
      const formNumber = this.configService.get('VN_EINV_FORM_NUMBER', '1');
      const referenceCode = this.configService.get('VN_EINV_REFERENCE_CODE', 'C26TAA');

      const xmlData = this.xmlService.buildXmlData(invoice, formNumber, referenceCode);
      const xmlContent = this.xmlService.generateXml(xmlData);

      // 5. TVAN API 호출
      const result = await this.tvanApi.issueInvoice({
        invoiceData: xmlData,
        xmlContent,
      });

      if (!result.success) {
        // 실패
        invoice.invEinvStatus = 'FAILED';
        invoice.invEinvError = result.error || 'Unknown TVAN error';
        await this.invoiceRepo.save(invoice);
        return invoice;
      }

      // 6. 성공 — 결과 저장
      invoice.invEinvStatus = 'ISSUED';
      invoice.invEinvNumber = result.einvNumber || '';
      invoice.invEinvFormNumber = formNumber;
      invoice.invEinvReferenceCode = referenceCode;
      invoice.invEinvGdtCode = result.gdtCode || '';
      invoice.invEinvIssuedAt = new Date();
      invoice.invEinvLookupUrl = result.lookupUrl || '';

      // 서명된 XML 파일 저장
      if (result.signedXml) {
        const xmlPath = await this.saveFile(
          invoiceId,
          'xml',
          Buffer.from(result.signedXml, 'utf-8'),
        );
        invoice.invEinvXmlPath = xmlPath;
      }

      // 서명된 PDF 파일 저장
      if (result.signedPdfBuffer) {
        const pdfPath = await this.saveFile(invoiceId, 'pdf', result.signedPdfBuffer);
        invoice.invEinvPdfPath = pdfPath;
      }

      await this.invoiceRepo.save(invoice);
      this.logger.log(`E-invoice issued: ${result.einvNumber} for invoice ${invoiceId}`);
      return invoice;
    } catch (error) {
      // 예외 발생 시 FAILED 처리
      invoice.invEinvStatus = 'FAILED';
      invoice.invEinvError = error.message || 'Unexpected error during e-invoice issuance';
      await this.invoiceRepo.save(invoice);
      this.logger.error(`E-invoice issuance failed for ${invoiceId}: ${error.message}`);
      return invoice;
    }
  }

  /**
   * 전자세금계산서 취소
   */
  async cancelEinvoice(invoiceId: string, entityId: string, reason: string): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.invEinvStatus !== 'ISSUED') {
      throw new BadRequestException(`Cannot cancel e-invoice: current status is ${invoice.invEinvStatus}`);
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Cancellation reason is required');
    }

    const result = await this.tvanApi.cancelInvoice({
      einvNumber: invoice.invEinvNumber,
      reason,
    });

    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to cancel e-invoice via TVAN');
    }

    invoice.invEinvStatus = 'CANCELLED';
    await this.invoiceRepo.save(invoice);

    this.logger.log(`E-invoice cancelled: ${invoice.invEinvNumber} for invoice ${invoiceId}`);
    return invoice;
  }

  /**
   * 전자세금계산서 정보 조회
   */
  async getEinvoiceInfo(invoiceId: string, entityId: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    return {
      status: invoice.invEinvStatus,
      number: invoice.invEinvNumber || null,
      formNumber: invoice.invEinvFormNumber || null,
      referenceCode: invoice.invEinvReferenceCode || null,
      gdtCode: invoice.invEinvGdtCode || null,
      issuedAt: invoice.invEinvIssuedAt?.toISOString() || null,
      lookupUrl: invoice.invEinvLookupUrl || null,
      error: invoice.invEinvError || null,
    };
  }

  /**
   * 서명된 XML 다운로드
   */
  async downloadXml(invoiceId: string, entityId: string): Promise<{ buffer: Buffer; filename: string } | null> {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (!invoice.invEinvXmlPath) return null;

    const fullPath = path.resolve(invoice.invEinvXmlPath);
    if (!fs.existsSync(fullPath)) return null;

    const buffer = fs.readFileSync(fullPath);
    const filename = `einvoice-${invoice.invEinvNumber || invoice.invNumber}.xml`;
    return { buffer, filename };
  }

  /**
   * 서명된 PDF 다운로드
   */
  async downloadPdf(invoiceId: string, entityId: string): Promise<{ buffer: Buffer; filename: string } | null> {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (!invoice.invEinvPdfPath) return null;

    const fullPath = path.resolve(invoice.invEinvPdfPath);
    if (!fs.existsSync(fullPath)) return null;

    const buffer = fs.readFileSync(fullPath);
    const filename = `einvoice-${invoice.invEinvNumber || invoice.invNumber}.pdf`;
    return { buffer, filename };
  }

  /**
   * 파일 저장 유틸
   */
  private async saveFile(invoiceId: string, ext: string, buffer: Buffer): Promise<string> {
    const dir = path.join('uploads', 'einvoice', invoiceId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `einvoice-${Date.now()}.${ext}`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }
}
