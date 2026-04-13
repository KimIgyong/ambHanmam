import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { createHash } from 'crypto';
import { PgConfigEntity } from '../entity/pg-config.entity';
import { CryptoService } from '../../settings/service/crypto.service';
import { CreatePgConfigRequest } from '../dto/create-pg-config.request';
import { UpdatePgConfigRequest } from '../dto/update-pg-config.request';
import { PgConfigResponse, PgConnectionTestResult } from '@amb/types';

const MEGAPAY_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.megapay.vn',
  production: 'https://pg.megapay.vn',
};

@Injectable()
export class PgConfigService {
  private readonly logger = new Logger(PgConfigService.name);

  constructor(
    @InjectRepository(PgConfigEntity)
    private readonly pgConfigRepo: Repository<PgConfigEntity>,
    private readonly cryptoService: CryptoService,
  ) {}

  async findAll(entityId?: string): Promise<PgConfigResponse[]> {
    const where: Record<string, unknown> = { pgcDeletedAt: IsNull() };
    if (entityId) {
      where.entId = entityId;
    }
    const configs = await this.pgConfigRepo.find({
      where,
      order: { pgcCreatedAt: 'DESC' },
    });
    return configs.map((c) => this.mapToResponse(c));
  }

  async findOne(id: string): Promise<PgConfigResponse> {
    const config = await this.pgConfigRepo.findOne({
      where: { pgcId: id, pgcDeletedAt: IsNull() },
    });
    if (!config) {
      throw new NotFoundException('PG configuration not found');
    }
    return this.mapToResponse(config);
  }

  async create(dto: CreatePgConfigRequest, userId: string): Promise<PgConfigResponse> {
    const encodeKey = this.cryptoService.encrypt(dto.encode_key);
    const refundKey = this.cryptoService.encrypt(dto.refund_key);
    const cancelPw = this.cryptoService.encrypt(dto.cancel_pw);

    const config = this.pgConfigRepo.create({
      entId: dto.entity_id || null,
      pgcProvider: dto.provider,
      pgcMerchantId: dto.merchant_id,
      pgcEncodeKeyEncrypted: encodeKey.encrypted,
      pgcEncodeKeyIv: encodeKey.iv,
      pgcEncodeKeyTag: encodeKey.tag,
      pgcEncodeKeyLast4: dto.encode_key.slice(-4),
      pgcRefundKeyEncrypted: refundKey.encrypted,
      pgcRefundKeyIv: refundKey.iv,
      pgcRefundKeyTag: refundKey.tag,
      pgcRefundKeyLast4: dto.refund_key.slice(-4),
      pgcCancelPwEncrypted: cancelPw.encrypted,
      pgcCancelPwIv: cancelPw.iv,
      pgcCancelPwTag: cancelPw.tag,
      pgcCancelPwLast4: dto.cancel_pw.slice(-4),
      pgcEnvironment: dto.environment || 'sandbox',
      pgcCallbackUrl: dto.callback_url || null,
      pgcNotiUrl: dto.noti_url || null,
      pgcWindowColor: dto.window_color || '#ef5459',
      pgcCurrency: dto.currency || 'VND',
      pgcIsActive: dto.is_active ?? true,
      pgcCreatedBy: userId,
    });

    const saved = await this.pgConfigRepo.save(config);
    return this.mapToResponse(saved);
  }

  async update(id: string, dto: UpdatePgConfigRequest): Promise<PgConfigResponse> {
    const config = await this.pgConfigRepo.findOne({
      where: { pgcId: id, pgcDeletedAt: IsNull() },
    });
    if (!config) {
      throw new NotFoundException('PG configuration not found');
    }

    if (dto.merchant_id !== undefined) config.pgcMerchantId = dto.merchant_id;
    if (dto.environment !== undefined) config.pgcEnvironment = dto.environment;
    if (dto.callback_url !== undefined) config.pgcCallbackUrl = dto.callback_url;
    if (dto.noti_url !== undefined) config.pgcNotiUrl = dto.noti_url;
    if (dto.window_color !== undefined) config.pgcWindowColor = dto.window_color;
    if (dto.currency !== undefined) config.pgcCurrency = dto.currency;
    if (dto.is_active !== undefined) config.pgcIsActive = dto.is_active;

    if (dto.encode_key) {
      const enc = this.cryptoService.encrypt(dto.encode_key);
      config.pgcEncodeKeyEncrypted = enc.encrypted;
      config.pgcEncodeKeyIv = enc.iv;
      config.pgcEncodeKeyTag = enc.tag;
      config.pgcEncodeKeyLast4 = dto.encode_key.slice(-4);
    }
    if (dto.refund_key) {
      const enc = this.cryptoService.encrypt(dto.refund_key);
      config.pgcRefundKeyEncrypted = enc.encrypted;
      config.pgcRefundKeyIv = enc.iv;
      config.pgcRefundKeyTag = enc.tag;
      config.pgcRefundKeyLast4 = dto.refund_key.slice(-4);
    }
    if (dto.cancel_pw) {
      const enc = this.cryptoService.encrypt(dto.cancel_pw);
      config.pgcCancelPwEncrypted = enc.encrypted;
      config.pgcCancelPwIv = enc.iv;
      config.pgcCancelPwTag = enc.tag;
      config.pgcCancelPwLast4 = dto.cancel_pw.slice(-4);
    }

    const saved = await this.pgConfigRepo.save(config);
    return this.mapToResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const config = await this.pgConfigRepo.findOne({
      where: { pgcId: id, pgcDeletedAt: IsNull() },
    });
    if (!config) {
      throw new NotFoundException('PG configuration not found');
    }
    await this.pgConfigRepo.softDelete(id);
  }

