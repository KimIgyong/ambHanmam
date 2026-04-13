import { IsNotEmpty, IsString, MaxLength, IsOptional, IsIn, IsInt, Min, Max, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIssueRequest {
  @ApiProperty({ enum: ['BUG', 'FEATURE_REQUEST', 'OPINION', 'TASK', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['BUG', 'FEATURE_REQUEST', 'OPINION', 'TASK', 'OTHER'])
  type: string;

  @ApiProperty({ example: 'Login page crash on Safari' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Detailed description of the issue...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['CRITICAL', 'MAJOR', 'MINOR'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['CRITICAL', 'MAJOR', 'MINOR'])
  severity: string;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ example: ['auth', 'chat'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  affected_modules?: string[];

  @ApiPropertyOptional({ description: 'Assignee user UUID' })
  @IsUUID()
  @IsOptional()
  assignee_id?: string;

  @ApiPropertyOptional({ example: 'ENTITY', enum: ['PRIVATE', 'GROUP', 'ENTITY'] })
  @IsString()
  @IsOptional()
  @IsIn(['PRIVATE', 'GROUP', 'ENTITY'])
  visibility?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Required when visibility is GROUP' })
  @IsUUID()
  @IsOptional()
  group_id?: string;

  @ApiPropertyOptional({ description: 'Related project UUID' })
  @IsUUID()
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Due date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  due_date?: string;

  @ApiPropertyOptional({ description: 'Done ratio (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  done_ratio?: number;

  @ApiPropertyOptional({ description: 'Parent issue UUID' })
  @IsUUID()
  @IsOptional()
  parent_issue_id?: string;

  @ApiPropertyOptional({ description: 'Epic UUID' })
  @IsUUID()
  @IsOptional()
  epic_id?: string;

  @ApiPropertyOptional({ description: 'Component UUID' })
  @IsUUID()
  @IsOptional()
  component_id?: string;

  @ApiPropertyOptional({ description: 'Google Drive link' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  google_drive_link?: string;

  @ApiPropertyOptional({ description: 'Participant user UUIDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  participant_ids?: string[];

  @ApiPropertyOptional({ description: 'Source todo UUID (for traceability when converting from todo)' })
  @IsUUID()
  @IsOptional()
  source_todo_id?: string;

  @ApiPropertyOptional({ description: 'Source todo title (for display in system comment)' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  source_todo_title?: string;

  @ApiPropertyOptional({ description: 'Source meeting note title (for display in system comment)' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  source_meeting_note_title?: string;
}
