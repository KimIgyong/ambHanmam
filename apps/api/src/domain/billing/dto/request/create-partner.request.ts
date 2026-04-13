import { IsString, IsOptional, IsInt, Min, IsIn, MaxLength } from 'class-validator';

export class CreatePartnerRequest {
  @IsString()
  code: string;

  @IsString()
  @IsIn(['CLIENT', 'AFFILIATE', 'PARTNER', 'OUTSOURCING', 'GENERAL_AFFAIRS'])
  type: string;

  @IsString()
  company_name: string;

  @IsOptional() @IsString()
  company_name_local?: string;

  @IsOptional() @IsString() @MaxLength(256)
  country?: string;

  @IsOptional() @IsString()
  contact_name?: string;

  @IsOptional() @IsString()
  contact_email?: string;

  @IsOptional() @IsString()
  contact_phone?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  tax_id?: string;

  @IsOptional() @IsString()
  biz_type?: string;

  @IsOptional() @IsString()
  biz_category?: string;

  @IsOptional() @IsString()
  ceo_name?: string;

  @IsOptional() @IsString()
  default_currency?: string;

  @IsOptional() @IsInt() @Min(0)
  payment_terms?: number;

  @IsOptional() @IsString() @IsIn(['ACTIVE', 'INACTIVE', 'PROSPECT'])
  status?: string;

  @IsOptional() @IsString()
  note?: string;
}
