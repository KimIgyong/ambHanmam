import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordRequest {
  @ApiProperty({ example: 'VN01', description: '법인코드 (선택 - 미입력 시 ADMIN_LEVEL 전용)', required: false })
  @IsOptional()
  @IsString()
  entity_code?: string;

  @ApiProperty({ example: 'user@amoeba.co.kr' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
