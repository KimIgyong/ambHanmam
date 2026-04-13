import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCellMemberRequest {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
