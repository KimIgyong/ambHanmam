import { IsString, IsOptional, IsIn, IsUUID, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageRequest {
  @ApiProperty({ example: 'Hello, world!', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ example: 'TEXT', enum: ['TEXT', 'FILE', 'SYSTEM', 'TRANSLATION'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['TEXT', 'FILE', 'SYSTEM', 'TRANSLATION'])
  type?: string;

  @ApiProperty({ description: 'Parent message ID for thread replies', required: false })
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiProperty({ description: 'Target language for simultaneous translation', example: 'en', required: false })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'ko', 'vi', 'ja', 'zh'])
  translate_to?: string;

  @ApiProperty({ description: 'Mentioned user IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  mention_user_ids?: string[];
}
