import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SowService } from '../service/sow.service';
import { CreateSowRequest } from '../dto/request/create-sow.request';
import { UpdateSowRequest } from '../dto/request/update-sow.request';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Billing - SOW')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('billing/sow')
export class SowController {
  constructor(private readonly sowService: SowService) {}

  @Get()
  @ApiOperation({ summary: 'SOW 목록 조회' })
  async findAll(@Req() req: any, @Query() query: any) {
    const data = await this.sowService.findAll(req.entityId, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'SOW 상세 조회' })
  async findById(@Param('id') id: string, @Req() req: any) {
    const data = await this.sowService.findById(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'SOW 등록' })
  async create(@Body() dto: CreateSowRequest, @Req() req: any) {
    const data = await this.sowService.create(dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'SOW 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateSowRequest, @Req() req: any) {
    const data = await this.sowService.update(id, dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'SOW 삭제' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.sowService.delete(id, req.entityId);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
