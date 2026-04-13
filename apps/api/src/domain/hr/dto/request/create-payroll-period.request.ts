import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePayrollPeriodRequest {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  @Max(2099)
  year: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payment_date?: string;
}
