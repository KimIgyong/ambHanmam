import { IsEmail } from 'class-validator';

export class SendVerifyCodeRequest {
  @IsEmail()
  email: string;
}
