import { IsString, IsNotEmpty, IsIn, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignEntityRoleRequest {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty()
  @IsString()
  @IsIn(['SYSTEM_ADMIN', 'HR_ADMIN', 'FINANCE_MANAGER', 'CHAIRMAN', 'EMPLOYEE'])
  role: string;
}
