import { IsString, MaxLength, IsOptional, IsIn, IsUUID, ValidateIf, IsArray, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTodoRequest {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'IN_PROGRESS', enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'], deprecated: true, description: 'Deprecated — status is now computed from dates' })
  @IsString()
  @IsOptional()
  @IsIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'])
  status?: string;

  @ApiPropertyOptional({ example: '2026-03-01', description: 'Start date' })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-02-20' })
  @IsString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({ example: 'updated,tags' })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ example: 'uuid or null' })
  @ValidateIf((o) => o.issue_id !== null)
  @IsUUID()
  @IsOptional()
  issue_id?: string | null;

  @ApiPropertyOptional({ example: 'uuid or null', description: 'Project ID' })
  @ValidateIf((o) => o.project_id !== null)
  @IsUUID()
  @IsOptional()
  project_id?: string | null;

  @ApiPropertyOptional({ example: 'PRIVATE', enum: ['PRIVATE', 'GROUP', 'ENTITY'] })
  @IsString()
  @IsOptional()
  @IsIn(['PRIVATE', 'GROUP', 'ENTITY'])
  visibility?: string;

  @ApiPropertyOptional({ example: 'uuid or null', description: 'Required when visibility is GROUP' })
  @ValidateIf((o) => o.group_id !== null)
  @IsUUID()
  @IsOptional()
  group_id?: string | null;

  @ApiPropertyOptional({ example: ['uuid1', 'uuid2'], description: 'Participant user IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  participant_ids?: string[];

  @ApiPropertyOptional({ example: 'WEEKLY', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] })
  @ValidateIf((o) => o.recurrence_type !== null)
  @IsString()
  @IsOptional()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  recurrence_type?: string | null;

  @ApiPropertyOptional({ example: 1, description: 'WEEKLY: 0-6, MONTHLY: 1-31' })
  @IsNumber()
  @IsOptional()
  recurrence_day?: number | null;

  @ApiPropertyOptional({ example: '고객 요청으로 일정 연장', description: 'Note for due date change' })
  @IsString()
  @IsOptional()
  due_date_change_note?: string;
}
