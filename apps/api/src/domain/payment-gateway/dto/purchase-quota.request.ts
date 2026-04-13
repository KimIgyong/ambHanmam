import { IsString, IsUUID } from 'class-validator';

export class PurchaseQuotaRequest {
  @IsUUID()
  product_id: string;
}
