import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SubPlanEntity } from '../entity/sub-plan.entity';
import { SubPlanFeatureEntity } from '../entity/sub-plan-feature.entity';
import { SubPlanTierEntity } from '../entity/sub-plan-tier.entity';
import { SubPlanAddonEntity } from '../entity/sub-plan-addon.entity';

import {
  UpdatePlanRequest,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  CreateTierRequest,
  UpdateTierRequest,
  CreateAddonRequest,
  UpdateAddonRequest,
} from '../dto/request/plan-admin.request';

@Injectable()
export class PlanAdminService {
  constructor(
    @InjectRepository(SubPlanEntity)
    private readonly planRepo: Repository<SubPlanEntity>,
    @InjectRepository(SubPlanFeatureEntity)
    private readonly featureRepo: Repository<SubPlanFeatureEntity>,
    @InjectRepository(SubPlanTierEntity)
    private readonly tierRepo: Repository<SubPlanTierEntity>,
    @InjectRepository(SubPlanAddonEntity)
    private readonly addonRepo: Repository<SubPlanAddonEntity>,
  ) {}

  // ── Plans ──────────────────────────────────────────────

  async getAllPlans(): Promise<SubPlanEntity[]> {
    return this.planRepo.find({ order: { pln_sort_order: 'ASC' } });
  }

