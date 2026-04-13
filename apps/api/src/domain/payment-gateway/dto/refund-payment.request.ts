import { IsNotEmpty, IsString } from 'class-validator';

export class RefundPaymentRequest {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
