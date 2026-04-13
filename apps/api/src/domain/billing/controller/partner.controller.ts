import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PartnerService } from '../service/partner.service';
import { CreatePartnerRequest } from '../dto/request/create-partner.request';
import { UpdatePartnerRequest } from '../dto/request/update-partner.request';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Billing - Partners')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('billing/partners')
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Get()
  @ApiOperation({ summary: '거래처 목록 조회' })
  async findAll(@Req() req: any, @Query() query: any) {
    const data = await this.partnerService.findAll(req.entityId, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '거래처 상세 조회' })
  async findById(@Param('id') id: string, @Req() req: any) {
    const data = await this.partnerService.findById(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '거래처 등록' })
  async create(@Body() dto: CreatePartnerRequest, @Req() req: any) {
    const data = await this.partnerService.create(dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '거래처 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdatePartnerRequest, @Req() req: any) {
    const data = await this.partnerService.update(id, dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: '거래처 삭제' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.partnerService.delete(id, req.entityId);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
