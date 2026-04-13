import { IsString, IsOptional, IsIn, IsNumber, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFreelancerRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  full_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resident_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5)
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contract_start?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contract_end?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  contract_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['BUSINESS_INCOME', 'SERVICE_FEE'])
  payment_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_rate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'COMPLETED', 'TERMINATED'])
  status?: string;
}
