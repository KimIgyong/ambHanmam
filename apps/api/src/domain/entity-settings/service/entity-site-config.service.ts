import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntitySiteConfigEntity } from '../entity/entity-site-config.entity';
import { EntityMenuTipEntity } from '../entity/entity-menu-tip.entity';

@Injectable()
export class EntitySiteConfigService {
  constructor(
    @InjectRepository(EntitySiteConfigEntity)
    private readonly configRepo: Repository<EntitySiteConfigEntity>,
    @InjectRepository(EntityMenuTipEntity)
    private readonly tipRepo: Repository<EntityMenuTipEntity>,
  ) {}

  /* ── Site Config ── */

  async getSiteConfig(entityId: string) {
    let config = await this.configRepo.findOne({ where: { entId: entityId } });
    if (!config) {
      config = this.configRepo.create({ entId: entityId });
    }
    return {
      loginModalEnabled: config.escLoginModalEnabled,
      loginModalTitle: config.escLoginModalTitle,
      loginModalContent: config.escLoginModalContent,
    };
  }

  async upsertSiteConfig(
    entityId: string,
    dto: { login_modal_enabled?: boolean; login_modal_title?: string; login_modal_content?: string },
  ) {
    let config = await this.configRepo.findOne({ where: { entId: entityId } });
    if (!config) {
      config = this.configRepo.create({ entId: entityId });
    }
    if (dto.login_modal_enabled !== undefined) config.escLoginModalEnabled = dto.login_modal_enabled;
    if (dto.login_modal_title !== undefined) config.escLoginModalTitle = dto.login_modal_title || null;
    if (dto.login_modal_content !== undefined) config.escLoginModalContent = dto.login_modal_content || null;
    await this.configRepo.save(config);
    return this.getSiteConfig(entityId);
  }

  /** 로그인 모달 데이터 (인증 사용자용) */
  async getLoginModal(entityId: string) {
    const config = await this.configRepo.findOne({ where: { entId: entityId } });
    if (!config || !config.escLoginModalEnabled) return { enabled: false };
    return {
      enabled: true,
      title: config.escLoginModalTitle,
      content: config.escLoginModalContent,
    };
  }

  /* ── Menu Tips ── */

  async getMenuTips(entityId: string) {
    const tips = await this.tipRepo.find({
      where: { entId: entityId },
      order: { emtSortOrder: 'ASC', emtMenuCode: 'ASC' },
    });
    return tips.map((t) => ({
      id: t.emtId,
      menuCode: t.emtMenuCode,
      title: t.emtTitle,
      content: t.emtContent,
      isActive: t.emtIsActive,
      sortOrder: t.emtSortOrder,
    }));
  }

  async getMenuTip(entityId: string, menuCode: string) {
    const tip = await this.tipRepo.findOne({
      where: { entId: entityId, emtMenuCode: menuCode },
    });
    if (!tip || !tip.emtIsActive) return null;
    return {
      menuCode: tip.emtMenuCode,
      title: tip.emtTitle,
      content: tip.emtContent,
    };
  }

  async upsertMenuTip(
    entityId: string,
    menuCode: string,
    dto: { title?: string; content?: string; is_active?: boolean; sort_order?: number },
  ) {
    let tip = await this.tipRepo.findOne({
      where: { entId: entityId, emtMenuCode: menuCode },
    });
    if (!tip) {
      tip = this.tipRepo.create({ entId: entityId, emtMenuCode: menuCode });
    }
    if (dto.title !== undefined) tip.emtTitle = dto.title || null;
    if (dto.content !== undefined) tip.emtContent = dto.content || null;
    if (dto.is_active !== undefined) tip.emtIsActive = dto.is_active;
    if (dto.sort_order !== undefined) tip.emtSortOrder = dto.sort_order;
    await this.tipRepo.save(tip);
    return this.getMenuTips(entityId);
  }
}
