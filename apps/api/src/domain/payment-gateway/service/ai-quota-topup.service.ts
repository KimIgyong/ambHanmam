import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { AiQuotaTopupEntity, TOPUP_STATUS } from '../entity/ai-quota-topup.entity';
import { PgTransactionEntity } from '../entity/pg-transaction.entity';
import { EntityAiConfigEntity } from '../../entity-settings/entity/entity-ai-config.entity';

export interface PaymentSuccessEvent {
  transactionId: string;
  entityId: string;
  userId: string;
  amount: number;
  invoiceNo: string;
  goodsName: string;
}

export interface PaymentRefundedEvent {
  transactionId: string;
  entityId: string;
  userId: string;
  amount: number;
}

export interface TopupResponse {
  topupId: string;
  entityId: string;
  userId: string;
  transactionId: string;
  productId: string | null;
  tokenAmount: number;
  price: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: Date;
}

@Injectable()
export class AiQuotaTopupService {
  private readonly logger = new Logger(AiQuotaTopupService.name);

  constructor(
    @InjectRepository(AiQuotaTopupEntity)
    private readonly topupRepo: Repository<AiQuotaTopupEntity>,
    @InjectRepository(PgTransactionEntity)
    private readonly txRepo: Repository<PgTransactionEntity>,
    @InjectRepository(EntityAiConfigEntity)
    private readonly aiConfigRepo: Repository<EntityAiConfigEntity>,
  ) {}

  /**
   * payment.success 이벤트 핸들러
   * PG 결제 성공 시 → 쿼터 충전 처리
   */
  @OnEvent('payment.success', { async: true })
  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    this.logger.log(
      `Payment success event received: txId=${event.transactionId}, entity=${event.entityId}`,
    );

    // 중복 처리 방지: 동일 트랜잭션에 대한 topup이 이미 있는지 확인
    const existing = await this.topupRepo.findOne({
      where: { pgtId: event.transactionId },
    });
    if (existing) {
      this.logger.log(
        `Topup already exists for transaction ${event.transactionId}, skipping`,
      );
      return;
    }

    // PG 트랜잭션에서 goodsName으로 상품ID 추출 (metadata에 저장된 경우)
    const tx = await this.txRepo.findOne({
      where: { pgtId: event.transactionId },
    });
    if (!tx) {
      this.logger.warn(`Transaction not found: ${event.transactionId}`);
      return;
    }

    // goodsName 형식: "AI Token Pack: {productId}" 또는 일반 결제
    // description에서 productId, tokenAmount 추출
    const metadata = this.parseQuotaMetadata(tx);
    if (!metadata) {
      this.logger.log(
        `Transaction ${event.transactionId} is not a quota purchase, skipping topup`,
      );
      return;
    }

    // 충전 레코드 생성
    const topup = this.topupRepo.create({
      entId: event.entityId,
      usrId: event.userId,
      pgtId: event.transactionId,
      aqpId: metadata.productId || null,
      aqtTokenAmount: String(metadata.tokenAmount),
      aqtPrice: String(event.amount),
      aqtCurrency: tx.pgtCurrency || 'VND',
      aqtStatus: TOPUP_STATUS.COMPLETED,
      aqtNote: `Auto-topup from payment ${event.invoiceNo}`,
    });
    await this.topupRepo.save(topup);

    // AI 한도 증가
    await this.applyTopup(event.entityId, metadata.tokenAmount);

