import { Controller, Post, Get, Query, Body, Param, UseGuards, Request, Req } from '@nestjs/common';
import { PaymentGatewayService } from '../service/payment-gateway.service';
import { PortalJwtAuthGuard } from '../../auth/guard/portal-jwt-auth.guard';
import { Request as ExpressRequest } from 'express';

@Controller('portal/payments')
export class PaymentGatewayController {
  constructor(private readonly pgService: PaymentGatewayService) {}

  @Post('create')
  @UseGuards(PortalJwtAuthGuard)
  async createPayment(
    @Request() req: { user: { customerId: string } },
    @Req() expressReq: ExpressRequest,
    @Body() body: {
      amount: number;
      currency: string;
      description: string;
      subscription_id?: string;
      gateway?: string;
      return_url: string;
      cancel_url?: string;
    },
  ) {
    return this.pgService.createPayment({
      customerId: req.user.customerId,
      subscriptionId: body.subscription_id,
      amount: body.amount,
      currency: body.currency,
      description: body.description,
      gateway: body.gateway,
      returnUrl: body.return_url,
      cancelUrl: body.cancel_url,
      ipAddress: expressReq.ip || expressReq.socket.remoteAddress,
      locale: expressReq.headers['accept-language']?.split(',')[0]?.split('-')[0],
    });
  }

  @Get('callback/:gateway')
  async handlePaymentCallback(
    @Param('gateway') gateway: string,
    @Query() queryParams: Record<string, string>,
  ) {
    return this.pgService.handlePaymentReturn(gateway, queryParams);
  }

  @Get('history')
  @UseGuards(PortalJwtAuthGuard)
  async getPaymentHistory(
    @Request() req: { user: { customerId: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pgService.getPaymentHistory(
      req.user.customerId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('gateways')
  @UseGuards(PortalJwtAuthGuard)
  async getAvailableGateways(
    @Query('country') country?: string,
    @Query('currency') currency?: string,
  ) {
    return this.pgService.getAvailableGateways(country, currency);
  }
}
