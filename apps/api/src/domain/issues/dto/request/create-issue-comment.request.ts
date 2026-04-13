import { IsNotEmpty, IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIssueCommentRequest {
  @ApiProperty({ example: 'Looks good, approved.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: null, description: 'Parent comment ID for reply' })
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiPropertyOptional({ example: false, description: 'Visible to CLIENT_LEVEL users' })
  @IsOptional()
  @IsBoolean()
  client_visible?: boolean;
}
