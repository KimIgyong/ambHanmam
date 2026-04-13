import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PartnerAppEntity } from '../entity/partner-app.entity';

@Injectable()
export class AdminPartnerAppService {
  constructor(
    @InjectRepository(PartnerAppEntity)
    private readonly appRepo: Repository<PartnerAppEntity>,
  ) {}

  /** OAuth 클라이언트 목록 */
  async findOAuthClients() {
    const apps = await this.appRepo.find({
      where: { papAuthMode: 'oauth2' },
      order: { papCreatedAt: 'ASC' },
    });
    return apps.map((app) => ({
      id: app.papId,
      code: app.papCode,
      name: app.papName,
      clientId: app.papClientId,
      redirectUris: app.papRedirectUris || [],
      scopes: app.papScopes || [],
      status: app.papStatus,
      authMode: app.papAuthMode,
    }));
  }

  /** OAuth client credentials 재발급 */
  async reissueCredentials(appId: string, adminUserId: string) {
    const app = await this.findOne(appId);
    if (app.papAuthMode !== 'oauth2') {
      throw new BadRequestException('Only OAuth2 apps can have credentials reissued');
    }
    const clientId = app.papClientId || `pap_${crypto.randomBytes(24).toString('hex')}`;
    const clientSecret = crypto.randomBytes(48).toString('hex');
    const secretHash = await bcrypt.hash(clientSecret, 10);

    await this.appRepo.update(appId, {
      papClientId: clientId,
      papClientSecretHash: secretHash,
    });

    return { clientCredentials: { clientId, clientSecret } };
  }

  /** 전체 파트너 앱 목록 (필터 지원) */
  async findAll(filters?: { status?: string; partnerId?: string }) {
    const qb = this.appRepo.createQueryBuilder('app')
      .leftJoinAndSelect('app.partner', 'partner')
      .orderBy('app.papCreatedAt', 'DESC');

    if (filters?.status) {
      qb.andWhere('app.papStatus = :status', { status: filters.status });
    }
    if (filters?.partnerId) {
      qb.andWhere('app.ptnId = :partnerId', { partnerId: filters.partnerId });
    }
    return qb.getMany();
  }

  /** 앱 상세 */
  async findOne(appId: string) {
    const app = await this.appRepo.findOne({
      where: { papId: appId },
      relations: ['partner'],
    });
    if (!app) throw new NotFoundException('App not found');
    return app;
  }

  /** 심사 시작 (SUBMITTED → IN_REVIEW) */
  async startReview(appId: string, adminUserId: string) {
    const app = await this.findOne(appId);
    if (app.papStatus !== 'SUBMITTED') {
      throw new BadRequestException('Only SUBMITTED apps can be reviewed');
    }
    await this.appRepo.update(appId, {
      papStatus: 'IN_REVIEW',
      papReviewedBy: adminUserId,
    });
    return this.findOne(appId);
  }

  /** 승인 (IN_REVIEW → APPROVED) + OAuth client credentials 발급 */
  async approve(appId: string, adminUserId: string): Promise<{
    app: PartnerAppEntity;
    clientCredentials?: { clientId: string; clientSecret: string };
  }> {
    const app = await this.findOne(appId);
    if (app.papStatus !== 'IN_REVIEW') {
      throw new BadRequestException('Only IN_REVIEW apps can be approved');
    }

    const updateData: Partial<PartnerAppEntity> = {
      papStatus: 'APPROVED',
      papReviewedBy: adminUserId,
      papReviewedAt: new Date(),
      papReviewNote: null,
    };

    // OAuth 모드인 경우 client credentials 발급
    let clientCredentials: { clientId: string; clientSecret: string } | undefined;
    if (app.papAuthMode === 'oauth2' || app.papAuthMode === 'OAUTH2') {
      const clientId = app.papClientId || `pap_${crypto.randomBytes(24).toString('hex')}`;
      const clientSecret = crypto.randomBytes(48).toString('hex');
      const secretHash = await bcrypt.hash(clientSecret, 10);

      updateData.papClientId = clientId;
      updateData.papClientSecretHash = secretHash;
      clientCredentials = { clientId, clientSecret };
    }

    await this.appRepo.update(appId, updateData);
    const updatedApp = await this.findOne(appId);
    return { app: updatedApp, clientCredentials };
  }

  /** 거절 (IN_REVIEW → REJECTED) */
  async reject(appId: string, adminUserId: string, reviewNote: string) {
    const app = await this.findOne(appId);
    if (app.papStatus !== 'IN_REVIEW') {
      throw new BadRequestException('Only IN_REVIEW apps can be rejected');
    }
    await this.appRepo.update(appId, {
      papStatus: 'REJECTED',
      papReviewedBy: adminUserId,
      papReviewedAt: new Date(),
      papReviewNote: reviewNote,
    });
    return this.findOne(appId);
  }

  /** 발행 (APPROVED → PUBLISHED) */
  async publish(appId: string, adminUserId: string) {
    const app = await this.findOne(appId);
    if (app.papStatus !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED apps can be published');
    }
    await this.appRepo.update(appId, {
      papStatus: 'PUBLISHED',
      papPublishedAt: new Date(),
    });
    return this.findOne(appId);
  }

  /** 정지 (→ SUSPENDED) */
  async suspend(appId: string, adminUserId: string, reason?: string) {
    const app = await this.findOne(appId);
    if (!['PUBLISHED', 'APPROVED'].includes(app.papStatus)) {
      throw new BadRequestException('Only PUBLISHED or APPROVED apps can be suspended');
    }
    await this.appRepo.update(appId, {
      papStatus: 'SUSPENDED',
      papReviewedBy: adminUserId,
      papReviewNote: reason || null,
    });
    return this.findOne(appId);
  }
}
