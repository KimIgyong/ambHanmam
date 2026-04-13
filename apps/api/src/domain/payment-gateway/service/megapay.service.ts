import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PgTransactionEntity } from '../entity/pg-transaction.entity';
import { PgConfigEntity } from '../entity/pg-config.entity';
import { PgConfigService } from './pg-config.service';
import {
  megapayHash,
  generateInvoiceNo,
  generateMerTrxId,
  getMegapayTimestamp,
} from '../util/megapay-hash.util';
import { PG_TX_STATUS, PgTransactionResponse } from '@amb/types';

const MEGAPAY_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.megapay.vn',
  production: 'https://pg.megapay.vn',
};

export interface CreatePaymentDto {
  entityId: string;
  userId: string;
  amount: number;
  goodsName: string;
  buyerEmail?: string;
  buyerName?: string;
  payType?: string;
  description?: string;
}

export interface PaymentLinkResult {
  transactionId: string;
  invoiceNo: string;
  paymentLink: string;
  qrCode: string | null;
  linkExpTime: string;
}

@Injectable()
export class MegapayService {
  private readonly logger = new Logger(MegapayService.name);

  constructor(
    @InjectRepository(PgTransactionEntity)
    private readonly txRepo: Repository<PgTransactionEntity>,
    private readonly pgConfigService: PgConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 1. Payment Link 생성
   */
  async createPaymentLink(dto: CreatePaymentDto): Promise<PaymentLinkResult> {
    const config = await this.pgConfigService.getActiveConfig(dto.entityId);
    if (!config) {
      throw new BadRequestException('No active PG configuration found');
    }

    const keys = this.pgConfigService.decryptKeys(config);
    const merId = config.pgcMerchantId;
    const invoiceNo = generateInvoiceNo(merId);
    const merTrxId = generateMerTrxId(merId);
    const timeStamp = getMegapayTimestamp();
    const amount = String(dto.amount);

    // linkExpTime: 현재 시각 + 30분 (YYYYMMDDHHmmss)
    const expDate = new Date(Date.now() + 30 * 60 * 1000);
    const linkExpTime = getMegapayTimestamp();
    // 실제로는 expDate 기반으로 생성
    const ey = expDate.getFullYear();
    const em = String(expDate.getMonth() + 1).padStart(2, '0');
    const ed = String(expDate.getDate()).padStart(2, '0');
    const eh = String(expDate.getHours()).padStart(2, '0');
    const emi = String(expDate.getMinutes()).padStart(2, '0');
    const es = String(expDate.getSeconds()).padStart(2, '0');
    const linkExpTimeStr = `${ey}${em}${ed}${eh}${emi}${es}`;

    // merchantToken = SHA256(timeStamp + merTrxId + merId + amount + invoiceNo + goodsNm + linkExpTime + encodeKey)
    const merchantToken = megapayHash(
      timeStamp,
      merTrxId,
      merId,
      amount,
      invoiceNo,
      dto.goodsName,
      linkExpTimeStr,
      keys.encodeKey,
    );

    // DB에 PENDING 트랜잭션 저장
    const tx = this.txRepo.create({
      entId: dto.entityId,
      usrId: dto.userId,
      pgcId: config.pgcId,
      pgtInvoiceNo: invoiceNo,
      pgtMerTrxId: merTrxId,
      pgtAmount: amount,
      pgtCurrency: config.pgcCurrency,
      pgtPayType: dto.payType || 'NO',
      pgtGoodsName: dto.goodsName,
      pgtStatus: PG_TX_STATUS.PENDING,
      pgtMerchantToken: merchantToken,
      pgtBuyerEmail: dto.buyerEmail || null,
      pgtBuyerName: dto.buyerName || null,
      pgtLinkExptime: expDate,
    });
    const saved = await this.txRepo.save(tx);

    // MegaPay createlink API 호출
    const baseUrl = MEGAPAY_URLS[config.pgcEnvironment] || MEGAPAY_URLS.sandbox;
    const url = `${baseUrl}/pg_was/createlink.do`;

    const payload = {
      timeStamp,
      merTrxId,
      merId,
      amount,
      invoiceNo,
      goodsNm: dto.goodsName,
      callBackUrl: config.pgcCallbackUrl || '',
      notiUrl: config.pgcNotiUrl || '',
      payType: dto.payType || 'NO',
      buyerEmail: dto.buyerEmail || '',
      buyerFirstNm: dto.buyerName || '',
      buyerLastNm: '',
      currency: config.pgcCurrency,
      windowColor: config.pgcWindowColor,
      windowType: '0',
      linkExpTime: linkExpTimeStr,
      merchantToken,
      description: dto.description || dto.goodsName,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.resultCd === '00') {
        // 성공: payUrl, qrCode 저장
        saved.pgtPaymentLink = data.payUrl || null;
        saved.pgtQrCode = data.qrCode || null;
        await this.txRepo.save(saved);

        return {
          transactionId: saved.pgtId,
          invoiceNo,
          paymentLink: data.payUrl,
          qrCode: data.qrCode || null,
          linkExpTime: linkExpTimeStr,
        };
      } else {
        // 실패
        saved.pgtStatus = PG_TX_STATUS.FAILED;
        saved.pgtResultCd = data.resultCd;
        saved.pgtResultMsg = data.resultMsg || 'Payment link creation failed';
        await this.txRepo.save(saved);
        throw new BadRequestException(
          `Payment link creation failed: ${data.resultMsg || data.resultCd}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('MegaPay createlink failed:', error);
      saved.pgtStatus = PG_TX_STATUS.FAILED;
      saved.pgtResultMsg = (error as Error).message;
      await this.txRepo.save(saved);
      throw new BadRequestException('Failed to connect to payment gateway');
    }
  }

  /**
   * 2. Callback 처리 (프론트 리다이렉트용)
   */
  async handleCallback(params: Record<string, string>): Promise<{
    success: boolean;
    invoiceNo: string;
    transactionId: string;
    resultCd: string;
  }> {
    const { invoiceNo, resultCd, amount, merTrxId, merchantToken } = params;

    if (!invoiceNo) {
      throw new BadRequestException('Missing invoiceNo in callback');
    }

    const tx = await this.txRepo.findOne({
      where: { pgtInvoiceNo: invoiceNo, pgtDeletedAt: IsNull() },
    });
    if (!tx) {
      throw new NotFoundException(`Transaction not found: ${invoiceNo}`);
    }

    // Callback 원본 데이터 저장
    tx.pgtCallbackData = params;

    // merchantToken 검증
    const config = await this.getConfigForTx(tx);
    if (config && merchantToken) {
      const keys = this.pgConfigService.decryptKeys(config);
      const expectedToken = megapayHash(
        params.timeStamp || '',
        merTrxId || '',
        config.pgcMerchantId,
        amount || '',
        invoiceNo,
        keys.encodeKey,
      );
      if (merchantToken !== expectedToken) {
        this.logger.warn(
          `Callback merchantToken mismatch for ${invoiceNo}`,
        );
      }
    }

    // 금액 검증
    if (amount && tx.pgtAmount !== amount) {
      this.logger.warn(
        `Callback amount mismatch for ${invoiceNo}: expected=${tx.pgtAmount}, got=${amount}`,
      );
    }

    // 결과 업데이트 (Callback은 보조 수단, IPN이 최종)
    if (resultCd) {
      tx.pgtResultCd = resultCd;
      tx.pgtResultMsg = params.resultMsg || null;
    }
    if (params.trxId) tx.pgtTrxId = params.trxId;
    if (params.payType) tx.pgtPayType = params.payType;
    if (params.bankId) tx.pgtBankId = params.bankId;
    if (params.cardNo) tx.pgtCardNo = params.cardNo;
    if (params.cardType) tx.pgtCardType = params.cardType;
    if (params.transDt) tx.pgtTransDt = params.transDt;
    if (params.transTm) tx.pgtTransTm = params.transTm;

    await this.txRepo.save(tx);

    return {
      success: resultCd === '00',
      invoiceNo,
      transactionId: tx.pgtId,
      resultCd: resultCd || '',
    };
  }

  /**
   * 3. IPN 처리 (서버 간 알림 - 최종 상태 결정)
   */
  async handleIpn(body: Record<string, string>): Promise<void> {
    const { invoiceNo, resultCd, amount, merchantToken, merTrxId } = body;

    if (!invoiceNo) {
      this.logger.warn('IPN received without invoiceNo');
      return;
    }

    const tx = await this.txRepo.findOne({
      where: { pgtInvoiceNo: invoiceNo, pgtDeletedAt: IsNull() },
    });
    if (!tx) {
      this.logger.warn(`IPN: Transaction not found: ${invoiceNo}`);
      return;
    }

    // 멱등성: 이미 SUCCESS면 스킵
    if (tx.pgtStatus === PG_TX_STATUS.SUCCESS) {
      this.logger.log(`IPN: Transaction already SUCCESS: ${invoiceNo}`);
      return;
    }

    // IPN 원본 데이터 저장
    tx.pgtIpnData = body;

    // merchantToken 검증
    const config = await this.getConfigForTx(tx);
    if (config && merchantToken) {
      const keys = this.pgConfigService.decryptKeys(config);
      const expectedToken = megapayHash(
        body.timeStamp || '',
        merTrxId || '',
        config.pgcMerchantId,
        amount || '',
        invoiceNo,
        keys.encodeKey,
      );
      if (merchantToken !== expectedToken) {
        this.logger.error(
          `IPN merchantToken MISMATCH for ${invoiceNo} — possible tampering`,
        );
        tx.pgtStatus = PG_TX_STATUS.FAILED;
        tx.pgtResultMsg = 'merchantToken verification failed';
        await this.txRepo.save(tx);
        return;
      }
    }

    // 금액 검증
    if (amount && tx.pgtAmount !== amount) {
      this.logger.error(
        `IPN amount MISMATCH for ${invoiceNo}: expected=${tx.pgtAmount}, got=${amount}`,
      );
      tx.pgtStatus = PG_TX_STATUS.FAILED;
      tx.pgtResultMsg = 'Amount verification failed';
      await this.txRepo.save(tx);
      return;
    }

    // 상태 업데이트
    tx.pgtResultCd = resultCd || null;
    tx.pgtResultMsg = body.resultMsg || null;
    if (body.trxId) tx.pgtTrxId = body.trxId;
    if (body.payType) tx.pgtPayType = body.payType;
    if (body.payToken) tx.pgtPayToken = body.payToken;
    if (body.userFee) tx.pgtUserFee = body.userFee;
    if (body.bankId) tx.pgtBankId = body.bankId;
    if (body.cardNo) tx.pgtCardNo = body.cardNo;
    if (body.cardType) tx.pgtCardType = body.cardType;
    if (body.transDt) tx.pgtTransDt = body.transDt;
    if (body.transTm) tx.pgtTransTm = body.transTm;

    if (resultCd === '00') {
      tx.pgtStatus = PG_TX_STATUS.SUCCESS;
      await this.txRepo.save(tx);

      // 결제 성공 이벤트 발행 (Phase 3에서 쿼터 충전 처리)
      this.eventEmitter.emit('payment.success', {
        transactionId: tx.pgtId,
        entityId: tx.entId,
        userId: tx.usrId,
        amount: Number(tx.pgtAmount),
        invoiceNo: tx.pgtInvoiceNo,
        goodsName: tx.pgtGoodsName,
      });

      this.logger.log(`IPN: Payment SUCCESS for ${invoiceNo}`);
    } else {
      tx.pgtStatus = PG_TX_STATUS.FAILED;
      await this.txRepo.save(tx);
      this.logger.warn(
        `IPN: Payment FAILED for ${invoiceNo}: ${resultCd} — ${body.resultMsg}`,
      );
    }
  }

  /**
   * 4. 거래 상태 조회 (MegaPay API)
   */
  async queryTransaction(transactionId: string): Promise<PgTransactionResponse> {
    const tx = await this.txRepo.findOne({
      where: { pgtId: transactionId, pgtDeletedAt: IsNull() },
    });
    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }

    const config = await this.getConfigForTx(tx);
    if (config) {
      const keys = this.pgConfigService.decryptKeys(config);
      const timeStamp = getMegapayTimestamp();
      const merchantToken = megapayHash(
        config.pgcMerchantId,
        tx.pgtInvoiceNo,
        timeStamp,
        keys.encodeKey,
      );

      const baseUrl =
        MEGAPAY_URLS[config.pgcEnvironment] || MEGAPAY_URLS.sandbox;
      const url = `${baseUrl}/pg_was/order/trxStatusInvoiceNo.do`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merId: config.pgcMerchantId,
            invoiceNo: tx.pgtInvoiceNo,
            timeStamp,
            merchantToken,
          }),
        });
        const data = await response.json();

        if (data.resultCd === '00') {
          tx.pgtTrxId = data.trxId || tx.pgtTrxId;
          tx.pgtResultCd = data.resultCd;
          if (data.trxStatus === 'SUCCESS' && tx.pgtStatus === PG_TX_STATUS.PENDING) {
            tx.pgtStatus = PG_TX_STATUS.SUCCESS;
          }
          await this.txRepo.save(tx);
        }
      } catch (error) {
        this.logger.error('MegaPay query failed:', error);
      }
    }

    return this.mapToResponse(tx);
  }

  /**
   * 5. 환불
   */
  async refund(
    transactionId: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    const tx = await this.txRepo.findOne({
      where: { pgtId: transactionId, pgtDeletedAt: IsNull() },
    });
    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }
    if (tx.pgtStatus !== PG_TX_STATUS.SUCCESS) {
      throw new BadRequestException('Only successful transactions can be refunded');
    }
    if (!tx.pgtTrxId) {
      throw new BadRequestException('Transaction has no MegaPay trxId');
    }

    const config = await this.getConfigForTx(tx);
    if (!config) {
      throw new BadRequestException('PG configuration not found');
    }

    const keys = this.pgConfigService.decryptKeys(config);
    const timeStamp = getMegapayTimestamp();
    // hash = SHA256(trxId + cancelPw + timeStamp + hashKeyRefund)
    const hash = megapayHash(
      tx.pgtTrxId,
      keys.cancelPw,
      timeStamp,
      keys.hashKeyRefund,
    );

    const baseUrl =
      MEGAPAY_URLS[config.pgcEnvironment] || MEGAPAY_URLS.sandbox;
    const url = `${baseUrl}/pg_was/cancel/paymentCancel.do`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merId: config.pgcMerchantId,
          trxId: tx.pgtTrxId,
          cancelPw: keys.cancelPw,
          timeStamp,
          hash,
          reason,
        }),
      });
      const data = await response.json();

      if (data.resultCd === '00') {
        tx.pgtStatus = PG_TX_STATUS.REFUNDED;
        tx.pgtResultMsg = `Refunded: ${reason}`;
        await this.txRepo.save(tx);

        this.eventEmitter.emit('payment.refunded', {
          transactionId: tx.pgtId,
          entityId: tx.entId,
          userId: tx.usrId,
          amount: Number(tx.pgtAmount),
        });

        return { success: true, message: 'Refund processed successfully' };
      } else {
        return {
          success: false,
          message: data.resultMsg || `Refund failed: ${data.resultCd}`,
        };
      }
    } catch (error) {
      this.logger.error('MegaPay refund failed:', error);
      return {
        success: false,
        message: `Refund request failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 결제 내역 조회
   */
  async findTransactions(
    entityId: string,
    options?: { status?: string; limit?: number; offset?: number },
  ): Promise<{ items: PgTransactionResponse[]; total: number }> {
    const where: Record<string, unknown> = {
      entId: entityId,
      pgtDeletedAt: IsNull(),
    };
    if (options?.status) where.pgtStatus = options.status;

    const [items, total] = await this.txRepo.findAndCount({
      where,
      order: { pgtCreatedAt: 'DESC' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });

    return {
      items: items.map((tx) => this.mapToResponse(tx)),
      total,
    };
  }

  /**
   * 전체 트랜잭션 조회 (관리자용)
   */
  async findAllTransactions(
    options?: { status?: string; entityId?: string; limit?: number; offset?: number },
  ): Promise<{ items: PgTransactionResponse[]; total: number }> {
    const where: Record<string, unknown> = {
      pgtDeletedAt: IsNull(),
    };
    if (options?.status) where.pgtStatus = options.status;
    if (options?.entityId) where.entId = options.entityId;

    const [items, total] = await this.txRepo.findAndCount({
      where,
      order: { pgtCreatedAt: 'DESC' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });

    return {
      items: items.map((tx) => this.mapToResponse(tx)),
      total,
    };
  }

  /**
   * 단일 트랜잭션 상세 조회
   */
  async findTransaction(transactionId: string): Promise<PgTransactionResponse> {
    const tx = await this.txRepo.findOne({
      where: { pgtId: transactionId, pgtDeletedAt: IsNull() },
    });
    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }
    return this.mapToResponse(tx);
  }

  private async getConfigForTx(
    tx: PgTransactionEntity,
  ): Promise<PgConfigEntity | null> {
    return this.pgConfigService.getActiveConfig(tx.entId);
  }

  private mapToResponse(tx: PgTransactionEntity): PgTransactionResponse {
    return {
      transactionId: tx.pgtId,
      entityId: tx.entId,
      userId: tx.usrId,
      invoiceNo: tx.pgtInvoiceNo,
      merTrxId: tx.pgtMerTrxId,
      trxId: tx.pgtTrxId,
      amount: Number(tx.pgtAmount),
      currency: tx.pgtCurrency,
      payType: tx.pgtPayType || '',
      goodsName: tx.pgtGoodsName,
      status: tx.pgtStatus as 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED',
      resultCd: tx.pgtResultCd,
      resultMsg: tx.pgtResultMsg,
      buyerEmail: tx.pgtBuyerEmail || '',
      buyerName: tx.pgtBuyerName || '',
      createdAt: tx.pgtCreatedAt?.toISOString(),
      updatedAt: tx.pgtUpdatedAt?.toISOString(),
    };
  }
}
