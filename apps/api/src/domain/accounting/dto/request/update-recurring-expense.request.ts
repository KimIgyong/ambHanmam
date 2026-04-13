import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, MaxLength } from 'class-validator';

export class UpdateRecurringExpenseRequest {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  bac_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  vendor?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(31)
  day_of_month?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  start_date?: string;

  @IsString()
  @IsOptional()
  end_date?: string;
}
