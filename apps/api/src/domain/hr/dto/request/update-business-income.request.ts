import { IsOptional, IsNumber, IsString, Min, IsIn } from 'class-validator';

export class UpdateBusinessIncomeRequest {
  @IsOptional()
  @IsString()
  payment_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gross_amount?: number;

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

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'FINALIZED'])
  status?: string;
}
