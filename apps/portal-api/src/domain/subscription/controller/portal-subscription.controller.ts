import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { PortalSubscriptionService } from '../service/portal-subscription.service';
import { PortalJwtAuthGuard } from '../../auth/guard/portal-jwt-auth.guard';

@Controller('portal/subscriptions')
export class PortalSubscriptionController {
  constructor(private readonly subscriptionService: PortalSubscriptionService) {}

  @Get()
  @UseGuards(PortalJwtAuthGuard)
  getSubscriptions(@Request() req: { user: { customerId: string } }) {
    return this.subscriptionService.getSubscriptions(req.user.customerId);
  }

  @Get(':id')
  @UseGuards(PortalJwtAuthGuard)
  getSubscriptionDetail(
    @Request() req: { user: { customerId: string } },
    @Param('id') id: string,
  ) {
    return this.subscriptionService.getSubscriptionDetail(req.user.customerId, id);
  }
}
