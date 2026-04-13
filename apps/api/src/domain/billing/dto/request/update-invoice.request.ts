import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceItemRequest } from './create-invoice.request';

export class UpdateInvoiceRequest {
  @IsOptional()
  @IsString()
  contract_id?: string;

  @IsOptional()
  @IsString()
  sow_id?: string;

  @IsOptional()
  @IsString()
  direction?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  due_date?: string;

  @IsOptional()
  @IsString()
  service_period_start?: string;

  @IsOptional()
  @IsString()
  service_period_end?: string;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  tax_rate?: number;

  @IsOptional()
  @IsNumber()
  tax_amount?: number;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsString()
  status?: string;

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
