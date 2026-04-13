import {
  Injectable,
  Logger,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceEntity } from '../entity/invoice.entity';
import {
  POPBILL_SERVICE,
  IPopbillService,
  PopbillTaxInvoice,
  PopbillTaxInvoiceDetail,
} from '../../../infrastructure/external/popbill/popbill.interface';

@Injectable()
export class NtsTaxInvoiceService {
  private readonly logger = new Logger(NtsTaxInvoiceService.name);

  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepo: Repository<InvoiceEntity>,
    @Inject(POPBILL_SERVICE)
    private readonly popbillService: IPopbillService,
  ) {}

  /**
   * 정발행 — 세금계산서 발행
   */
  async issueNtsTaxInvoice(invoiceId: string, entityId: string): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
      relations: ['hrEntity', 'partner', 'items'],
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    // 검증
    if (invoice.invApprovalStatus !== 'APPROVED_ADMIN') {
      throw new BadRequestException('Invoice must be fully approved (APPROVED_ADMIN) before issuing NTS tax invoice');
    }

    if (invoice.invNtsStatus !== 'NONE' && invoice.invNtsStatus !== 'FAILED') {
      throw new BadRequestException(`Cannot issue NTS tax invoice: current status is ${invoice.invNtsStatus}`);
    }

    if (invoice.hrEntity?.entCountry !== 'KR') {
      throw new BadRequestException('NTS tax invoice is only available for Korean entities');
    }

    if (!invoice.partner?.ptnTaxId) {
      throw new BadRequestException('Partner tax ID (사업자등록번호) is required for NTS tax invoice');
    }

    if (!invoice.hrEntity?.entRegNo) {
      throw new BadRequestException('Entity registration number is required for NTS tax invoice');
    }

    // PENDING 상태 업데이트
    invoice.invNtsStatus = 'PENDING';
    (invoice as any).invNtsError = null;
    await this.invoiceRepo.save(invoice);

    try {
      const taxInvoice = this.buildPopbillTaxInvoice(invoice);
      const corpNum = invoice.hrEntity.entRegNo.replace(/-/g, '');

      const result = await this.popbillService.registIssue(corpNum, taxInvoice);

      if (result.code !== 1) {
        invoice.invNtsStatus = 'FAILED';
        invoice.invNtsError = result.message || 'Unknown Popbill error';
        await this.invoiceRepo.save(invoice);
        return invoice;
      }

      // 성공
      invoice.invNtsStatus = 'ISSUED';
      invoice.invNtsMgtKey = taxInvoice.invoicerMgtKey;
      invoice.invNtsConfirmNum = result.ntsConfirmNum || '';
      invoice.invNtsIssuedAt = new Date();
      await this.invoiceRepo.save(invoice);

      this.logger.log(`NTS tax invoice issued: ${taxInvoice.invoicerMgtKey} for invoice ${invoiceId}`);
      return invoice;
    } catch (error) {
      invoice.invNtsStatus = 'FAILED';
      invoice.invNtsError = error.message || 'Unexpected error during NTS tax invoice issuance';
      await this.invoiceRepo.save(invoice);
      this.logger.error(`NTS tax invoice issuance failed for ${invoiceId}: ${error.message}`);
      return invoice;
    }
  }

  /**
   * 수정세금계산서 발행
   */
  async issueModifiedNtsTaxInvoice(
    invoiceId: string,
    entityId: string,
    modifyCode: string,
    originalInvoiceId: string,
  ): Promise<InvoiceEntity> {
    // 원본 청구서 조회
    const originalInvoice = await this.invoiceRepo.findOne({
      where: { invId: originalInvoiceId, entId: entityId },
    });

    if (!originalInvoice) throw new NotFoundException('Original invoice not found');
    if (!originalInvoice.invNtsConfirmNum) {
      throw new BadRequestException('Original invoice does not have NTS confirm number');
    }

    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
      relations: ['hrEntity', 'partner', 'items'],
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.invApprovalStatus !== 'APPROVED_ADMIN') {
      throw new BadRequestException('Invoice must be fully approved before issuing modified NTS tax invoice');
    }

    if (invoice.invNtsStatus !== 'NONE' && invoice.invNtsStatus !== 'FAILED') {
      throw new BadRequestException(`Cannot issue modified NTS tax invoice: current status is ${invoice.invNtsStatus}`);
    }

    if (!invoice.hrEntity?.entRegNo) {
      throw new BadRequestException('Entity registration number is required');
    }

    if (!invoice.partner?.ptnTaxId) {
      throw new BadRequestException('Partner tax ID is required');
    }

    // PENDING 상태
    invoice.invNtsStatus = 'PENDING';
    (invoice as any).invNtsError = null;
    invoice.invNtsModifyCode = modifyCode;
    invoice.invNtsOriginalKey = originalInvoice.invNtsMgtKey;
    await this.invoiceRepo.save(invoice);

    try {
      const taxInvoice = this.buildPopbillTaxInvoice(invoice);
      taxInvoice.modifyCode = parseInt(modifyCode, 10);
      taxInvoice.orgNTSConfirmNum = originalInvoice.invNtsConfirmNum;

      const corpNum = invoice.hrEntity.entRegNo.replace(/-/g, '');
      const result = await this.popbillService.registIssue(corpNum, taxInvoice);

      if (result.code !== 1) {
        invoice.invNtsStatus = 'FAILED';
        invoice.invNtsError = result.message || 'Unknown Popbill error';
        await this.invoiceRepo.save(invoice);
        return invoice;
      }

      invoice.invNtsStatus = 'ISSUED';
      invoice.invNtsMgtKey = taxInvoice.invoicerMgtKey;
      invoice.invNtsConfirmNum = result.ntsConfirmNum || '';
      invoice.invNtsIssuedAt = new Date();
      await this.invoiceRepo.save(invoice);

      this.logger.log(`Modified NTS tax invoice issued: ${taxInvoice.invoicerMgtKey} for invoice ${invoiceId}`);
      return invoice;
    } catch (error) {
      invoice.invNtsStatus = 'FAILED';
      invoice.invNtsError = error.message || 'Unexpected error';
      await this.invoiceRepo.save(invoice);
      this.logger.error(`Modified NTS tax invoice failed for ${invoiceId}: ${error.message}`);
      return invoice;
    }
  }

  /**
   * 역발행 요청
   */
  async requestReverseIssue(invoiceId: string, entityId: string): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
      relations: ['hrEntity', 'partner', 'items'],
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.invNtsStatus !== 'NONE' && invoice.invNtsStatus !== 'FAILED') {
      throw new BadRequestException(`Cannot request reverse issue: current status is ${invoice.invNtsStatus}`);
    }

    if (!invoice.hrEntity?.entRegNo || !invoice.partner?.ptnTaxId) {
      throw new BadRequestException('Entity registration number and partner tax ID are required');
    }

    invoice.invNtsStatus = 'PENDING';
    (invoice as any).invNtsError = null;
    await this.invoiceRepo.save(invoice);

    try {
      const taxInvoice = this.buildPopbillTaxInvoice(invoice);
      taxInvoice.issueType = '역발행';

      const corpNum = invoice.hrEntity.entRegNo.replace(/-/g, '');
      const result = await this.popbillService.registRequest(corpNum, taxInvoice);

      if (result.code !== 1) {
        invoice.invNtsStatus = 'FAILED';
        invoice.invNtsError = result.message || 'Unknown Popbill error';
        await this.invoiceRepo.save(invoice);
        return invoice;
      }

      invoice.invNtsMgtKey = taxInvoice.invoicerMgtKey;
      // 역발행은 PENDING 상태 유지 (상대방 승인 대기)
      await this.invoiceRepo.save(invoice);

      this.logger.log(`NTS reverse issue requested: ${taxInvoice.invoicerMgtKey} for invoice ${invoiceId}`);
      return invoice;
    } catch (error) {
      invoice.invNtsStatus = 'FAILED';
      invoice.invNtsError = error.message || 'Unexpected error';
      await this.invoiceRepo.save(invoice);
      this.logger.error(`NTS reverse issue request failed for ${invoiceId}: ${error.message}`);
      return invoice;
    }
  }

  /**
   * 발행 취소
   */
  async cancelNtsTaxInvoice(invoiceId: string, entityId: string): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
      relations: ['hrEntity'],
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.invNtsStatus !== 'ISSUED') {
      throw new BadRequestException(`Cannot cancel NTS tax invoice: current status is ${invoice.invNtsStatus}`);
    }

    if (!invoice.invNtsMgtKey) {
      throw new BadRequestException('NTS management key not found');
    }

    const corpNum = invoice.hrEntity.entRegNo.replace(/-/g, '');
    const result = await this.popbillService.cancelIssue(
      corpNum,
      'SELL',
      invoice.invNtsMgtKey,
    );

    if (result.code !== 1) {
      throw new BadRequestException(result.message || 'Failed to cancel NTS tax invoice');
    }

    invoice.invNtsStatus = 'CANCELLED';
    await this.invoiceRepo.save(invoice);

    this.logger.log(`NTS tax invoice cancelled: ${invoice.invNtsMgtKey} for invoice ${invoiceId}`);
    return invoice;
  }

  /**
   * 상태 조회/동기화
   */
  async getNtsStatus(invoiceId: string, entityId: string): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepo.findOne({
      where: { invId: invoiceId, entId: entityId },
      relations: ['hrEntity'],
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    if (!invoice.invNtsMgtKey || invoice.invNtsStatus === 'NONE') {
      return invoice;
    }

    try {
      const corpNum = invoice.hrEntity.entRegNo.replace(/-/g, '');
      const info = await this.popbillService.getInfo(
        corpNum,
        'SELL',
        invoice.invNtsMgtKey,
      );

      // stateCode 기반 상태 동기화
      const newStatus = this.mapStateCode(info.stateCode);
      if (newStatus && newStatus !== invoice.invNtsStatus) {
        invoice.invNtsStatus = newStatus;
        if (info.ntsconfirmNum) {
          invoice.invNtsConfirmNum = info.ntsconfirmNum;
        }
        await this.invoiceRepo.save(invoice);
      }
    } catch (error) {
      this.logger.warn(`Failed to sync NTS status for ${invoiceId}: ${error.message}`);
    }

    return invoice;
  }

  /**
   * Popbill stateCode → NTS 상태 매핑
   */
  private mapStateCode(stateCode: number): string | null {
    if (stateCode >= 300 && stateCode < 400) return 'ISSUED';
    if (stateCode >= 400 && stateCode < 500) return 'ACCEPTED';
    if (stateCode >= 500 && stateCode < 600) return 'REJECTED';
    if (stateCode >= 600) return 'CANCELLED';
    if (stateCode >= 200 && stateCode < 300) return 'PENDING';
    return null;
  }

  /**
   * Invoice → PopbillTaxInvoice 데이터 매핑
   */
  private buildPopbillTaxInvoice(invoice: InvoiceEntity): PopbillTaxInvoice {
    const entity = invoice.hrEntity;
    const partner = invoice.partner;
    const items = invoice.items || [];

    // 관리번호: AMB-{invNumber} (최대 24자)
    const mgtKey = `AMB-${invoice.invNumber}`.substring(0, 24);

    // 작성일자: yyyyMMdd
    const writeDate = invoice.invDate.replace(/-/g, '');

    const detailList: PopbillTaxInvoiceDetail[] = items.map((item, idx) => ({
      serialNum: idx + 1,
      purchaseDT: writeDate,
      itemName: item.itmDescription || '',
      qty: String(item.itmQuantity || 0),
      unitCost: String(item.itmUnitPrice || 0),
      supplyCost: String(item.itmAmount || 0),
      tax: String(Math.round(Number(item.itmAmount || 0) * Number(invoice.invTaxRate || 0) / 100)),
    }));

    return {
      writeDate,
      issueType: '정발행',
      taxType: '과세',
      chargeDirection: '정과금',
      purposeType: '영수',
      // 공급자 (entity)
      invoicerCorpNum: entity.entRegNo.replace(/-/g, ''),
      invoicerCorpName: entity.entName,
      invoicerCEOName: entity.entRepresentative || '',
      invoicerMgtKey: mgtKey,
      invoicerAddr: entity.entAddress || '',
      // 공급받는자 (partner)
      invoiceeType: '사업자',
      invoiceeCorpNum: partner.ptnTaxId.replace(/-/g, ''),
      invoiceeCorpName: partner.ptnCompanyName,
      invoiceeCEOName: partner.ptnCeoName || '',
      invoiceeAddr: partner.ptnAddress || '',
      invoiceeBizType: partner.ptnBizType || '',
      invoiceeBizClass: partner.ptnBizCategory || '',
      invoiceeEmail1: partner.ptnContactEmail || '',
      // 금액
      supplyCostTotal: String(invoice.invSubtotal),
      taxTotal: String(invoice.invTaxAmount),
      totalAmount: String(invoice.invTotal),
      // 품목
      detailList,
    };
  }
}
