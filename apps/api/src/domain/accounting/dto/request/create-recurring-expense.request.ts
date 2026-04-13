import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, MaxLength } from 'class-validator';

export class CreateRecurringExpenseRequest {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  bac_id: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  vendor?: string;

  @IsNumber()
  amount: number;

  @IsString()
  @MaxLength(10)
  currency: string;

  @IsNumber()
  @Min(1)
  @Max(31)
  day_of_month: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  start_date?: string;

  @IsString()
  @IsOptional()
  end_date?: string;
}
