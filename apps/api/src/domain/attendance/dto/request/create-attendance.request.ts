import { IsArray, ValidateNested, IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ATTENDANCE_TYPE_VALUES } from '@amb/types';

export class AttendanceItemRequest {
  @ApiProperty({ example: '2026-02-16' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'OFFICE', enum: ATTENDANCE_TYPE_VALUES })
  @IsString()
  @IsIn(ATTENDANCE_TYPE_VALUES)
  type: string;

  @ApiPropertyOptional({ example: '09:00', enum: ['08:00', '08:30', '09:00', '09:30', '10:00'] })
  @IsString()
  @IsOptional()
  @IsIn(['08:00', '08:30', '09:00', '09:30', '10:00'])
  start_time?: string;
}

export class CreateAttendanceRequest {
  @ApiProperty({ type: [AttendanceItemRequest] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemRequest)
  schedules: AttendanceItemRequest[];
}
