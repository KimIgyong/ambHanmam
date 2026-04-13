import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PartnerAppEntity } from '../../partner-app/entity/partner-app.entity';
import { PartnerAppInstallEntity } from '../../partner-app/entity/partner-app-install.entity';

@Injectable()
export class OAuthClientService {
  constructor(
    @InjectRepository(PartnerAppEntity)
    private readonly appRepo: Repository<PartnerAppEntity>,
    @InjectRepository(PartnerAppInstallEntity)
    private readonly installRepo: Repository<PartnerAppInstallEntity>,
  ) {}

  /** client_id 생성: pap_ + random 24 hex */
  generateClientId(): string {
    return `pap_${crypto.randomBytes(24).toString('hex')}`;
  }

  /** client_secret 생성: random 48 bytes hex */
  generateClientSecret(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  /** client_secret → bcrypt hash */
  async hashClientSecret(secret: string): Promise<string> {
    return bcrypt.hash(secret, 10);
  }

  /** client_secret 검증 */
  async verifyClientSecret(secret: string, hash: string): Promise<boolean> {
    return bcrypt.compare(secret, hash);
  }

  /** client_id로 앱 조회 */
  async findByClientId(clientId: string): Promise<PartnerAppEntity | null> {
    return this.appRepo.findOne({
      where: { papClientId: clientId },
    });
  }

  /** client_id + secret 검증 후 앱 반환 */
  async validateClient(clientId: string, clientSecret: string): Promise<PartnerAppEntity> {
    const app = await this.findByClientId(clientId);
    if (!app) {
      throw new BadRequestException('invalid_client');
    }
    if (app.papStatus !== 'PUBLISHED' && app.papStatus !== 'APPROVED') {
      throw new BadRequestException('invalid_client');
    }
    if (!app.papClientSecretHash) {
      throw new BadRequestException('invalid_client');
    }
    const valid = await this.verifyClientSecret(clientSecret, app.papClientSecretHash);
    if (!valid) {
      throw new BadRequestException('invalid_client');
    }
    return app;
  }

  /** client_id만으로 앱 검증 (public client용 / authorize 단계) */
  async validateClientById(clientId: string): Promise<PartnerAppEntity> {
    const app = await this.findByClientId(clientId);
    if (!app) {
      throw new BadRequestException('invalid_client');
    }
    if (app.papStatus !== 'PUBLISHED' && app.papStatus !== 'APPROVED') {
      throw new BadRequestException('invalid_client');
    }
    return app;
  }

  /** redirect_uri 검증 */
  validateRedirectUri(app: PartnerAppEntity, redirectUri: string): boolean {
    if (!app.papRedirectUris || app.papRedirectUris.length === 0) {
      return false;
    }
    return app.papRedirectUris.includes(redirectUri);
  }

  /** 앱 설치 조회 (앱 + 법인) */
  async findInstall(appId: string, entityId: string): Promise<PartnerAppInstallEntity | null> {
    return this.installRepo.findOne({
      where: { papId: appId, paiEntityId: entityId },
    });
  }

  /** 승인 시 client_id + client_secret 발급 */
  async issueClientCredentials(appId: string): Promise<{ clientId: string; clientSecret: string }> {
    const app = await this.appRepo.findOne({ where: { papId: appId } });
    if (!app) throw new NotFoundException('App not found');

    // 이미 발급된 경우 재발급
    const clientId = app.papClientId || this.generateClientId();
    const clientSecret = this.generateClientSecret();
    const secretHash = await this.hashClientSecret(clientSecret);

    await this.appRepo.update(appId, {
      papClientId: clientId,
      papClientSecretHash: secretHash,
    });

    return { clientId, clientSecret };
  }
}
