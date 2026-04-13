import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { StripeService } from '../service/stripe.service';
import { PortalJwtAuthGuard } from '../../auth/guard/portal-jwt-auth.guard';

@Controller('portal/stripe')
export class StripeCheckoutController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  @UseGuards(PortalJwtAuthGuard)
  createCheckout(
    @Request() req: { user: { customerId: string } },
    @Body() body: { planId: string; billingCycle: 'MONTHLY' | 'ANNUAL' },
  ) {
    return this.stripeService.createCheckoutSession(
      req.user.customerId,
      body.planId,
      body.billingCycle,
    );
  }

  @Post('billing-portal')
  @UseGuards(PortalJwtAuthGuard)
  createBillingPortal(@Request() req: { user: { customerId: string } }) {
    return this.stripeService.createBillingPortalSession(req.user.customerId);
  }
}
