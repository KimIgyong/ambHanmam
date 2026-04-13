import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PartnerLoginRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  partner_code: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
