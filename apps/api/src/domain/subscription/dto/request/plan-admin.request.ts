import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Plan Update ──────────────────────────────────────────
export class UpdatePlanRequest {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) pln_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() pln_price_per_user?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_token_onetime?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_token_per_user_monthly?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_token_addon_unit?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() pln_token_addon_price?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pln_is_token_monthly_reset?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_storage_base_gb?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_storage_max_gb?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_storage_addon_unit_gb?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() pln_storage_addon_price_gb?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_storage_warn_pct?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_storage_block_pct?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_max_users?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_min_users?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_user_slot_size?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_free_user_count?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pln_is_referral_enabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_referral_reward_tokens?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_referral_invite_required?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pln_is_annual_available?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_annual_free_months?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pln_is_active?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() pln_sort_order?: number;
}

// ── Feature CRUD ─────────────────────────────────────────
export class CreateFeatureRequest {
  @ApiProperty() @IsString() @MaxLength(50) feature_key: string;
  @ApiProperty() @IsString() @MaxLength(100) label_i18n_key: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) value_free?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) value_basic?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) value_premium?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_check?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() highlight?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() sort_order?: number;
}

export class UpdateFeatureRequest {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) feature_key?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) label_i18n_key?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) value_free?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) value_basic?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) value_premium?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_check?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() highlight?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() sort_order?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

// ── Tier CRUD ────────────────────────────────────────────
export class CreateTierRequest {
  @ApiProperty() @IsUUID() pln_id: string;
  @ApiProperty() @IsInt() tier_number: number;
  @ApiProperty() @IsInt() @Min(1) users_min: number;
  @ApiProperty() @IsInt() @Min(1) users_max: number;
  @ApiProperty() @IsNumber() monthly_price: number;
  @ApiProperty() @IsNumber() annual_price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() savings?: number;
  @ApiProperty() @IsInt() tokens_monthly: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() sort_order?: number;
}

export class UpdateTierRequest {
  @ApiPropertyOptional() @IsOptional() @IsInt() tier_number?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) users_min?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) users_max?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() monthly_price?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() annual_price?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() savings?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() tokens_monthly?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() sort_order?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

// ── Addon CRUD ───────────────────────────────────────────
export class CreateAddonRequest {
  @ApiProperty() @IsString() @MaxLength(50) addon_key: string;
  @ApiProperty() @IsString() @MaxLength(100) label_i18n_key: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) value_free?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) value_basic?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) price?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sort_order?: number;
}

export class UpdateAddonRequest {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) addon_key?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) label_i18n_key?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) value_free?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) value_basic?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) price?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sort_order?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}
