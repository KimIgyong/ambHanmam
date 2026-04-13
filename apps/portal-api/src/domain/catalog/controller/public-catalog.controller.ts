import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PublicCatalogService } from '../service/public-catalog.service';

@Controller('portal/services')
export class PublicCatalogController {
  constructor(private readonly catalogService: PublicCatalogService) {}

  @Get()
  getServices() {
    return this.catalogService.getServices();
  }

  @Get(':code')
  async getServiceByCode(@Param('code') code: string) {
    const service = await this.catalogService.getServiceByCode(code);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }
}
