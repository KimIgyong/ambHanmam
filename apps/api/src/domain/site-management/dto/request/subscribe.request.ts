import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribeRequest {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
