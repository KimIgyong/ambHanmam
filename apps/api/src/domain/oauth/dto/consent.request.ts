import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ConsentRequestDto {
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  redirect_uri: string;

  @IsString()
  @IsNotEmpty()
  scope: string; // 사용자가 승인한 scope (공백 구분)

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  code_challenge?: string;

  @IsString()
  @IsOptional()
  code_challenge_method?: string;
}
