import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCalendarExceptionRequest {
  @ApiProperty({ example: '2026-03-09', description: 'Original occurrence date (EXDATE)' })
  @IsDateString()
  @IsNotEmpty()
  cle_original_date: string;

  @ApiProperty({ enum: ['CANCELLED', 'RESCHEDULED'] })
  @IsString()
  @IsIn(['CANCELLED', 'RESCHEDULED'])
  cle_exception_type: string;

  @ApiPropertyOptional({ example: '2026-03-10T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  cle_new_start_at?: string;

  @ApiPropertyOptional({ example: '2026-03-10T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  cle_new_end_at?: string;
}
