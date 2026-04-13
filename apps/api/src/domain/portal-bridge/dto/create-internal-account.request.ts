import { IsUUID, IsIn, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateInternalAccountRequest {
  @IsUUID()
  entity_id: string;

  @IsIn(['MASTER', 'MANAGER', 'MEMBER', 'VIEWER'])
  role: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsBoolean()
  create_company_email?: boolean;
}
