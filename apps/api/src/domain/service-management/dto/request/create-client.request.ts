import { IsString, IsOptional, IsIn, IsUUID } from 'class-validator';

export class CreateClientRequest {
  @IsString()
  @IsIn(['COMPANY', 'INDIVIDUAL'])
  type: string;

  @IsString()
  company_name: string;

  @IsOptional() @IsString()
  company_name_local?: string;

  @IsOptional() @IsString()
  country?: string;

  @IsOptional() @IsString()
  industry?: string;

  @IsOptional() @IsString()
  @IsIn(['STARTUP', 'SMB', 'MID', 'ENTERPRISE'])
  company_size?: string;

  @IsOptional() @IsString()
  tax_id?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  website?: string;

  @IsOptional() @IsString()
  logo_url?: string;

  @IsOptional() @IsString()
  @IsIn(['PROSPECT', 'ACTIVE', 'INACTIVE', 'CHURNED'])
  status?: string;

  @IsOptional() @IsString()
  source?: string;

  @IsOptional() @IsUUID()
  referred_by?: string;

  @IsOptional() @IsUUID()
  account_manager_id?: string;

  @IsOptional() @IsUUID()
  bil_partner_id?: string;

  @IsOptional() @IsString()
  note?: string;
}
