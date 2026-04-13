import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class RegisterRequest {
  @IsEmail()
  email: string;

  @IsString()
  verify_token: string;

  @IsBoolean()
  terms_agreed: boolean;

  @IsBoolean()
  privacy_agreed: boolean;

  @IsOptional()
  @IsBoolean()
  marketing_agreed?: boolean;
}
