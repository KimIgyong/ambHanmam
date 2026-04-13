import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleRequest {
  @ApiProperty({ example: 'MANAGER' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  role: string;
}
