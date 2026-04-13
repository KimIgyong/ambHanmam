import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auth } from '../../auth/decorator/auth.decorator';
import { Public } from '../../../global/decorator/public.decorator';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';

import { SubscriptionService } from '../service/subscription.service';
import { TokenWalletService } from '../service/token-wallet.service';
import { StorageQuotaService } from '../service/storage-quota.service';
import {
  CreateSubscriptionRequest,
  PurchaseTokenRequest,
  AddStorageRequest,
} from '../dto/request/subscription.request';
import {
  SubscriptionResponse,
  TokenWalletResponse,
  StorageQuotaResponse,
  PlanResponse,
} from '../dto/response/subscription.response';
import { BillingCycle } from '../entity/subscription.enums';

@ApiTags('Subscription')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly tokenWalletService: TokenWalletService,
    private readonly storageQuotaService: StorageQuotaService,
  ) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: '활성 플랜 목록 조회' })
  async getPlans() {
    const plans = await this.subscriptionService.getPlans();
    return { success: true, data: plans.map(PlanResponse.from) };
  }

  @Get()
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '현재 구독 조회' })
  async getSubscription(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    let subscription =
      await this.subscriptionService.getSubscription(entityId);
    if (!subscription) {
      try {
        subscription =
          await this.subscriptionService.createFreeSubscription(entityId);
        subscription = await this.subscriptionService.getSubscription(entityId);
      } catch {
        subscription = await this.subscriptionService.getSubscription(entityId);
      }
    }
    if (!subscription) {
      return { success: true, data: null };
    }

    const wallets = await this.tokenWalletService.getWallets(entityId);
    let quota = null;
    try {
      quota = await this.storageQuotaService.getOrFail(entityId);
    } catch {
      // no quota yet
    }

    return {
      success: true,
      data: SubscriptionResponse.from(subscription, wallets, quota),
    };
  }

  @Post('checkout')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @HttpCode(200)
  @ApiOperation({ summary: '구독 업그레이드 Checkout' })
  async createCheckout(
    @Body() dto: CreateSubscriptionRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(dto.entity_id, user);
    const successUrl =
      dto.success_url || `${this._frontendUrl()}/subscription?status=success`;
    const result = await this.subscriptionService.createUpgradeCheckout({
      entId: entityId,
      planCode: dto.plan_code,
      userCount: dto.user_count,
      billingCycle: (dto.billing_cycle as BillingCycle) ?? BillingCycle.MONTHLY,
      userEmail: user.email,
      successUrl,
    });

    return { success: true, data: result };
  }

  @Post('cancel')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @HttpCode(200)
  @ApiOperation({ summary: '구독 해지 예약' })
  async cancelSubscription(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    await this.subscriptionService.cancelSubscription(entityId);
    return { success: true, data: { cancelled: true } };
  }

  @Get('tokens')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '토큰 잔액 조회' })
  async getTokenWallets(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const wallets = await this.tokenWalletService.getWallets(entityId);
    return {
      success: true,
      data: {
        wallets: wallets.map(TokenWalletResponse.from),
        totalBalance: wallets.reduce((sum, w) => sum + w.tkw_balance, 0),
      },
    };
  }

  @Post('tokens/purchase')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @HttpCode(200)
  @ApiOperation({ summary: '토큰 추가 충전 Checkout' })
  async purchaseTokens(
    @Body() dto: PurchaseTokenRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(dto.entity_id, user);
    const result = await this.subscriptionService.createTokenPurchaseCheckout({
      entId: entityId,
      tokenAmount: dto.token_amount,
      userEmail: user.email,
      successUrl: `${this._frontendUrl()}/subscription?status=token_success`,
    });

    return { success: true, data: result };
  }

  @Get('storage')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @ApiOperation({ summary: '스토리지 현황 조회' })
  async getStorageQuota(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    try {
      const quota = await this.storageQuotaService.getOrFail(entityId);
      return { success: true, data: StorageQuotaResponse.from(quota) };
    } catch {
      return { success: true, data: null };
    }
  }

  @Post('storage/purchase')
  @Auth()
  @UseGuards(OwnEntityGuard)
  @HttpCode(200)
  @ApiOperation({ summary: '스토리지 추가 구매 Checkout' })
  async purchaseStorage(
    @Body() dto: AddStorageRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(dto.entity_id, user);
    const result =
      await this.subscriptionService.createStoragePurchaseCheckout({
        entId: entityId,
        storageGb: dto.storage_gb,
        userEmail: user.email,
        successUrl: `${this._frontendUrl()}/subscription?status=storage_success`,
      });

    return { success: true, data: result };
  }

  private _frontendUrl(): string {
    return (
      process.env.FRONTEND_URL ??
      process.env.VITE_APP_URL ??
      'http://localhost:5189'
    );
  }
}
