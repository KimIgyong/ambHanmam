import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

export class UpdateApiKeyRequest {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  api_key?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
