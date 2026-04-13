import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class TokenRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['authorization_code', 'refresh_token', 'ama_session'])
  grant_type: string;

  /** authorization_code grant */
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  client_id?: string;

  @IsString()
  @IsOptional()
  client_secret?: string;

  @IsString()
  @IsOptional()
  redirect_uri?: string;

  /** PKCE code_verifier */
  @IsString()
  @IsOptional()
  code_verifier?: string;

  /** refresh_token grant */
  @IsString()
  @IsOptional()
  refresh_token?: string;
}
