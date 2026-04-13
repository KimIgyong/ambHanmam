import { IsEmail, IsString, MinLength, IsIn } from 'class-validator';

export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(['ADMIN', 'SUPER_ADMIN'])
  role: 'ADMIN' | 'SUPER_ADMIN';
}
