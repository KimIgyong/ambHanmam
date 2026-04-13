import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class UpdatePartnerAppRequest {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  url?: string;

  @IsString()
  @IsOptional()
  @IsIn(['jwt', 'api_key', 'none', 'NONE', 'SSO_JWT', 'API_KEY', 'OAUTH2'])
  auth_mode?: string;

  @IsString()
  @IsOptional()
  @IsIn(['iframe', 'new_tab', 'IFRAME', 'NEW_TAB', 'POPUP'])
  open_mode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;
}
