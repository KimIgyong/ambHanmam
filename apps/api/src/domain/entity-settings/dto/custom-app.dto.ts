import {
  IsString, IsOptional, IsUrl, IsArray, IsInt, IsBoolean, IsIn,
  MaxLength, MinLength, Matches,
} from 'class-validator';

export class CreateCustomAppRequest {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: 'code must be lowercase alphanumeric with hyphens' })
  code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsUrl({ protocols: ['https', 'http'], require_protocol: true, require_tld: false }, { message: 'url must be a valid HTTP or HTTPS URL' })
  url: string;

  @IsOptional()
  @IsIn(['jwt', 'none', 'api_key'])
  auth_mode?: string;

  @IsOptional()
  @IsIn(['iframe', 'new_tab'])
  open_mode?: string;

  @IsOptional()
  @IsString()
  api_key?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_roles?: string[];

  @IsOptional()
  @IsInt()
  sort_order?: number;
}

export class UpdateCustomAppRequest {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true, require_tld: false }, { message: 'url must be a valid HTTP or HTTPS URL' })
  url?: string;

  @IsOptional()
  @IsIn(['jwt', 'none', 'api_key'])
  auth_mode?: string;

  @IsOptional()
  @IsIn(['iframe', 'new_tab'])
  open_mode?: string;

  @IsOptional()
  @IsString()
  api_key?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_roles?: string[];

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
