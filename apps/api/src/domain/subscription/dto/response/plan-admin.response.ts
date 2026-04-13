import { SubPlanFeatureEntity } from '../../entity/sub-plan-feature.entity';
import { SubPlanTierEntity } from '../../entity/sub-plan-tier.entity';
import { SubPlanAddonEntity } from '../../entity/sub-plan-addon.entity';

export class PlanFeatureResponse {
  featureId: string;
  featureKey: string;
  labelI18nKey: string;
  valueFree: string | null;
  valueBasic: string | null;
  valuePremium: string | null;
  isCheck: boolean;
  highlight: boolean;
  sortOrder: number;
  isActive: boolean;

  static from(e: SubPlanFeatureEntity): PlanFeatureResponse {
    return {
      featureId: e.plf_id,
      featureKey: e.plf_feature_key,
      labelI18nKey: e.plf_label_i18n_key,
      valueFree: e.plf_value_free,
      valueBasic: e.plf_value_basic,
      valuePremium: e.plf_value_premium,
      isCheck: e.plf_is_check,
      highlight: e.plf_highlight,
      sortOrder: e.plf_sort_order,
      isActive: e.plf_is_active,
    };
  }
}

export class PlanTierResponse {
  tierId: string;
  planId: string;
  tierNumber: number;
  usersMin: number;
  usersMax: number;
  monthlyPrice: number;
  annualPrice: number;
  savings: number;
  tokensMonthly: number;
  sortOrder: number;
  isActive: boolean;

  static from(e: SubPlanTierEntity): PlanTierResponse {
    return {
      tierId: e.plt_id,
      planId: e.pln_id,
      tierNumber: e.plt_tier_number,
      usersMin: e.plt_users_min,
      usersMax: e.plt_users_max,
      monthlyPrice: Number(e.plt_monthly_price),
      annualPrice: Number(e.plt_annual_price),
      savings: Number(e.plt_savings),
      tokensMonthly: e.plt_tokens_monthly,
      sortOrder: e.plt_sort_order,
      isActive: e.plt_is_active,
    };
  }
}

export class PlanAddonResponse {
  addonId: string;
  addonKey: string;
  labelI18nKey: string;
  valueFree: string | null;
  valueBasic: string | null;
  unit: string | null;
  price: string | null;
  sortOrder: number;
  isActive: boolean;

  static from(e: SubPlanAddonEntity): PlanAddonResponse {
    return {
      addonId: e.pla_id,
      addonKey: e.pla_addon_key,
      labelI18nKey: e.pla_label_i18n_key,
      valueFree: e.pla_value_free,
      valueBasic: e.pla_value_basic,
      unit: e.pla_unit,
      price: e.pla_price,
      sortOrder: e.pla_sort_order,
      isActive: e.pla_is_active,
    };
  }
}
