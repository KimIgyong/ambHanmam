import { IsString, MaxLength, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateTransactionRequest {
  @ApiPropertyOptional({ example: '2023-06-02' })
  @IsString()
  @IsOptional()
  transaction_date?: string;

  @ApiPropertyOptional({ example: 'Project Alpha' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  project_name?: string;

  @ApiPropertyOptional({ example: 50000000 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  net_value?: number;

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
