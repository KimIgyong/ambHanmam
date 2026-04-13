import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettingsEntity } from '../entity/site-settings.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UpdateSiteSettingsRequest } from '../dto/request/update-site-settings.request';
import { SiteSettingsResponse } from '@amb/types';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSettingsEntity)
    private readonly repo: Repository<SiteSettingsEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
  ) {}

  private async resolveEntId(entId?: string): Promise<string | null> {
    if (entId) return entId;
    const first = await this.entityRepo.findOne({ where: {}, order: { entCode: 'ASC' } });
    return first?.entId ?? null;
  }

  async getSettings(entId?: string): Promise<SiteSettingsResponse> {
    const resolvedEntId = await this.resolveEntId(entId);
    const entity = resolvedEntId
      ? await this.repo.findOne({ where: { entId: resolvedEntId } })
      : null;

    if (!entity) {
      return this.emptyResponse();
    }

    return this.toResponse(entity);
  }

  async updateSettings(
    entId: string | undefined,
    dto: UpdateSiteSettingsRequest,
    userId: string,
  ): Promise<SiteSettingsResponse> {
    const resolvedEntId = await this.resolveEntId(entId);
    if (!resolvedEntId) {
      throw new NotFoundException('No entity found for site settings');
    }

    let entity = await this.repo.findOne({ where: { entId: resolvedEntId } });

    if (!entity) {
      entity = this.repo.create({ entId: resolvedEntId });
    }

    if (dto.portal_url !== undefined) entity.stsPortalUrl = dto.portal_url || null;
    if (dto.portal_domain !== undefined) entity.stsPortalDomain = dto.portal_domain || null;
    if (dto.allowed_ips !== undefined) entity.stsAllowedIps = dto.allowed_ips;
    if (dto.allowed_domains !== undefined) entity.stsAllowedDomains = dto.allowed_domains;
    if (dto.is_public !== undefined) entity.stsIsPublic = dto.is_public;
    if (dto.logo_url !== undefined) entity.stsLogoUrl = dto.logo_url || null;
    if (dto.favicon_url !== undefined) entity.stsFaviconUrl = dto.favicon_url || null;
    if (dto.index_enabled !== undefined) entity.stsIndexEnabled = dto.index_enabled;
    if (dto.index_html !== undefined) entity.stsIndexHtml = dto.index_html || null;
    entity.stsUpdatedBy = userId;

    const saved = await this.repo.save(entity);
    return this.toResponse(saved);
  }

  async getIndexPage(): Promise<{ enabled: boolean; html: string | null }> {
    const resolvedEntId = await this.resolveEntId();
    if (!resolvedEntId) return { enabled: false, html: null };
    const entity = await this.repo.findOne({ where: { entId: resolvedEntId } });
    if (!entity) return { enabled: false, html: null };
    return { enabled: entity.stsIndexEnabled, html: entity.stsIndexHtml };
  }

  private emptyResponse(): SiteSettingsResponse {
    return {
      portalUrl: null,
      portalDomain: null,
      allowedIps: [],
      allowedDomains: [],
      isPublic: false,
      logoUrl: null,
      faviconUrl: null,
      indexEnabled: false,
      indexHtml: null,
      updatedAt: null,
    };
  }

  private toResponse(entity: SiteSettingsEntity): SiteSettingsResponse {
    return {
      portalUrl: entity.stsPortalUrl,
      portalDomain: entity.stsPortalDomain,
      allowedIps: entity.stsAllowedIps || [],
      allowedDomains: entity.stsAllowedDomains || [],
      isPublic: entity.stsIsPublic,
      logoUrl: entity.stsLogoUrl,
      faviconUrl: entity.stsFaviconUrl,
      indexEnabled: entity.stsIndexEnabled,
      indexHtml: entity.stsIndexHtml,
      updatedAt: entity.stsUpdatedAt?.toISOString() ?? null,
    };
  }
}
