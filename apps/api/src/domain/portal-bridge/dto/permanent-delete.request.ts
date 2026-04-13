import { IsIn, IsEmail } from 'class-validator';

export class PermanentDeleteRequest {
  @IsIn([1, 2])
  level: number;

  @IsEmail()
  confirm_email: string;
}
