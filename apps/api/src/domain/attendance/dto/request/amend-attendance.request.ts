import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ATTENDANCE_TYPE_VALUES } from '@amb/types';

export class AmendAttendanceRequest {
  @ApiProperty({ example: 'OFFICE', enum: ATTENDANCE_TYPE_VALUES })
  @IsString()
  @IsIn(ATTENDANCE_TYPE_VALUES)
  type: string;

  @ApiPropertyOptional({ example: '09:00', enum: ['08:00', '08:30', '09:00', '09:30', '10:00'] })
  @IsString()
  @IsOptional()
  @IsIn(['08:00', '08:30', '09:00', '09:30', '10:00'])
  start_time?: string;

  @ApiProperty({ example: '재택근무에서 출근으로 변경' })
  @IsString()
  @IsNotEmpty()
  note: string;
}
