import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { MegapayService } from '../service/megapay.service';
import { CreatePaymentRequest } from '../dto/create-payment.request';
import { RefundPaymentRequest } from '../dto/refund-payment.request';

@Controller('payment-gateway/payments')
export class PgPaymentController {
  constructor(private readonly megapayService: MegapayService) {}

  /**
   * 결제 링크 생성 요청
   */
  @Post()
  async createPayment(
    @Body() dto: CreatePaymentRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.megapayService.createPaymentLink({
      entityId: user.entityId || user.companyId || '',
      userId: user.userId,
      amount: dto.amount,
      goodsName: dto.goods_name,
      buyerEmail: dto.buyer_email || user.email,
      buyerName: dto.buyer_name,
      payType: dto.pay_type,
      description: dto.description,
    });

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 결제 내역 조회 (본인 법인)
   */
  @Get()
  async listPayments(
    @CurrentUser() user: UserPayload,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const entityId = user.entityId || user.companyId || '';
    const result = await this.megapayService.findTransactions(entityId, {
      status,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 전체 결제 내역 조회 (관리자 전용)
   */
  @UseGuards(AdminGuard)
  @Get('admin/all')
  async listAllPayments(
    @Query('status') status?: string,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.megapayService.findAllTransactions({
      status,
      entityId,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 결제 상세
   */
  @Get(':id')
  async getPayment(@Param('id') id: string) {
    const result = await this.megapayService.findTransaction(id);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 거래 상태 조회 (MegaPay API 호출)
   */
  @Get(':id/status')
  async queryPaymentStatus(@Param('id') id: string) {
    const result = await this.megapayService.queryTransaction(id);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 환불 요청 (관리자 전용)
   */
  @UseGuards(AdminGuard)
  @Post(':id/refund')
  async refundPayment(
    @Param('id') id: string,
    @Body() dto: RefundPaymentRequest,
  ) {
    const result = await this.megapayService.refund(id, dto.reason);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }
}
