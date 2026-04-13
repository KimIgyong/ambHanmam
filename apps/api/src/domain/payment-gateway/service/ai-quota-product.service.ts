import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AiQuotaProductEntity } from '../entity/ai-quota-product.entity';

export interface CreateProductDto {
  name: string;
  description?: string;
  tokenAmount: number;
  price: number;
  currency?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdBy?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  tokenAmount?: number;
  price?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ProductResponse {
  productId: string;
  name: string;
  description: string | null;
  tokenAmount: number;
  price: number;
  currency: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class AiQuotaProductService {
  private readonly logger = new Logger(AiQuotaProductService.name);

  constructor(
    @InjectRepository(AiQuotaProductEntity)
    private readonly productRepo: Repository<AiQuotaProductEntity>,
  ) {}

  async findAll(activeOnly = false): Promise<ProductResponse[]> {
    const where: Record<string, unknown> = { aqpDeletedAt: IsNull() };
    if (activeOnly) where.aqpIsActive = true;

    const products = await this.productRepo.find({
      where,
      order: { aqpSortOrder: 'ASC', aqpCreatedAt: 'ASC' },
    });

    return products.map((p) => this.mapToResponse(p));
  }

  async findOne(productId: string): Promise<ProductResponse> {
    const product = await this.productRepo.findOne({
      where: { aqpId: productId, aqpDeletedAt: IsNull() },
    });
    if (!product) throw new NotFoundException('Quota product not found');
    return this.mapToResponse(product);
  }

  async create(dto: CreateProductDto): Promise<ProductResponse> {
    if (dto.tokenAmount <= 0 || dto.price <= 0) {
      throw new BadRequestException('Token amount and price must be positive');
    }

    const product = this.productRepo.create({
      aqpName: dto.name,
      aqpDescription: dto.description || null,
      aqpTokenAmount: String(dto.tokenAmount),
      aqpPrice: String(dto.price),
      aqpCurrency: dto.currency || 'VND',
      aqpSortOrder: dto.sortOrder ?? 0,
      aqpIsActive: dto.isActive ?? true,
      aqpCreatedBy: dto.createdBy || null,
    });

    const saved = await this.productRepo.save(product);
    return this.mapToResponse(saved);
  }

  async update(productId: string, dto: UpdateProductDto): Promise<ProductResponse> {
    const product = await this.productRepo.findOne({
      where: { aqpId: productId, aqpDeletedAt: IsNull() },
    });
    if (!product) throw new NotFoundException('Quota product not found');

    if (dto.name !== undefined) product.aqpName = dto.name;
    if (dto.description !== undefined) product.aqpDescription = dto.description || null;
    if (dto.tokenAmount !== undefined) product.aqpTokenAmount = String(dto.tokenAmount);
    if (dto.price !== undefined) product.aqpPrice = String(dto.price);
    if (dto.sortOrder !== undefined) product.aqpSortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) product.aqpIsActive = dto.isActive;

    const saved = await this.productRepo.save(product);
    return this.mapToResponse(saved);
  }

  async remove(productId: string): Promise<void> {
    const product = await this.productRepo.findOne({
      where: { aqpId: productId, aqpDeletedAt: IsNull() },
    });
    if (!product) throw new NotFoundException('Quota product not found');
    product.aqpDeletedAt = new Date();
    await this.productRepo.save(product);
  }

  private mapToResponse(p: AiQuotaProductEntity): ProductResponse {
    return {
      productId: p.aqpId,
      name: p.aqpName,
      description: p.aqpDescription,
      tokenAmount: Number(p.aqpTokenAmount),
      price: Number(p.aqpPrice),
      currency: p.aqpCurrency,
      sortOrder: p.aqpSortOrder,
      isActive: p.aqpIsActive,
      createdAt: p.aqpCreatedAt,
    };
  }
}
