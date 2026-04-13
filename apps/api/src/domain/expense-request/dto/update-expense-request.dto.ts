import {
  IsString, IsOptional, IsNumber, IsArray,
  ValidateNested, IsIn, IsDateString, Min, IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateExpenseItemRequest } from './create-expense-request.dto';

export class UpdateExpenseRequestDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsIn(['PRE_APPROVAL', 'POST_APPROVAL'])
  @IsOptional()
  type?: string;

  @IsIn(['ONE_TIME', 'RECURRING'])
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsDateString()
  @IsOptional()
  expense_date?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  currency?: string;

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

  @IsString()
  @IsOptional()
  approver1_id?: string;

  @IsString()
  @IsOptional()
  approver2_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseItemRequest)
  @IsOptional()
  items?: CreateExpenseItemRequest[];
}
