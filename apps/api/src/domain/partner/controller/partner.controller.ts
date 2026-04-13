import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
} from '@nestjs/common';
import { AdminOnly } from '../../auth/decorator/auth.decorator';
import { PartnerService } from '../service/partner.service';
import { CreatePartnerRequest } from '../dto/request/create-partner.request';
import { UpdatePartnerRequest } from '../dto/request/update-partner.request';

@Controller('admin/partners')
@AdminOnly()
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.partnerService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.partnerService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePartnerRequest) {
    return this.partnerService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePartnerRequest) {
    return this.partnerService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.partnerService.remove(id);
  }
}
