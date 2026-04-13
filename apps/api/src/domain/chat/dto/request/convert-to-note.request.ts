import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ConvertConversationToNoteRequest {
  @ApiProperty({ example: 'AI 상담 메모 - 로그인 오류' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '관리자가 정리한 상담 메모입니다.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ enum: ['MEMO', 'MEETING_NOTE'], default: 'MEMO' })
  @IsOptional()
  @IsString()
  @IsIn(['MEMO', 'MEETING_NOTE'])
  type?: string;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'CELL', 'ENTITY', 'PUBLIC'], default: 'ENTITY' })
  @IsOptional()
  @IsString()
  @IsIn(['PRIVATE', 'CELL', 'ENTITY', 'PUBLIC'])
  visibility?: string;

  @ApiPropertyOptional({ description: '관련 프로젝트 UUID 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  project_ids?: string[];

  @ApiPropertyOptional({ description: '관련 이슈 UUID 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  issue_ids?: string[];

  @ApiPropertyOptional({ description: '선택 메시지 UUID' })
  @IsOptional()
  @IsUUID()
  source_message_id?: string;
}