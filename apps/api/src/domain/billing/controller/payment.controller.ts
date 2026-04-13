import {
  Controller, Get, Post, Delete,
  Param, Body, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from '../service/payment.service';
import { CreatePaymentRequest } from '../dto/request/create-payment.request';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Billing - Payments')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('billing/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @ApiOperation({ summary: 'Payment 목록 조회' })
  async findAll(@Req() req: any, @Query() query: any) {
    const data = await this.paymentService.findAll(req.entityId, query);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('by-invoice/:invoiceId')
  @ApiOperation({ summary: 'Invoice별 Payment 조회' })
  async findByInvoice(@Param('invoiceId') invoiceId: string, @Req() req: any) {
    const data = await this.paymentService.findByInvoice(invoiceId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('outstanding')
  @ApiOperation({ summary: '미수금/미지급 현황' })
  async getOutstanding(@Req() req: any) {
    const data = await this.paymentService.getOutstandingSummary(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'Payment 등록' })
  async create(@Body() dto: CreatePaymentRequest, @Req() req: any) {
    const data = await this.paymentService.create(dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Payment 삭제 (입금 취소)' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.paymentService.delete(id, req.entityId);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
