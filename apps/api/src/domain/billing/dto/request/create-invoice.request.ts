import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceItemRequest {
  @IsNumber()
  seq: number;

  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;

  @IsNumber()
  amount: number;
}

export class CreateInvoiceRequest {
  @IsString()
  partner_id: string;

  @IsOptional()
  @IsString()
  contract_id?: string;

  @IsOptional()
  @IsString()
  sow_id?: string;

  @IsString()
  direction: string;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  due_date?: string;

  @IsOptional()
  @IsString()
  service_period_start?: string;

  @IsOptional()
  @IsString()
  service_period_end?: string;

  @IsNumber()
  subtotal: number;

  @IsOptional()
  @IsNumber()
  tax_rate?: number;

  @IsOptional()
  @IsNumber()
  tax_amount?: number;

  @IsNumber()
  total: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  internal_code?: string;

  @IsOptional()
  @IsString()
  tax_invoice_type?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemRequest)
  items?: CreateInvoiceItemRequest[];
}
