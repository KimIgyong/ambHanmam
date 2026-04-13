import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { AiQuotaProductService } from '../service/ai-quota-product.service';
import { AiQuotaTopupService } from '../service/ai-quota-topup.service';
import { MegapayService } from '../service/megapay.service';
import { CreateQuotaProductRequest } from '../dto/create-quota-product.request';
import { PurchaseQuotaRequest } from '../dto/purchase-quota.request';

@Controller('ai-quota')
export class AiQuotaController {
  constructor(
    private readonly productService: AiQuotaProductService,
    private readonly topupService: AiQuotaTopupService,
    private readonly megapayService: MegapayService,
  ) {}

  /**
   * 구매 가능 상품 목록 (일반 사용자)
   */
  @Get('products')
  async getProducts() {
    const products = await this.productService.findAll(true);
    return { success: true, data: products };
  }

  /**
   * 전체 상품 목록 (관리자)
   */
  @Get('products/all')
  @UseGuards(AdminGuard)
  async getAllProducts() {
    const products = await this.productService.findAll(false);
    return { success: true, data: products };
  }

  /**
   * 상품 생성 (관리자)
   */
  @Post('products')
  @UseGuards(AdminGuard)
  async createProduct(
    @Body() dto: CreateQuotaProductRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const product = await this.productService.create({
      name: dto.name,
      description: dto.description,
      tokenAmount: dto.token_amount,
      price: dto.price,
      currency: dto.currency,
      sortOrder: dto.sort_order,
      isActive: dto.is_active,
      createdBy: user.userId,
    });
    return { success: true, data: product };
  }

  /**
   * 상품 수정 (관리자)
   */
  @Put('products/:id')
  @UseGuards(AdminGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: Partial<CreateQuotaProductRequest>,
  ) {
    const product = await this.productService.update(id, {
      name: dto.name,
      description: dto.description,
      tokenAmount: dto.token_amount,
      price: dto.price,
      sortOrder: dto.sort_order,
      isActive: dto.is_active,
    });
    return { success: true, data: product };
  }

  /**
   * 상품 삭제 (관리자)
   */
  @Delete('products/:id')
  @UseGuards(AdminGuard)
  async deleteProduct(@Param('id') id: string) {
    await this.productService.remove(id);
    return { success: true };
  }

  /**
   * 쿼터 구매 요청 → Payment Link 생성
   */
  @Post('purchase')
  async purchaseQuota(
    @Body() dto: PurchaseQuotaRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const product = await this.productService.findOne(dto.product_id);
    if (!product.isActive) {
      return { success: false, error: 'Product is not available' };
    }

    // goodsName에 메타데이터 인코딩: QUOTA_PURCHASE:{productId}:{tokenAmount}
    const goodsName = `QUOTA_PURCHASE:${product.productId}:${product.tokenAmount}`;

    const result = await this.megapayService.createPaymentLink({
      entityId: user.companyId || user.entityId || '',
      userId: user.userId,
      amount: product.price,
      goodsName,
      buyerEmail: user.email,
      buyerName: '',
      description: `AI Token Pack: ${product.name}`,
    });

    return { success: true, data: result };
  }

  /**
   * 충전 이력 조회
   */
  @Get('topups')
  async getTopups(
    @CurrentUser() user: UserPayload,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const entityId = user.companyId || user.entityId || '';
    const result = await this.topupService.findTopups(entityId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    return { success: true, data: result };
  }
}
