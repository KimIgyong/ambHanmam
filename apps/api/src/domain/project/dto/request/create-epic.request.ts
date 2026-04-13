import { IsString, IsOptional, IsIn, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEpicRequest {
  @ApiProperty({ description: 'Epic title', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Epic description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Epic status', enum: ['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'] })
  @IsString()
  @IsIn(['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'HEX color (#RRGGBB)', example: '#3B82F6' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ description: 'Due date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  due_date?: string;
}
