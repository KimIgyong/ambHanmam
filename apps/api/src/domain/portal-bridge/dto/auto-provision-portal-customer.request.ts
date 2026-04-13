import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AutoProvisionPortalCustomerRequest {
  @IsOptional()
  @IsIn(['MASTER', 'MANAGER', 'MEMBER', 'VIEWER'])
  role?: 'MASTER' | 'MANAGER' | 'MEMBER' | 'VIEWER';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  department?: string;
}
