import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSystemParamRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  param_key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  param_value: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  effective_from: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effective_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
