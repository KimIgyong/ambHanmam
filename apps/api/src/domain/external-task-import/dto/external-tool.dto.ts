import { IsString, IsOptional, IsUrl, IsIn, MaxLength, MinLength } from 'class-validator';
import { EXTERNAL_TASK_PROVIDER_TYPES, ExternalTaskProviderType } from '@amb/types';

export class CreateExternalToolRequest {
  @IsIn(EXTERNAL_TASK_PROVIDER_TYPES)
  provider: ExternalTaskProviderType;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true, require_tld: false }, { message: 'url must be a valid HTTP or HTTPS URL' })
  url?: string;

  @IsString()
  @MinLength(1)
  api_key: string;
}

export class UpdateExternalToolRequest {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https', 'http'], require_protocol: true, require_tld: false }, { message: 'url must be a valid HTTP or HTTPS URL' })
  url?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  api_key?: string;

  @IsOptional()
  is_active?: boolean;
}
