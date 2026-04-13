import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class UpdatePartnerRequest {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  company_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  company_name_local?: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contact_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  contact_email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  contact_phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  tax_id?: string;

  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
