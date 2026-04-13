import { IsEmail, IsNotEmpty, IsString, IsOptional, IsIn, IsUUID, IsBoolean, MaxLength } from 'class-validator';

export class InviteEntityMemberRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsIn(['MASTER', 'MANAGER', 'MEMBER', 'VIEWER', 'PARTNER_ADMIN', 'PARTNER_MEMBER'])
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  department: string;

  @IsUUID()
  @IsOptional()
  company_id?: string;

  @IsUUID()
  @IsOptional()
  group_id?: string;

  @IsBoolean()
  @IsOptional()
  auto_approve?: boolean;

  @IsIn(['USER_LEVEL', 'PARTNER_LEVEL'])
  @IsOptional()
  level_code?: string;

  @IsUUID()
  @IsOptional()
  partner_id?: string;
}
