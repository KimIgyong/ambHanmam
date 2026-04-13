import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { UsageService } from '../service/usage.service';

/**
 * Internal usage recording API — called by service backends (AmoebaTalk, AmoebaOrder, etc.)
 * Protected by API key (not portal JWT)
 */
@Controller('portal/usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Post('record')
  @HttpCode(200)
  async recordUsage(
    @Body() body: {
      api_key: string;
      subscription_id: string;
      metric: string;
      quantity: number;
      period_start?: string;
      period_end?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    // TODO: Validate API key against service API keys
    // For now, accept all requests (will be secured with API key auth in production)

    return this.usageService.recordUsage({
      subscriptionId: body.subscription_id,
      metric: body.metric,
      quantity: body.quantity,
      periodStart: body.period_start ? new Date(body.period_start) : undefined,
      periodEnd: body.period_end ? new Date(body.period_end) : undefined,
      metadata: body.metadata,
    });
  }

  @Post('record/batch')
  @HttpCode(200)
  @UseGuards()
  async recordUsageBatch(
    @Body() body: {
      api_key: string;
      records: {
        subscription_id: string;
        metric: string;
        quantity: number;
        period_start?: string;
        period_end?: string;
      }[];
    },
  ) {
    const results = await Promise.all(
      body.records.map((r) =>
        this.usageService.recordUsage({
          subscriptionId: r.subscription_id,
          metric: r.metric,
          quantity: r.quantity,
          periodStart: r.period_start ? new Date(r.period_start) : undefined,
          periodEnd: r.period_end ? new Date(r.period_end) : undefined,
        }),
      ),
    );

    return { recorded: results.length };
  }
}
