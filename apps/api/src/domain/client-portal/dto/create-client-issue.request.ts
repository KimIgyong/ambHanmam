import { IsNotEmpty, IsString, IsOptional, IsIn, IsUUID, IsArray, MaxLength, Matches } from 'class-validator';

export class CreateClientIssueRequest {
  @IsString()
  @IsNotEmpty()
  project_id: string;

  @IsString()
  @IsIn(['BUG', 'FEATURE_REQUEST', 'OPINION', 'OTHER'])
  type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsIn(['CRITICAL', 'MAJOR', 'MINOR', 'LOW'])
  severity: string;

  @IsString()
  @IsOptional()
  epic_id?: string;

  @IsString()
  @IsOptional()
  component_id?: string;

  @IsUUID('4')
  @IsOptional()
  parent_issue_id?: string;

  @IsUUID('4')
  @IsOptional()
  assignee_id?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  participant_ids?: string[];

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'start_date must be YYYY-MM-DD' })
  start_date?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'due_date must be YYYY-MM-DD' })
  due_date?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  google_drive_link?: string;
}
