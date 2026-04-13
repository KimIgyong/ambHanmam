import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ATTENDANCE_TYPE_VALUES } from '@amb/types';

export class UpdateAttendanceRequest {
  @ApiPropertyOptional({ example: 'REMOTE', enum: ATTENDANCE_TYPE_VALUES })
  @IsString()
  @IsOptional()
  @IsIn(ATTENDANCE_TYPE_VALUES)
  type?: string;

  @ApiPropertyOptional({ example: '09:30', enum: ['08:00', '08:30', '09:00', '09:30', '10:00'] })
  @IsString()
  @IsOptional()
  @IsIn(['08:00', '08:30', '09:00', '09:30', '10:00'])
  start_time?: string;
}
