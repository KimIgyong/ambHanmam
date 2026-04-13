import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMeetingNoteCommentRequest {
  @ApiProperty({ example: 'Great meeting note!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: null, description: 'Parent comment ID for reply' })
  @IsOptional()
  @IsUUID()
  parent_id?: string;
}
