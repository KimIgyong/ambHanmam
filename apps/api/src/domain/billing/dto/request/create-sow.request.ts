import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateSowRequest {
  @IsString()
  contract_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  period_start: string;

  @IsString()
  period_end: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
