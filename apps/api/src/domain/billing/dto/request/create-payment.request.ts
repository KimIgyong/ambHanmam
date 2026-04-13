import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreatePaymentRequest {
  @IsString()
  invoice_id: string;

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
