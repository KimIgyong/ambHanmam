import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConvertToKnowledgeRequest {
  @ApiProperty({ description: '지식 제목' })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiProperty({ description: '지식 내용' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '공개 범위' })
  @IsOptional()
  @IsIn(['PRIVATE', 'SHARED', 'DEPARTMENT', 'ENTITY', 'PUBLIC'])
  visibility?: string;

  @ApiPropertyOptional({ description: '유형' })
  @IsOptional()
  @IsIn(['DOC', 'REPORT', 'NOTE', 'ANALYSIS'])
  type?: string;
}
