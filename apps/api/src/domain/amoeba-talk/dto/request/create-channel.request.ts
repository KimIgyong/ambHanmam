import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChannelRequest {
  @ApiProperty({ example: 'General' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'PUBLIC', enum: ['PUBLIC', 'PRIVATE', 'DIRECT'] })
  @IsString()
  @IsIn(['PUBLIC', 'PRIVATE', 'DIRECT'])
  type: string;

  @ApiProperty({ example: 'General discussion channel', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'User IDs to invite', required: false })
  @IsOptional()
  @IsString({ each: true })
  member_ids?: string[];
}
