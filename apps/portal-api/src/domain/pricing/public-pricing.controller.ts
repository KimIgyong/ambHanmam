import { Controller, Get, Param } from '@nestjs/common';
import { PublicPricingService } from './public-pricing.service';

@Controller('pricing')
export class PublicPricingController {
  constructor(private readonly pricingService: PublicPricingService) {}

  @Get('full')
  async getFullPricingData() {
    return this.pricingService.getFullPricingData();
  }
}
