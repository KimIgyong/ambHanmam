import { IsNotEmpty, IsString, MaxLength, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTransactionRequest {
  @ApiProperty({ example: '2023-06-02' })
  @IsString()
  @IsNotEmpty()
  transaction_date: string;

  @ApiPropertyOptional({ example: 'Project Alpha' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  project_name?: string;

  @ApiProperty({ example: 50000000 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  net_value: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  vat?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  bank_charge?: number;

  @ApiPropertyOptional({ example: 'AMOEBA' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  vendor?: string;

  @ApiPropertyOptional({ example: 'Transfer from USD account' })
  @IsString()
  @IsOptional()
  description?: string;
}
