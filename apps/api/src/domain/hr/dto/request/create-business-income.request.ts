import { IsString, IsOptional, IsNumber, Min, Matches } from 'class-validator';

export class CreateBusinessIncomeRequest {
  @IsString()
  freelancer_id: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'year_month must be YYYY-MM format' })
  year_month: string;

  @IsOptional()
  @IsString()
  payment_date?: string;

  @IsNumber()
  @Min(0)
  gross_amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weekly_holiday?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  incentive?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  prepaid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  employ_ins?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accident_ins?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  student_loan?: number;
}
