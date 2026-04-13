import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkUserRequest {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  usr_id: string;
}
