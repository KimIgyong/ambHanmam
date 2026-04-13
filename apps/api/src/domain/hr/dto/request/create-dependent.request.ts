import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDependentRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  relationship: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  date_of_birth: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cccd_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tax_code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  effective_from: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effective_to?: string;
}
