import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class ConvertConversationToIssueRequest {
  @ApiProperty({ example: 'AI 상담에서 접수된 로그인 오류' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '사용자 상담 내용을 기반으로 정리한 이슈 설명입니다.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['BUG', 'FEATURE_REQUEST', 'OPINION', 'TASK', 'OTHER'] })
  @IsString()
  @IsIn(['BUG', 'FEATURE_REQUEST', 'OPINION', 'TASK', 'OTHER'])
  type: string;

  @ApiProperty({ enum: ['CRITICAL', 'MAJOR', 'MINOR'] })
  @IsString()
  @IsIn(['CRITICAL', 'MAJOR', 'MINOR'])
  severity: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ description: '대상 프로젝트 UUID' })
  @IsOptional()
  @IsUUID()
  project_id?: string;

  @ApiPropertyOptional({ description: '선택 메시지 UUID' })
  @IsOptional()
  @IsUUID()
  source_message_id?: string;
}