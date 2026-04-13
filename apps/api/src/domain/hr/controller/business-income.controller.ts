import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessIncomeService } from '../service/business-income.service';
import { CreateBusinessIncomeRequest } from '../dto/request/create-business-income.request';
import { UpdateBusinessIncomeRequest } from '../dto/request/update-business-income.request';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Business Income')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/business-income')
export class BusinessIncomeController {
  constructor(private readonly businessIncomeService: BusinessIncomeService) {}

  @Get()
  @ApiOperation({ summary: '사업소득 목록 조회' })
  async getPayments(@Req() req: any, @Query('year_month') yearMonth?: string) {
    const data = await this.businessIncomeService.getPayments(req.entityId, yearMonth);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '사업소득 상세 조회' })
  async getPaymentById(@Param('id') id: string, @Req() req: any) {
    const data = await this.businessIncomeService.getPaymentById(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '사업소득 생성' })
  async createPayment(@Body() request: CreateBusinessIncomeRequest, @Req() req: any) {
    const data = await this.businessIncomeService.createPayment(req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '사업소득 수정' })
  async updatePayment(
    @Param('id') id: string,
    @Body() request: UpdateBusinessIncomeRequest,
    @Req() req: any,
  ) {
    const data = await this.businessIncomeService.updatePayment(id, req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '사업소득 삭제' })
  async deletePayment(@Param('id') id: string, @Req() req: any) {
    await this.businessIncomeService.deletePayment(id, req.entityId);
  }
}
