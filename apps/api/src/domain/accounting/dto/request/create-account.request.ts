import { IsNotEmpty, IsString, MaxLength, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAccountRequest {
  @ApiProperty({ example: 'SHINHAN BANK' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bank_name: string;

  @ApiPropertyOptional({ example: 'SAI GON BRANCH' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  branch_name?: string;

  @ApiProperty({ example: '700-027-438663' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  account_number: string;

  @ApiPropertyOptional({ example: 'Shinhan VND' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  account_alias?: string;

  @ApiProperty({ example: 'VND' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  currency: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  opening_balance?: number;

  @ApiPropertyOptional({ example: '2023-05-09' })
  @IsString()
  @IsOptional()
  opening_date?: string;
}
