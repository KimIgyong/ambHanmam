import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecurrenceDto, NotificationDto } from './create-calendar.request';

export class UpdateCalendarRequest {
  @ApiPropertyOptional({ example: '스프린트 계획 회의 (수정)' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  cal_title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cal_description?: string;

  @ApiPropertyOptional({ example: '2026-03-02T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  cal_start_at?: string;

  @ApiPropertyOptional({ example: '2026-03-02T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  cal_end_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cal_is_all_day?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cal_location?: string;

  @ApiPropertyOptional({ enum: ['WORK', 'MEETING', 'PERSONAL', 'PROJECT', 'HOLIDAY', 'ETC'] })
  @IsOptional()
  @IsString()
  @IsIn(['WORK', 'MEETING', 'PERSONAL', 'PROJECT', 'HOLIDAY', 'ETC'])
  cal_category?: string;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'SHARED', 'DEPARTMENT', 'ENTITY'] })
  @IsOptional()
  @IsString()
  @IsIn(['PRIVATE', 'SHARED', 'DEPARTMENT', 'ENTITY'])
  cal_visibility?: string;

  @ApiPropertyOptional({ example: '#FF5733' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  cal_color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  participant_ids?: string[];

  @ApiPropertyOptional({ type: RecurrenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrenceDto)
  recurrence?: RecurrenceDto;

  @ApiPropertyOptional({ type: NotificationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationDto)
  notification?: NotificationDto;

  /** Optimistic lock — client sends the last known cal_updated_at */
  @ApiPropertyOptional({ example: '2026-03-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  current_updated_at?: string;
}
