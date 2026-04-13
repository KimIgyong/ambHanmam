import {
  Controller,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { PortalAnalyticsService } from './analytics.service';
import { CreateSiteEventRequest } from './dto/create-site-event.request';

@Controller('analytics')
export class PortalAnalyticsController {
  constructor(private readonly analyticsService: PortalAnalyticsService) {}

  @Post('events')
  @SkipThrottle()
  async recordEvent(
    @Body() dto: CreateSiteEventRequest,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'];
    await this.analyticsService.recordEvent(dto, ip, userAgent);
    return { success: true };
  }
}
