import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequest {
  @ApiProperty({ example: 'user@amoeba.co.kr' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'Password must contain uppercase, lowercase, number and special character (!@#$%^&*)',
  })
  password: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'IT' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  unit?: string;

  // Legacy compatibility field. Prefer `unit`.
  @ApiProperty({ example: 'IT', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  department?: string;

  @ApiProperty({ example: 'uuid-token', required: false })
  @IsString()
  @IsOptional()
  invitation_token?: string;
}
