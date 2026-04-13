import { IsString, IsNotEmpty, MaxLength, IsIn } from 'class-validator';
import { API_PROVIDER } from '@amb/types';

const PROVIDERS = Object.values(API_PROVIDER);

export class CreateApiKeyRequest {
  @IsString()
  @IsNotEmpty()
  @IsIn(PROVIDERS)
  provider: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  api_key: string;
}
