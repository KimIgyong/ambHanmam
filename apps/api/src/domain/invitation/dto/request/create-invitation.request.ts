import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvitationRequest {
  @ApiProperty({ example: 'user@amoeba.co.kr' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'MEMBER' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  role: string;

  @ApiProperty({ example: 'IT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  department: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsString()
  @IsOptional()
  group_id?: string;

  @ApiProperty({ example: 'USER_LEVEL', description: 'Level code: ADMIN_LEVEL | USER_LEVEL' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  level_code?: string;

  @ApiProperty({ example: 'uuid', description: 'Company (HrEntity) ID', required: false })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ example: 'uuid', description: 'Partner organization ID (for PARTNER_LEVEL)', required: false })
  @IsUUID()
  @IsOptional()
  partner_id?: string;

  @ApiProperty({ example: false, description: 'Auto-approve on acceptance', required: false })
  @IsBoolean()
  @IsOptional()
  auto_approve?: boolean;
}
