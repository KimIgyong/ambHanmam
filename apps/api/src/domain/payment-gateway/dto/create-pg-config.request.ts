import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreatePgConfigRequest {
  @IsOptional()
  @IsString()
  entity_id?: string;

  @IsString()
  provider: string;

  @IsString()
  merchant_id: string;

  @IsString()
  encode_key: string;

  @IsString()
  refund_key: string;

  @IsString()
  cancel_pw: string;

  @IsOptional()
  @IsIn(['sandbox', 'production'])
  environment?: string;

  @IsOptional()
  @IsString()
  callback_url?: string;

  @IsOptional()
  @IsString()
  noti_url?: string;

  @IsOptional()
  @IsString()
  window_color?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
