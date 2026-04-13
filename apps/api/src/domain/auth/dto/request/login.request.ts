import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginRequest {
  @ApiPropertyOptional({ example: 'VN01', description: '법인코드 (USER_LEVEL 필수)' })
  @IsOptional()
  @IsString()
  entity_code?: string;

  @ApiProperty({ example: 'user@amoeba.co.kr' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
