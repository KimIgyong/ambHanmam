import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class AuthorizeRequestDto {
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  redirect_uri: string;

  @IsString()
  @IsNotEmpty()
  response_type: string; // 'code'

  @IsString()
  @IsNotEmpty()
  scope: string; // 공백 구분 ("assets:read issues:read")

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  code_challenge?: string;

  @IsString()
  @IsOptional()
  code_challenge_method?: string; // 'S256'
}
