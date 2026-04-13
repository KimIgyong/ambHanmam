import { IsOptional, IsIn, IsString, MaxLength } from 'class-validator';

export class UpdateEntityMemberRequest {
  @IsIn(['MASTER', 'MANAGER', 'MEMBER', 'VIEWER'])
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  department?: string;

  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  @IsOptional()
  status?: string;
}
