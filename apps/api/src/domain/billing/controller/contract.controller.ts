import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContractService } from '../service/contract.service';
import { CreateContractRequest } from '../dto/request/create-contract.request';
import { UpdateContractRequest } from '../dto/request/update-contract.request';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Billing - Contracts')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('billing/contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  @ApiOperation({ summary: '계약 목록 조회' })
  async findAll(@Req() req: any, @Query() query: any) {
    const result = await this.contractService.findAll(req.entityId, query);
    return { success: true, data: result.data, pagination: result.pagination, timestamp: new Date().toISOString() };
  }

  @Get('expiring')
  @ApiOperation({ summary: '만료 임박 계약 조회' })
  async findExpiring(@Req() req: any, @Query('days') days?: string) {
    const data = await this.contractService.findExpiring(req.entityId, days ? parseInt(days) : 30);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '계약 상세 조회' })
  async findById(@Param('id') id: string, @Req() req: any) {
    const data = await this.contractService.findById(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/history')
  @ApiOperation({ summary: '계약 변경 이력 조회' })
  async findHistory(@Param('id') id: string, @Req() req: any) {
    const data = await this.contractService.findHistory(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '계약 등록' })
  async create(@Body() dto: CreateContractRequest, @Req() req: any) {
    const data = await this.contractService.create(dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '계약 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateContractRequest, @Req() req: any) {
    const data = await this.contractService.update(id, dto, req.entityId, req.user?.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: '계약 삭제' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.contractService.delete(id, req.entityId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Post(':id/renew')
  @ApiOperation({ summary: '계약 갱신' })
  async renew(@Param('id') id: string, @Req() req: any) {
    const data = await this.contractService.renewContract(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
