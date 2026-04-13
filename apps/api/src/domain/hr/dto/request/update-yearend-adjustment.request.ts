import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateYearendAdjustmentRequest {
  @IsOptional()
  @IsNumber()
  settle_tax?: number;

  @IsOptional()
  @IsNumber()
  settle_local?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
