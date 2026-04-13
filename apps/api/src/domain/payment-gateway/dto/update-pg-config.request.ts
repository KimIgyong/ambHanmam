import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpdatePgConfigRequest {
  @IsOptional()
  @IsString()
  merchant_id?: string;

  @IsOptional()
  @IsString()
  encode_key?: string;

  @IsOptional()
  @IsString()
  refund_key?: string;

  @IsOptional()
  @IsString()
  cancel_pw?: string;

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
