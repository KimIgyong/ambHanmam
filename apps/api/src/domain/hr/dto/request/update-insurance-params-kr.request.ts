import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInsuranceParamsKrRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  effective_from: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effective_to?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  pension_rate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  pension_emp: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  pension_upper: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  pension_lower: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  health_rate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  health_emp: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  longterm_rate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  employ_rate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  employ_emp: number;
}
