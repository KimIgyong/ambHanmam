import { Body, Controller, Headers, Post } from '@nestjs/common';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { Auth } from '../../auth/decorator/auth.decorator';
import { Public } from '../../../global/decorator/public.decorator';
import { PolarService } from '../service/polar.service';
import { CreatePolarCheckoutRequest } from '../dto/request/create-polar-checkout.request';
import { CreatePolarAddonCheckoutRequest } from '../dto/request/create-polar-addon-checkout.request';
import { CreatePolarCustomerPortalRequest } from '../dto/request/create-polar-customer-portal.request';

@Controller('polar')
export class PolarController {
  constructor(private readonly polarService: PolarService) {}

  @Post('checkout')
  @Auth()
  async createCheckout(
    @Body() request: CreatePolarCheckoutRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.polarService.createCheckout(request, user.userId, user.entityId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('addon-checkout')
  @Auth()
  async createAddonCheckout(
    @Body() request: CreatePolarAddonCheckoutRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.polarService.createAddonCheckout(request, user.userId, user.entityId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('customer-portal')
  @Auth()
  async createCustomerPortal(
    @Body() request: CreatePolarCustomerPortalRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.polarService.createCustomerPortal(user.userId, user.entityId, request.return_url);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('webhook')
  @Public()
  async handleWebhook(
    @Body() payload: Record<string, unknown>,
    @Headers('polar-signature') signature?: string,
  ) {
    const data = await this.polarService.handleWebhook(payload, signature);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