    this.logger.log(
      `Quota topup completed: entity=${event.entityId}, tokens=${metadata.tokenAmount}`,
    );
  }

  /**
   * payment.refunded 이벤트 핸들러
   * 환불 시 → 충전량 롤백
   */
  @OnEvent('payment.refunded', { async: true })
  async handlePaymentRefunded(event: PaymentRefundedEvent): Promise<void> {
    this.logger.log(
      `Payment refunded event received: txId=${event.transactionId}`,
    );

    const topup = await this.topupRepo.findOne({
      where: { pgtId: event.transactionId, aqtStatus: TOPUP_STATUS.COMPLETED },
    });
    if (!topup) {
      this.logger.log(
        `No completed topup found for transaction ${event.transactionId}`,
      );
      return;
    }

    // 한도 차감
    const tokenAmount = Number(topup.aqtTokenAmount);
    await this.reverseTopup(event.entityId, tokenAmount);

    // 상태 업데이트
    topup.aqtStatus = TOPUP_STATUS.REVERSED;
    topup.aqtNote = `${topup.aqtNote || ''} | Reversed due to refund`;
    await this.topupRepo.save(topup);

    this.logger.log(
      `Quota topup reversed: entity=${event.entityId}, tokens=-${tokenAmount}`,
    );
  }

  /**
   * 월간 토큰 한도 증가 (충전)
   */
  private async applyTopup(entityId: string, tokenAmount: number): Promise<void> {
    const config = await this.aiConfigRepo.findOne({
      where: { entId: entityId, eacDeletedAt: null as any },
    });

    if (!config) {
      this.logger.warn(
        `AI config not found for entity ${entityId}, creating default with topup amount`,
      );
      // 설정이 없으면 생성하지 않고 로그만 남김 (관리자가 설정해야 함)
      return;
    }

    const currentLimit = Number(config.eacMonthlyTokenLimit ?? 0);
    config.eacMonthlyTokenLimit = currentLimit + tokenAmount;
    await this.aiConfigRepo.save(config);

    this.logger.log(
      `AI monthly token limit updated: entity=${entityId}, ${currentLimit} → ${currentLimit + tokenAmount}`,
    );
  }

  /**
   * 월간 토큰 한도 차감 (환불 롤백)
   */
  private async reverseTopup(entityId: string, tokenAmount: number): Promise<void> {
    const config = await this.aiConfigRepo.findOne({
      where: { entId: entityId, eacDeletedAt: null as any },
    });
    if (!config) return;

    const currentLimit = Number(config.eacMonthlyTokenLimit ?? 0);
    const newLimit = Math.max(0, currentLimit - tokenAmount);
    config.eacMonthlyTokenLimit = newLimit;
    await this.aiConfigRepo.save(config);

    this.logger.log(
      `AI monthly token limit reversed: entity=${entityId}, ${currentLimit} → ${newLimit}`,
    );
  }

  /**
   * 충전 이력 조회
   */
  async findTopups(
    entityId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ items: TopupResponse[]; total: number }> {
    const [items, total] = await this.topupRepo.findAndCount({
      where: { entId: entityId },
      order: { aqtCreatedAt: 'DESC' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });

    return {
      items: items.map((t) => this.mapToResponse(t)),
      total,
    };
  }

  /**
   * PG 트랜잭션의 goodsName/description에서 쿼터 구매 메타데이터 추출
   * goodsName 형식: "QUOTA_PURCHASE:{productId}:{tokenAmount}"
   */
  private parseQuotaMetadata(
    tx: PgTransactionEntity,
  ): { productId: string | null; tokenAmount: number } | null {
    const goodsName = tx.pgtGoodsName || '';
    if (!goodsName.startsWith('QUOTA_PURCHASE:')) return null;

    const parts = goodsName.split(':');
    const productId = parts[1] || null;
    const tokenAmount = Number(parts[2]) || 0;
    if (tokenAmount <= 0) return null;

    return { productId, tokenAmount };
  }

  private mapToResponse(t: AiQuotaTopupEntity): TopupResponse {
    return {
      topupId: t.aqtId,
      entityId: t.entId,
      userId: t.usrId,
      transactionId: t.pgtId,
      productId: t.aqpId,
      tokenAmount: Number(t.aqtTokenAmount),
      price: Number(t.aqtPrice),
      currency: t.aqtCurrency,
      status: t.aqtStatus,
      note: t.aqtNote,
      createdAt: t.aqtCreatedAt,
    };
  }
}
