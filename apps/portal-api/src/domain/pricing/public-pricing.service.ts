import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubPlanEntity } from '../../shared-entities/sub-plan.entity';
import { SubPlanFeatureEntity } from '../../shared-entities/sub-plan-feature.entity';
import { SubPlanTierEntity } from '../../shared-entities/sub-plan-tier.entity';
import { SubPlanAddonEntity } from '../../shared-entities/sub-plan-addon.entity';

@Injectable()
export class PublicPricingService {
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

  async getFullPricingData() {
    const [plans, features, addons] = await Promise.all([
      this.planRepo.find({
        where: { pln_is_active: true },
        order: { pln_sort_order: 'ASC' },
      }),
      this.featureRepo.find({
        where: { plf_is_active: true },
        order: { plf_sort_order: 'ASC' },
      }),
      this.addonRepo.find({
        where: { pla_is_active: true },
        order: { pla_sort_order: 'ASC' },
      }),
    ]);

    const tiersMap: Record<string, SubPlanTierEntity[]> = {};
    for (const plan of plans) {
      const tiers = await this.tierRepo.find({
        where: { pln_id: plan.pln_id, plt_is_active: true },
        order: { plt_sort_order: 'ASC' },
      });
      tiersMap[plan.pln_code] = tiers;
    }

    return {
      success: true,
      data: {
        plans: plans.map((p) => ({
          planId: p.pln_id,
          code: p.pln_code,
          name: p.pln_name,
          tier: p.pln_tier,
          pricePerUser: Number(p.pln_price_per_user),
          tokenOnetime: p.pln_token_onetime,
          tokenPerUserMonthly: p.pln_token_per_user_monthly,
          tokenAddonUnit: p.pln_token_addon_unit,
          tokenAddonPrice: Number(p.pln_token_addon_price),
          isTokenMonthlyReset: p.pln_is_token_monthly_reset,
          storageBaseGb: p.pln_storage_base_gb,
          storageMaxGb: p.pln_storage_max_gb,
          storageAddonUnitGb: p.pln_storage_addon_unit_gb,
          storageAddonPriceGb: Number(p.pln_storage_addon_price_gb),
          maxUsers: p.pln_max_users,
          minUsers: p.pln_min_users,
          userSlotSize: p.pln_user_slot_size,
          freeUserCount: p.pln_free_user_count,
          isAnnualAvailable: p.pln_is_annual_available,
          annualFreeMonths: p.pln_annual_free_months,
          isReferralEnabled: p.pln_is_referral_enabled,
          referralRewardTokens: p.pln_referral_reward_tokens,
          referralInviteRequired: p.pln_referral_invite_required,
          sortOrder: p.pln_sort_order,
        })),
        features: features.map((f) => ({
          featureId: f.plf_id,
          featureKey: f.plf_feature_key,
          labelI18nKey: f.plf_label_i18n_key,
          valueFree: f.plf_value_free,
          valueBasic: f.plf_value_basic,
          valuePremium: f.plf_value_premium,
          isCheck: f.plf_is_check,
          highlight: f.plf_highlight,
          sortOrder: f.plf_sort_order,
        })),
        tiers: tiersMap,
        addons: addons.map((a) => ({
          addonId: a.pla_id,
          addonKey: a.pla_addon_key,
          labelI18nKey: a.pla_label_i18n_key,
          valueFree: a.pla_value_free,
          valueBasic: a.pla_value_basic,
          unit: a.pla_unit,
          price: a.pla_price,
          sortOrder: a.pla_sort_order,
        })),
      },
    };
  }
}
