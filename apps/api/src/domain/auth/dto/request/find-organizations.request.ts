import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindOrganizationsRequest {
  @ApiProperty({ example: 'user@amoeba.co.kr', description: '사용자 이메일' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
