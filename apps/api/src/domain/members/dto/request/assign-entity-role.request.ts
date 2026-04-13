import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignEntityRoleRequest {
  @ApiProperty({ example: 'uuid-of-entity' })
  @IsUUID()
  @IsNotEmpty()
  entity_id: string;

  @ApiProperty({ example: 'STAFF' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  role: string;
}
