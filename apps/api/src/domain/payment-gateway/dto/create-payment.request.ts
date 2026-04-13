import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreatePaymentRequest {
  @IsString()
  @IsNotEmpty()
  goods_name: string;

  @IsNumber()
  @Min(10000)
  @Max(2100000000)
  amount: number;

  @IsOptional()
  @IsString()
  pay_type?: string;

  @IsOptional()
  @IsString()
  buyer_email?: string;

  @IsOptional()
  @IsString()
  buyer_name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
