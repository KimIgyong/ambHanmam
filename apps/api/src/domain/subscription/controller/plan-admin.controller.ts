import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auth } from '../../auth/decorator/auth.decorator';
import { Public } from '../../../global/decorator/public.decorator';
import { AdminLevelGuard } from '../../../global/guard/admin-level.guard';

import { PlanAdminService } from '../service/plan-admin.service';
import {
  UpdatePlanRequest,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  CreateTierRequest,
  UpdateTierRequest,
  CreateAddonRequest,
  UpdateAddonRequest,
} from '../dto/request/plan-admin.request';
import { PlanResponse } from '../dto/response/subscription.response';
import {
  PlanFeatureResponse,
  PlanTierResponse,
  PlanAddonResponse,
} from '../dto/response/plan-admin.response';

@ApiTags('Plan Admin')
@Controller('subscriptions')
export class PlanAdminController {
  constructor(private readonly planAdminService: PlanAdminService) {}

  // ── Public endpoints ───────────────────────────────────

  @Get('plans/features')
  @Public()
  @ApiOperation({ summary: '비교 항목 목록 (Public)' })
  async getFeatures() {
    const features = await this.planAdminService.getActiveFeatures();
    return { success: true, data: features.map(PlanFeatureResponse.from) };
  }

  @Get('plans/tiers/:planCode')
  @Public()
  @ApiOperation({ summary: '플랜 티어 목록 (Public)' })
  async getTiers(@Param('planCode') planCode: string) {
    const tiers = await this.planAdminService.getActiveTiersByPlan(planCode.toUpperCase());
    return { success: true, data: tiers.map(PlanTierResponse.from) };
  }

  @Get('plans/addons')
  @Public()
  @ApiOperation({ summary: 'ADD-ON 상품 목록 (Public)' })
  async getAddons() {
    const addons = await this.planAdminService.getActiveAddons();
    return { success: true, data: addons.map(PlanAddonResponse.from) };
  }

  @Get('plans/full')
  @Public()
  @ApiOperation({ summary: '플랜+비교+티어+애드온 통합 조회 (Public)' })
  async getFullPricing() {
    const data = await this.planAdminService.getFullPricingData();
    return {
      success: true,
      data: {
        plans: data.plans.map(PlanResponse.from),
        features: data.features.map(PlanFeatureResponse.from),
        addons: data.addons.map(PlanAddonResponse.from),
        tiers: Object.fromEntries(
          Object.entries(data.tiers).map(([code, items]) => [
            code,
            items.map(PlanTierResponse.from),
          ]),
        ),
      },
    };
  }

  // ── Admin: Plans ───────────────────────────────────────

  @Get('admin/plans')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '플랜 전체 조회 (Admin)' })
  async getAdminPlans() {
    const plans = await this.planAdminService.getAllPlans();
    return { success: true, data: plans.map(PlanResponse.from) };
  }

  @Put('admin/plans/:planId')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '플랜 수정 (Admin)' })
  async updatePlan(
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanRequest,
  ) {
    const plan = await this.planAdminService.updatePlan(planId, dto);
    return { success: true, data: PlanResponse.from(plan) };
  }

  // ── Admin: Features ────────────────────────────────────

  @Get('admin/features')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '비교 항목 전체 조회 (Admin)' })
  async getAdminFeatures() {
    const features = await this.planAdminService.getAllFeatures();
    return { success: true, data: features.map(PlanFeatureResponse.from) };
  }

  @Post('admin/features')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '비교 항목 추가 (Admin)' })
  async createFeature(@Body() dto: CreateFeatureRequest) {
    const feature = await this.planAdminService.createFeature(dto);
    return { success: true, data: PlanFeatureResponse.from(feature) };
  }

  @Put('admin/features/:featureId')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '비교 항목 수정 (Admin)' })
  async updateFeature(
    @Param('featureId') featureId: string,
    @Body() dto: UpdateFeatureRequest,
  ) {
    const feature = await this.planAdminService.updateFeature(featureId, dto);
    return { success: true, data: PlanFeatureResponse.from(feature) };
  }

  @Delete('admin/features/:featureId')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '비교 항목 삭제 (Admin)' })
  async deleteFeature(@Param('featureId') featureId: string) {
    await this.planAdminService.deleteFeature(featureId);
    return { success: true, data: { deleted: true } };
  }

  // ── Admin: Tiers ───────────────────────────────────────

  @Get('admin/tiers/:planCode')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '티어 목록 조회 (Admin)' })
  async getAdminTiers(@Param('planCode') planCode: string) {
    const tiers = await this.planAdminService.getTiersByPlan(planCode.toUpperCase());
    return { success: true, data: tiers.map(PlanTierResponse.from) };
  }

  @Post('admin/tiers')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '티어 추가 (Admin)' })
  async createTier(@Body() dto: CreateTierRequest) {
    const tier = await this.planAdminService.createTier(dto);
    return { success: true, data: PlanTierResponse.from(tier) };
  }

  @Put('admin/tiers/:tierId')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '티어 수정 (Admin)' })
  async updateTier(
    @Param('tierId') tierId: string,
    @Body() dto: UpdateTierRequest,
  ) {
    const tier = await this.planAdminService.updateTier(tierId, dto);
    return { success: true, data: PlanTierResponse.from(tier) };
  }

  @Delete('admin/tiers/:tierId')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '티어 삭제 (Admin)' })
  async deleteTier(@Param('tierId') tierId: string) {
    await this.planAdminService.deleteTier(tierId);
    return { success: true, data: { deleted: true } };
  }

  // ── Admin: Addons ──────────────────────────────────────

  @Get('admin/addons')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '애드온 전체 조회 (Admin)' })
  async getAdminAddons() {
    const addons = await this.planAdminService.getAllAddons();
    return { success: true, data: addons.map(PlanAddonResponse.from) };
  }

  @Post('admin/addons')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '애드온 추가 (Admin)' })
  async createAddon(@Body() dto: CreateAddonRequest) {
    const addon = await this.planAdminService.createAddon(dto);
    return { success: true, data: PlanAddonResponse.from(addon) };
  }

  @Put('admin/addons/:addonId')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '애드온 수정 (Admin)' })
  async updateAddon(
    @Param('addonId') addonId: string,
    @Body() dto: UpdateAddonRequest,
  ) {
    const addon = await this.planAdminService.updateAddon(addonId, dto);
    return { success: true, data: PlanAddonResponse.from(addon) };
  }

  @Delete('admin/addons/:addonId')
  @Auth()
  @UseGuards(AdminLevelGuard)
  @ApiOperation({ summary: '애드온 삭제 (Admin)' })
  async deleteAddon(@Param('addonId') addonId: string) {
    await this.planAdminService.deleteAddon(addonId);
    return { success: true, data: { deleted: true } };
  }
}