  async updatePlan(planId: string, dto: UpdatePlanRequest): Promise<SubPlanEntity> {
    const plan = await this.planRepo.findOne({ where: { pln_id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  // ── Features ───────────────────────────────────────────

  async getAllFeatures(): Promise<SubPlanFeatureEntity[]> {
    return this.featureRepo.find({ order: { plf_sort_order: 'ASC' } });
  }

  async getActiveFeatures(): Promise<SubPlanFeatureEntity[]> {
    return this.featureRepo.find({
      where: { plf_is_active: true },
      order: { plf_sort_order: 'ASC' },
    });
  }

  async createFeature(dto: CreateFeatureRequest): Promise<SubPlanFeatureEntity> {
    const entity = this.featureRepo.create({
      plf_feature_key: dto.feature_key,
      plf_label_i18n_key: dto.label_i18n_key,
      plf_value_free: dto.value_free ?? null,
      plf_value_basic: dto.value_basic ?? null,
      plf_value_premium: dto.value_premium ?? null,
      plf_is_check: dto.is_check ?? false,
      plf_highlight: dto.highlight ?? false,
      plf_sort_order: dto.sort_order ?? 0,
    });
    return this.featureRepo.save(entity);
  }

  async updateFeature(
    featureId: string,
    dto: UpdateFeatureRequest,
  ): Promise<SubPlanFeatureEntity> {
    const feature = await this.featureRepo.findOne({ where: { plf_id: featureId } });
    if (!feature) throw new NotFoundException('Feature not found');

    if (dto.feature_key !== undefined) feature.plf_feature_key = dto.feature_key;
    if (dto.label_i18n_key !== undefined) feature.plf_label_i18n_key = dto.label_i18n_key;
    if (dto.value_free !== undefined) feature.plf_value_free = dto.value_free;
    if (dto.value_basic !== undefined) feature.plf_value_basic = dto.value_basic;
    if (dto.value_premium !== undefined) feature.plf_value_premium = dto.value_premium;
    if (dto.is_check !== undefined) feature.plf_is_check = dto.is_check;
    if (dto.highlight !== undefined) feature.plf_highlight = dto.highlight;
    if (dto.sort_order !== undefined) feature.plf_sort_order = dto.sort_order;
    if (dto.is_active !== undefined) feature.plf_is_active = dto.is_active;

    return this.featureRepo.save(feature);
  }

  async deleteFeature(featureId: string): Promise<void> {
    const result = await this.featureRepo.delete({ plf_id: featureId });
    if (result.affected === 0) throw new NotFoundException('Feature not found');
  }

  // ── Tiers ──────────────────────────────────────────────

  async getTiersByPlan(planCode: string): Promise<SubPlanTierEntity[]> {
    const plan = await this.planRepo.findOne({ where: { pln_code: planCode } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.tierRepo.find({
      where: { pln_id: plan.pln_id },
      order: { plt_sort_order: 'ASC', plt_tier_number: 'ASC' },
    });
  }

  async getActiveTiersByPlan(planCode: string): Promise<SubPlanTierEntity[]> {
    const plan = await this.planRepo.findOne({ where: { pln_code: planCode } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.tierRepo.find({
      where: { pln_id: plan.pln_id, plt_is_active: true },
      order: { plt_sort_order: 'ASC', plt_tier_number: 'ASC' },
    });
  }

  async createTier(dto: CreateTierRequest): Promise<SubPlanTierEntity> {
    const plan = await this.planRepo.findOne({ where: { pln_id: dto.pln_id } });
    if (!plan) throw new NotFoundException('Plan not found');

    const entity = this.tierRepo.create({
      pln_id: dto.pln_id,
      plt_tier_number: dto.tier_number,
      plt_users_min: dto.users_min,
      plt_users_max: dto.users_max,
      plt_monthly_price: dto.monthly_price,
      plt_annual_price: dto.annual_price,
      plt_savings: dto.savings ?? 0,
      plt_tokens_monthly: dto.tokens_monthly,
      plt_sort_order: dto.sort_order ?? 0,
    });
    return this.tierRepo.save(entity);
  }

  async updateTier(tierId: string, dto: UpdateTierRequest): Promise<SubPlanTierEntity> {
    const tier = await this.tierRepo.findOne({ where: { plt_id: tierId } });
    if (!tier) throw new NotFoundException('Tier not found');

    if (dto.tier_number !== undefined) tier.plt_tier_number = dto.tier_number;
    if (dto.users_min !== undefined) tier.plt_users_min = dto.users_min;
    if (dto.users_max !== undefined) tier.plt_users_max = dto.users_max;
    if (dto.monthly_price !== undefined) tier.plt_monthly_price = dto.monthly_price;
    if (dto.annual_price !== undefined) tier.plt_annual_price = dto.annual_price;
    if (dto.savings !== undefined) tier.plt_savings = dto.savings;
    if (dto.tokens_monthly !== undefined) tier.plt_tokens_monthly = dto.tokens_monthly;
    if (dto.sort_order !== undefined) tier.plt_sort_order = dto.sort_order;
    if (dto.is_active !== undefined) tier.plt_is_active = dto.is_active;

    return this.tierRepo.save(tier);
  }

  async deleteTier(tierId: string): Promise<void> {
    const result = await this.tierRepo.delete({ plt_id: tierId });
    if (result.affected === 0) throw new NotFoundException('Tier not found');
  }

  // ── Addons ─────────────────────────────────────────────

  async getAllAddons(): Promise<SubPlanAddonEntity[]> {
    return this.addonRepo.find({ order: { pla_sort_order: 'ASC' } });
  }

  async getActiveAddons(): Promise<SubPlanAddonEntity[]> {
    return this.addonRepo.find({
      where: { pla_is_active: true },
      order: { pla_sort_order: 'ASC' },
    });
  }

  async createAddon(dto: CreateAddonRequest): Promise<SubPlanAddonEntity> {
    const entity = this.addonRepo.create({
      pla_addon_key: dto.addon_key,
      pla_label_i18n_key: dto.label_i18n_key,
      pla_value_free: dto.value_free ?? null,
      pla_value_basic: dto.value_basic ?? null,
      pla_unit: dto.unit ?? null,
      pla_price: dto.price ?? null,
      pla_sort_order: dto.sort_order ?? 0,
    });
    return this.addonRepo.save(entity);
  }

  async updateAddon(addonId: string, dto: UpdateAddonRequest): Promise<SubPlanAddonEntity> {
    const addon = await this.addonRepo.findOne({ where: { pla_id: addonId } });
    if (!addon) throw new NotFoundException('Addon not found');

    if (dto.addon_key !== undefined) addon.pla_addon_key = dto.addon_key;
    if (dto.label_i18n_key !== undefined) addon.pla_label_i18n_key = dto.label_i18n_key;
    if (dto.value_free !== undefined) addon.pla_value_free = dto.value_free;
    if (dto.value_basic !== undefined) addon.pla_value_basic = dto.value_basic;
    if (dto.unit !== undefined) addon.pla_unit = dto.unit;
    if (dto.price !== undefined) addon.pla_price = dto.price;
    if (dto.sort_order !== undefined) addon.pla_sort_order = dto.sort_order;
    if (dto.is_active !== undefined) addon.pla_is_active = dto.is_active;

    return this.addonRepo.save(addon);
  }

  async deleteAddon(addonId: string): Promise<void> {
    const result = await this.addonRepo.delete({ pla_id: addonId });
    if (result.affected === 0) throw new NotFoundException('Addon not found');
  }

  // ── Full (Public) ──────────────────────────────────────

  async getFullPricingData() {
    const [plans, features, addons] = await Promise.all([
      this.planRepo.find({
        where: { pln_is_active: true },
        order: { pln_sort_order: 'ASC' },
      }),
      this.getActiveFeatures(),
      this.getActiveAddons(),
    ]);

    // Gather tiers for each plan that has tiers
    const tiersMap: Record<string, SubPlanTierEntity[]> = {};
    for (const plan of plans) {
      const tiers = await this.tierRepo.find({
        where: { pln_id: plan.pln_id, plt_is_active: true },
        order: { plt_sort_order: 'ASC', plt_tier_number: 'ASC' },
      });
      if (tiers.length > 0) {
        tiersMap[plan.pln_code] = tiers;
      }
    }

    return { plans, features, addons, tiers: tiersMap };
  }
}
