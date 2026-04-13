import { IsString, IsOptional, IsBoolean, IsUUID, IsDateString, IsIn } from 'class-validator';

export class AssignUserUnitRoleRequest {
  @IsUUID()
  user_id: string;

  @IsUUID()
  department_id: string;

  @IsOptional()
  @IsIn(['MEMBER', 'TEAM_LEAD', 'UNIT_HEAD'])
  role?: string;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsDateString()
  started_at?: string;

  @IsOptional()
  @IsDateString()
  ended_at?: string;
}
