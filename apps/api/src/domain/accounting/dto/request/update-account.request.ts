import { IsString, MaxLength, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateAccountRequest {
  @ApiPropertyOptional({ example: 'SHINHAN BANK' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  bank_name?: string;

  @ApiPropertyOptional({ example: 'SAI GON BRANCH' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  branch_name?: string;

  @ApiPropertyOptional({ example: '700-027-438663' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  account_number?: string;

  @ApiPropertyOptional({ example: 'Shinhan VND' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  account_alias?: string;

  @ApiPropertyOptional({ example: 'VND' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  opening_balance?: number;

  @ApiPropertyOptional({ example: '2023-05-09' })
  @IsString()
  @IsOptional()
  opening_date?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
