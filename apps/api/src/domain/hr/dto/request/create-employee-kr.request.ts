import { IsString, IsOptional, IsIn, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeKrRequest {
  @ApiProperty()
  @IsString()
  @IsIn(['REGULAR', 'CONTRACT', 'DAILY', 'REPRESENTATIVE', 'INTERN'])
  employee_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resident_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pension_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  health_ins_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employ_ins_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pension_exempt?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  health_exempt?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  employ_exempt?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  tax_dependents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['80', '100', '120'])
  withholding_rate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bank_account?: string;
}
