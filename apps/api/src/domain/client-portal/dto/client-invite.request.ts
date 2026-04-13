import { IsEmail, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class ClientInviteRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsNotEmpty()
  cli_id: string;

  @IsOptional()
  @IsIn(['CLIENT_ADMIN', 'CLIENT_MEMBER'])
  role?: string;
}
