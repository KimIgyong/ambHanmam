import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsArray,
  ValidateNested, IsIn, IsDateString, Min, ArrayMinSize,
  IsBoolean, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseItemRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsNumber()
  @Min(0)
  tax_amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}

export class CreateExpenseRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(['PRE_APPROVAL', 'POST_APPROVAL'])
  type: string;

  @IsIn(['ONE_TIME', 'RECURRING'])
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsDateString()
  expense_date: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  // 정기 지출 필드
  @IsIn(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'])
  @IsOptional()
  period?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsInt()
  @IsOptional()
  payment_day?: number;

  // 승인자
  @IsString()
  @IsOptional()
  approver1_id?: string;

  @IsString()
  @IsOptional()
  approver2_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseItemRequest)
  @ArrayMinSize(1)
  items: CreateExpenseItemRequest[];
}
