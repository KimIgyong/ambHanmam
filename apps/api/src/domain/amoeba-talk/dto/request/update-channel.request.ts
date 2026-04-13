import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChannelRequest {
  @ApiProperty({ example: 'General', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'General discussion channel', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
