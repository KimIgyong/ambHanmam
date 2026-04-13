import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ClientLoginRequest {
  @IsString()
  @IsNotEmpty()
  entity_code: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
