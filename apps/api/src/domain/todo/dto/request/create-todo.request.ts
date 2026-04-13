import { IsNotEmpty, IsString, MaxLength, IsOptional, IsIn, IsUUID, IsArray, IsNumber, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTodoRequest {
  @ApiProperty({ example: 'Review Q4 report' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Review and provide feedback' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'SCHEDULED', enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'], deprecated: true, description: 'Deprecated — status is now computed from dates' })
  @IsString()
  @IsOptional()
  @IsIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'])
  status?: string;

  @ApiPropertyOptional({ example: '2026-03-01', description: 'Start date (leave empty = start immediately)' })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-02-15', description: 'Due date (leave empty = no deadline)' })
  @IsString()
  @IsOptional()
  due_date?: string;

  @ApiPropertyOptional({ example: 'urgent,report' })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsUUID()
  @IsOptional()
  issue_id?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Project ID' })
  @IsUUID()
  @IsOptional()
  project_id?: string;

  @ApiPropertyOptional({ example: 'PRIVATE', enum: ['PRIVATE', 'GROUP', 'ENTITY'] })
  @IsString()
  @IsOptional()
  @IsIn(['PRIVATE', 'GROUP', 'ENTITY'])
  visibility?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Required when visibility is GROUP' })
  @IsUUID()
  @IsOptional()
  group_id?: string;

  @ApiPropertyOptional({ example: ['uuid1', 'uuid2'], description: 'Participant user IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  participant_ids?: string[];

  @ApiPropertyOptional({ example: 'WEEKLY', enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] })
  @IsString()
  @IsOptional()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  recurrence_type?: string;

  @ApiPropertyOptional({ example: 1, description: 'WEEKLY: 0-6 (day of week), MONTHLY: 1-31 (day of month)' })
  @IsNumber()
  @IsOptional()
  recurrence_day?: number;
}
