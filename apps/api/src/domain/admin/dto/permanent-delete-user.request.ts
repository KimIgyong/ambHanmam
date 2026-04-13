import { IsIn, IsEmail, IsNotEmpty } from 'class-validator';

export class PermanentDeleteUserRequest {
  @IsIn([1, 2])
  level: 1 | 2;

  @IsEmail()
  @IsNotEmpty()
  confirm_email: string;
}
