import { Controller, Post, Headers, Req, HttpCode, Logger, BadRequestException } from '@nestjs/common';
import { StripeService } from '../service/stripe.service';
import { Request } from 'express';

@Controller('portal/stripe/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly stripeService: StripeService) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event;
    try {
      event = this.stripeService.constructWebhookEvent(
        (req as any).rawBody || req.body,
        signature,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    await this.stripeService.handleWebhookEvent(event);
    return { received: true };
  }
}