  async testConnection(id: string): Promise<PgConnectionTestResult> {
    const config = await this.pgConfigRepo.findOne({
      where: { pgcId: id, pgcDeletedAt: IsNull() },
    });
    if (!config) {
      throw new NotFoundException('PG configuration not found');
    }

    const encodeKey = this.cryptoService.decrypt(
      config.pgcEncodeKeyEncrypted,
      config.pgcEncodeKeyIv,
      config.pgcEncodeKeyTag,
    );
    const hashKeyRefund = this.cryptoService.decrypt(
      config.pgcRefundKeyEncrypted,
      config.pgcRefundKeyIv,
      config.pgcRefundKeyTag,
    );

    const timeStamp = this.getTimestamp();
    const rawHash = config.pgcMerchantId + encodeKey + hashKeyRefund + timeStamp;
    const hash = createHash('sha256').update(rawHash).digest('hex');

    const baseUrl = MEGAPAY_URLS[config.pgcEnvironment] || MEGAPAY_URLS.sandbox;
    const url = `${baseUrl}/pg_was/checkInfoIntegrateMerId.do`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merId: config.pgcMerchantId,
          encodeKey,
          hashKeyRefund,
          timeStamp,
          hash,
        }),
      });

      const data = await response.json();
      const status = Number(data.status);

      const messages: Record<number, string> = {
        0: 'Merchant ID is not registered',
        1: 'Connection successful — merchant is valid',
        2: 'Encode key or hash key mismatch',
        3: 'Merchant is suspended or locked',
      };

      return {
        success: status === 1,
        status,
        message: messages[status] || `Unknown status: ${status}`,
      };
    } catch (error) {
      this.logger.error('MegaPay connection test failed:', error);
      return {
        success: false,
        status: -1,
        message: `Connection failed: ${(error as Error).message}`,
      };
    }
  }

  /** 활성 PG 설정 조회 (내부 서비스용) */
  async getActiveConfig(entityId?: string): Promise<PgConfigEntity | null> {
    const where: Record<string, unknown> = {
      pgcIsActive: true,
      pgcDeletedAt: IsNull(),
    };
    if (entityId) where.entId = entityId;
    return this.pgConfigRepo.findOne({ where, order: { pgcCreatedAt: 'DESC' } });
  }

  /** 키 복호화 (내부 서비스용) */
  decryptKeys(config: PgConfigEntity) {
    return {
      encodeKey: this.cryptoService.decrypt(
        config.pgcEncodeKeyEncrypted,
        config.pgcEncodeKeyIv,
        config.pgcEncodeKeyTag,
      ),
      hashKeyRefund: this.cryptoService.decrypt(
        config.pgcRefundKeyEncrypted,
        config.pgcRefundKeyIv,
        config.pgcRefundKeyTag,
      ),
      cancelPw: this.cryptoService.decrypt(
        config.pgcCancelPwEncrypted,
        config.pgcCancelPwIv,
        config.pgcCancelPwTag,
      ),
    };
  }

  private getTimestamp(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${y}${m}${d}${h}${mi}${s}`;
  }

  private mapToResponse(c: PgConfigEntity): PgConfigResponse {
    return {
      pgConfigId: c.pgcId,
      entityId: c.entId,
      provider: c.pgcProvider as 'MEGAPAY',
      merchantId: c.pgcMerchantId,
      environment: c.pgcEnvironment as 'sandbox' | 'production',
      callbackUrl: c.pgcCallbackUrl || '',
      notiUrl: c.pgcNotiUrl || '',
      windowColor: c.pgcWindowColor,
      currency: c.pgcCurrency,
      isActive: c.pgcIsActive,
      encodeKeyLast4: c.pgcEncodeKeyLast4,
      refundKeyLast4: c.pgcRefundKeyLast4,
      cancelPwLast4: c.pgcCancelPwLast4,
      createdBy: c.pgcCreatedBy,
      createdAt: c.pgcCreatedAt?.toISOString(),
      updatedAt: c.pgcUpdatedAt?.toISOString(),
    };
  }
}
