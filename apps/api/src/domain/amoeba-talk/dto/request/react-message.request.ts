import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReactMessageRequest {
  @ApiProperty({ example: 'LIKE', enum: ['LIKE', 'CHECK', 'PRAY', 'GRIN', 'LOVE'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['LIKE', 'CHECK', 'PRAY', 'GRIN', 'LOVE'])
  type: string;
}
