import {
  Injectable, BadRequestException, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { EntityCustomAppEntity } from '../entity/entity-custom-app.entity';
import { CreateCustomAppRequest, UpdateCustomAppRequest } from '../dto/custom-app.dto';
import { UserPayload } from '../../../global/decorator/current-user.decorator';

@Injectable()
export class EntityCustomAppService {
  constructor(
    @InjectRepository(EntityCustomAppEntity)
    private readonly customAppRepo: Repository<EntityCustomAppEntity>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 해당 법인의 전체 커스텀 앱 목록 (관리용)
   */
  async findAll(entityId: string) {
    const apps = await this.customAppRepo.find({
      where: { entId: entityId, ecaDeletedAt: IsNull() },
      order: { ecaSortOrder: 'ASC', ecaCreatedAt: 'ASC' },
    });

    return apps.map((a) => this.toResponse(a));
  }

  /**
   * 사용자 역할에 맞는 활성 앱 목록 (사이드바용)
   */
  async findMyApps(entityId: string, userRole: string) {
    const apps = await this.customAppRepo.find({
      where: { entId: entityId, ecaIsActive: true, ecaDeletedAt: IsNull() },
      order: { ecaSortOrder: 'ASC', ecaCreatedAt: 'ASC' },
    });

    // 역할 필터링: allowedRoles가 null이면 전체 허용, 아니면 포함 여부 확인
    return apps
      .filter((a) => !a.ecaAllowedRoles || a.ecaAllowedRoles.length === 0 || a.ecaAllowedRoles.includes(userRole))
      .map((a) => this.toResponse(a));
  }

  /**
   * 커스텀 앱 등록
   */
  async create(entityId: string, dto: CreateCustomAppRequest, userId: string) {
    // 중복 코드 검증
    const existing = await this.customAppRepo.findOne({
      where: { entId: entityId, ecaCode: dto.code, ecaDeletedAt: IsNull() },
    });
    if (existing) {
      throw new ConflictException(`App code '${dto.code}' already exists in this entity`);
    }

    const app = this.customAppRepo.create({
      entId: entityId,
      ecaCode: dto.code,
      ecaName: dto.name,
      ecaDescription: dto.description || null,
      ecaIcon: dto.icon || 'AppWindow',
      ecaUrl: dto.url,
      ecaAuthMode: dto.auth_mode || 'jwt',
      ecaOpenMode: dto.open_mode || 'iframe',
      ecaApiKeyEnc: dto.auth_mode === 'api_key' && dto.api_key
        ? this.encrypt(dto.api_key)
        : null,
      ecaAllowedRoles: dto.allowed_roles || null,
      ecaSortOrder: dto.sort_order ?? 0,
      ecaRegisteredBy: userId,
    });

    const saved = await this.customAppRepo.save(app);
    return this.toResponse(saved);
  }

  /**
   * 커스텀 앱 수정
   */
  async update(appId: string, entityId: string, dto: UpdateCustomAppRequest) {
    const app = await this.findOneOrFail(appId, entityId);

    if (dto.name !== undefined) app.ecaName = dto.name;
    if (dto.description !== undefined) app.ecaDescription = dto.description || null;
    if (dto.icon !== undefined) app.ecaIcon = dto.icon;
    if (dto.url !== undefined) app.ecaUrl = dto.url;
    if (dto.auth_mode !== undefined) app.ecaAuthMode = dto.auth_mode;
    if (dto.open_mode !== undefined) app.ecaOpenMode = dto.open_mode;
    if (dto.api_key !== undefined && dto.api_key !== '') {
      // 빈 문자열이 아닐 때만 갱신 (빈 값은 기존 키 유지)
      app.ecaApiKeyEnc = this.encrypt(dto.api_key);
    }
    if (dto.allowed_roles !== undefined) app.ecaAllowedRoles = dto.allowed_roles || null;
    if (dto.sort_order !== undefined) app.ecaSortOrder = dto.sort_order;
    if (dto.is_active !== undefined) app.ecaIsActive = dto.is_active;

    const saved = await this.customAppRepo.save(app);
    return this.toResponse(saved);
  }

  /**
   * 커스텀 앱 삭제 (soft delete)
   */
  async remove(appId: string, entityId: string) {
    const app = await this.findOneOrFail(appId, entityId);
    app.ecaDeletedAt = new Date();
    await this.customAppRepo.save(app);
  }

  /**
   * 앱용 JWT 토큰 생성 (외부 앱에 전달)
   */
  async generateAppToken(appId: string, user: UserPayload) {
    const entityId = user.entityId || user.companyId;
    if (!entityId) {
      throw new BadRequestException('Entity context is required');
    }

    const app = await this.findOneOrFail(appId, entityId);

    if (app.ecaAuthMode === 'api_key') {
      if (!app.ecaApiKeyEnc) {
        throw new BadRequestException('API Key is not configured for this app');
      }
      const apiKey = this.decrypt(app.ecaApiKeyEnc);
      return { token: null, apiKey, expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() };
    }

    const payload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      entityId,
      appId: app.ecaId,
      appCode: app.ecaCode,
      scope: 'custom_app:context',
    };

    const token = this.jwtService.sign(payload, { expiresIn: '1h' });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    return { token, expiresAt };
  }

  /**
   * 외부 앱 URL 연결 테스트
   */
  async healthCheck(appId: string, entityId: string) {
    const app = await this.findOneOrFail(appId, entityId);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(app.ecaUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'text/html,application/json' },
      });

      clearTimeout(timeout);

      return {
        success: response.ok,
        status: response.status,
        url: app.ecaUrl,
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        url: app.ecaUrl,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /* ── Private helpers ── */

  private async findOneOrFail(appId: string, entityId: string): Promise<EntityCustomAppEntity> {
    const app = await this.customAppRepo.findOne({
      where: { ecaId: appId, entId: entityId, ecaDeletedAt: IsNull() },
    });
    if (!app) {
      throw new NotFoundException('Custom app not found');
    }
    return app;
  }

  private toResponse(app: EntityCustomAppEntity) {
    const apiKeyMasked = app.ecaApiKeyEnc
      ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' + this.decrypt(app.ecaApiKeyEnc).slice(-4)
      : undefined;

    return {
      id: app.ecaId,
      entityId: app.entId,
      code: app.ecaCode,
      name: app.ecaName,
      description: app.ecaDescription,
      icon: app.ecaIcon,
      url: app.ecaUrl,
      authMode: app.ecaAuthMode,
      openMode: app.ecaOpenMode,
      apiKeyMasked: apiKeyMasked,
      allowedRoles: app.ecaAllowedRoles,
      sortOrder: app.ecaSortOrder,
      isActive: app.ecaIsActive,
      sourcePapId: app.ecaSourcePapId || null,
      createdAt: app.ecaCreatedAt?.toISOString(),
      updatedAt: app.ecaUpdatedAt?.toISOString(),
    };
  }

  /* ── Encryption helpers (AES-256-GCM) ── */

  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    return Buffer.from(key, 'hex');
  }

  private encrypt(text: string): string {
    const key = this.getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  private decrypt(encoded: string): string {
    const key = this.getEncryptionKey();
    const buf = Buffer.from(encoded, 'base64');
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const encryptedData = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encryptedData).toString('utf8') + decipher.final('utf8');
  }
}
