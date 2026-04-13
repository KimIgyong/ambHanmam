import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecurrenceDto {
  @ApiProperty({ enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY'] })
  @IsString()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY'])
  clr_freq: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  clr_interval?: number;

  @ApiPropertyOptional({ example: 4, description: 'Weekday bitmask (bit0=Mon, bit6=Sun)' })
  @IsOptional()
  @IsInt()
  clr_weekdays?: number;

  @ApiPropertyOptional({ example: 15, description: 'Day of month' })
  @IsOptional()
  @IsInt()
  clr_month_day?: number;

  @ApiProperty({ enum: ['DATE', 'COUNT', 'INFINITE'] })
  @IsString()
  @IsIn(['DATE', 'COUNT', 'INFINITE'])
  clr_end_type: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  clr_end_date?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  clr_count?: number;
}

export class NotificationDto {
  @ApiProperty({ enum: ['NONE', '5MIN', '10MIN', '30MIN', '1HOUR', '1DAY', 'CUSTOM'] })
  @IsString()
  @IsIn(['NONE', '5MIN', '10MIN', '30MIN', '1HOUR', '1DAY', 'CUSTOM'])
  cln_reminder_type: string;

  @ApiPropertyOptional({ example: 15, description: 'Custom minutes if type is CUSTOM' })
  @IsOptional()
  @IsInt()
  @Min(1)
  cln_custom_minutes?: number;

  @ApiPropertyOptional({ example: ['TALK', 'EMAIL'] })
  @IsOptional()
  @IsArray()
  cln_channels?: string[];
}

export class CreateCalendarRequest {
  @ApiProperty({ example: '스프린트 계획 회의' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  cal_title: string;

  @ApiPropertyOptional({ example: '스프린트 계획 논의' })
  @IsOptional()
  @IsString()
  cal_description?: string;

  @ApiProperty({ example: '2026-03-02T09:00:00Z' })
  @IsDateString()
  cal_start_at: string;

  @ApiProperty({ example: '2026-03-02T10:00:00Z' })
  @IsDateString()
  cal_end_at: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  cal_is_all_day?: boolean;

  @ApiPropertyOptional({ example: '회의실 A' })
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

  @ApiPropertyOptional({ example: 'uuid-project' })
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @ApiPropertyOptional({ type: [String], description: 'Participant user IDs' })
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
}
