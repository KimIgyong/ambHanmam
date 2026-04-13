import { IsOptional, IsString, MaxLength, IsIn, IsInt, Min, Max, IsArray, IsUUID, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIssueRequest {
  @ApiPropertyOptional({ enum: ['BUG', 'FEATURE_REQUEST', 'OPINION', 'TASK', 'OTHER'] })
  @IsString()
  @IsIn(['BUG', 'FEATURE_REQUEST', 'OPINION', 'TASK', 'OTHER'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['CRITICAL', 'MAJOR', 'MINOR'] })
  @IsString()
  @IsIn(['CRITICAL', 'MAJOR', 'MINOR'])
  @IsOptional()
  severity?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ example: ['auth', 'billing'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  affected_modules?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  resolution?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ai_analysis?: string;

  @ApiPropertyOptional({ example: 'AI' })
  @IsString()
  @IsOptional()
  assignee?: string;

  @ApiPropertyOptional({ description: 'Assignee user UUID (null to unassign)' })
  @ValidateIf((o) => o.assignee_id !== null)
  @IsUUID()
  @IsOptional()
  assignee_id?: string | null;

  @ApiPropertyOptional({ example: 'ENTITY', enum: ['PRIVATE', 'GROUP', 'ENTITY'] })
  @IsString()
  @IsOptional()
  @IsIn(['PRIVATE', 'GROUP', 'ENTITY'])
  visibility?: string;

  @ApiPropertyOptional({ example: 'uuid or null', description: 'Required when visibility is GROUP' })
  @ValidateIf((o) => o.group_id !== null)
  @IsUUID()
  @IsOptional()
  group_id?: string | null;

  @ApiPropertyOptional({ description: 'Related project UUID (null to unlink)' })
  @ValidateIf((o) => o.project_id !== null)
  @IsUUID()
  @IsOptional()
  project_id?: string | null;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  start_date?: string | null;

  @ApiPropertyOptional({ description: 'Due date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  due_date?: string | null;

  @ApiPropertyOptional({ description: 'Done ratio (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  done_ratio?: number;

  @ApiPropertyOptional({ description: 'Parent issue UUID (null to unlink)' })
  @ValidateIf((o) => o.parent_issue_id !== null)
  @IsUUID()
  @IsOptional()
  parent_issue_id?: string | null;

  @ApiPropertyOptional({ description: 'Epic UUID (null to unlink)' })
  @ValidateIf((o) => o.epic_id !== null)
  @IsUUID()
  @IsOptional()
  epic_id?: string | null;

  @ApiPropertyOptional({ description: 'Component UUID (null to unlink)' })
  @ValidateIf((o) => o.component_id !== null)
  @IsUUID()
  @IsOptional()
  component_id?: string | null;

  @ApiPropertyOptional({ description: 'Google Drive link' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  google_drive_link?: string | null;

  @ApiPropertyOptional({ description: 'Participant user UUIDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  participant_ids?: string[];
}
