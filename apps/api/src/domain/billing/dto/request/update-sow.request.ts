import { IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export class UpdateSowRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  period_start?: string;

  @IsOptional()
  @IsString()
  period_end?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'SIGNED', 'IN_PROGRESS', 'COMPLETED', 'ACCEPTED'])
  status?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
