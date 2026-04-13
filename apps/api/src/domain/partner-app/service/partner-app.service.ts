import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartnerAppEntity } from '../entity/partner-app.entity';
import { PartnerAppVersionEntity } from '../entity/partner-app-version.entity';

@Injectable()
export class PartnerAppService {
  constructor(
    @InjectRepository(PartnerAppEntity)
    private readonly appRepo: Repository<PartnerAppEntity>,
    @InjectRepository(PartnerAppVersionEntity)
    private readonly versionRepo: Repository<PartnerAppVersionEntity>,
  ) {}

  /** 파트너사 앱 목록 */
  async findAllByPartner(partnerId: string, status?: string) {
    const qb = this.appRepo.createQueryBuilder('app')
      .where('app.ptnId = :partnerId', { partnerId })
      .orderBy('app.papCreatedAt', 'DESC');
    if (status) {
      qb.andWhere('app.papStatus = :status', { status });
    }
    return qb.getMany();
  }

  /** 앱 상세 */
  async findOne(appId: string, partnerId: string) {
    const app = await this.appRepo.findOne({
      where: { papId: appId, ptnId: partnerId },
      relations: ['partner'],
    });
    if (!app) throw new NotFoundException('App not found');
    return app;
  }

  /** 앱 등록 (DRAFT) */
  async create(partnerId: string, userId: string, data: {
    code: string; name: string; description?: string; icon?: string;
    url: string; auth_mode?: string; open_mode?: string; category?: string;
  }) {
    const exists = await this.appRepo.findOne({
      where: { ptnId: partnerId, papCode: data.code },
    });
    if (exists) throw new BadRequestException('App code already exists');

    const app = this.appRepo.create({
      ptnId: partnerId,
      papCode: data.code,
      papName: data.name,
      papDescription: data.description || null,
      papIcon: data.icon || null,
      papUrl: data.url,
      papAuthMode: data.auth_mode || 'jwt',
      papOpenMode: data.open_mode || 'iframe',
      papCategory: data.category || 'GENERAL',
      papStatus: 'DRAFT',
      papVersion: '1.0.0',
      papRegisteredBy: userId,
    });
    return this.appRepo.save(app);
  }

  /** 앱 수정 (DRAFT / REJECTED만 가능) */
  async update(appId: string, partnerId: string, data: {
    name?: string; description?: string; icon?: string;
    url?: string; auth_mode?: string; open_mode?: string; category?: string;
  }) {
    const app = await this.findOne(appId, partnerId);
    if (!['DRAFT', 'REJECTED'].includes(app.papStatus)) {
      throw new BadRequestException('Only DRAFT or REJECTED apps can be edited');
    }

    const updateData: Partial<PartnerAppEntity> = {};
    if (data.name) updateData.papName = data.name;
    if (data.description !== undefined) updateData.papDescription = data.description;
    if (data.icon !== undefined) updateData.papIcon = data.icon;
    if (data.url) updateData.papUrl = data.url;
    if (data.auth_mode) updateData.papAuthMode = data.auth_mode;
    if (data.open_mode) updateData.papOpenMode = data.open_mode;
    if (data.category) updateData.papCategory = data.category;

    await this.appRepo.update(appId, updateData);
    return this.findOne(appId, partnerId);
  }

  /** 심사 제출 (DRAFT → SUBMITTED) */
  async submit(appId: string, partnerId: string) {
    const app = await this.findOne(appId, partnerId);
    if (!['DRAFT', 'REJECTED'].includes(app.papStatus)) {
      throw new BadRequestException('Only DRAFT or REJECTED apps can be submitted');
    }
    await this.appRepo.update(appId, {
      papStatus: 'SUBMITTED',
      papReviewNote: null,
    });
    return this.findOne(appId, partnerId);
  }

  /** 삭제 (DRAFT만 가능) */
  async remove(appId: string, partnerId: string) {
    const app = await this.findOne(appId, partnerId);
    if (app.papStatus !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT apps can be deleted');
    }
    await this.appRepo.softDelete(appId);
    return { success: true };
  }

  /** 버전 목록 */
  async findVersions(appId: string, partnerId: string) {
    await this.findOne(appId, partnerId); // 소유 확인
    return this.versionRepo.find({
      where: { papId: appId },
      order: { pavCreatedAt: 'DESC' },
    });
  }

  /** 새 버전 등록 */
  async createVersion(appId: string, partnerId: string, data: {
    version: string; url?: string; change_log?: string;
  }) {
    const app = await this.findOne(appId, partnerId);
    if (!['APPROVED', 'PUBLISHED'].includes(app.papStatus)) {
      throw new BadRequestException('App must be APPROVED or PUBLISHED to add versions');
    }

    const exists = await this.versionRepo.findOne({
      where: { papId: appId, pavVersion: data.version },
    });
    if (exists) throw new BadRequestException('Version already exists');

    const version = this.versionRepo.create({
      papId: appId,
      pavVersion: data.version,
      pavUrl: data.url || null,
      pavChangeLog: data.change_log || null,
      pavStatus: 'DRAFT',
    });
    return this.versionRepo.save(version);
  }
}
