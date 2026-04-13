import { IsString, MaxLength, IsOptional, IsIn, IsArray, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeetingNoteRequest {
  @ApiPropertyOptional({ example: 'MEMO', enum: ['MEETING_NOTE', 'MEMO'] })
  @IsString()
  @IsOptional()
  @IsIn(['MEETING_NOTE', 'MEMO'])
  type?: string;

  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: '<p>Updated content</p>' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: '2026-02-15' })
  @IsString()
  @IsOptional()
  meeting_date?: string;

  @ApiPropertyOptional({ example: 'PUBLIC', enum: ['PRIVATE', 'CELL', 'ENTITY', 'PUBLIC'] })
  @IsString()
  @IsOptional()
  @IsIn(['PRIVATE', 'CELL', 'ENTITY', 'PUBLIC'])
  visibility?: string;

  @ApiPropertyOptional({ example: 'IT' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: 'uuid or null', description: 'Required when visibility is CELL' })
  @IsString()
  @IsOptional()
  group_id?: string;

  @ApiPropertyOptional({ description: 'Assignee user ID (null to clear)' })
  @IsUUID()
  @IsOptional()
  assignee_id?: string | null;

  @ApiPropertyOptional({ description: 'Participant user IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  participant_ids?: string[];

  @ApiPropertyOptional({ description: 'Related project IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  project_ids?: string[];

  @ApiPropertyOptional({ description: 'Related issue IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  issue_ids?: string[];

  @ApiPropertyOptional({ description: 'Folder ID (null to remove from folder)' })
  @IsOptional()
  folder_id?: string | null;

  @ApiPropertyOptional({ description: 'Create an issue from this note' })
  @IsBoolean()
  @IsOptional()
  create_issue?: boolean;

  @ApiPropertyOptional({ description: 'Project ID for the created issue' })
  @IsUUID()
  @IsOptional()
  create_issue_project_id?: string;

  @ApiPropertyOptional({ description: 'Issue type', enum: ['BUG', 'FEATURE_REQUEST', 'OPINION', 'TASK', 'OTHER'] })
  @IsString()
  @IsOptional()
  @IsIn(['BUG', 'FEATURE_REQUEST', 'OPINION', 'TASK', 'OTHER'])
  create_issue_type?: string;

  @ApiPropertyOptional({ description: 'Issue severity', enum: ['CRITICAL', 'MAJOR', 'MINOR'] })
  @IsString()
  @IsOptional()
  @IsIn(['CRITICAL', 'MAJOR', 'MINOR'])
  create_issue_severity?: string;
}
