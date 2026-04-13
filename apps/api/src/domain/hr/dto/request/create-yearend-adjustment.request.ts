import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateYearendAdjustmentRequest {
  @IsString()
  employee_id: string;

  @IsNumber()
  @Min(2020)
  @Max(2099)
  tax_year: number;

  @IsNumber()
  settle_tax: number;

  @IsNumber()
  settle_local: number;

  @IsOptional()
  @IsString()
  note?: string;
}
