import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAssetRequestRequest {
  @ApiProperty({ example: 'NEW_RENTAL', enum: ['NEW_RENTAL', 'MEETING_ROOM_RESERVATION', 'EXTENSION', 'RETURN', 'REPLACEMENT'] })
  @IsString()
  @IsIn(['NEW_RENTAL', 'MEETING_ROOM_RESERVATION', 'EXTENSION', 'RETURN', 'REPLACEMENT'])
  request_type: string;

  @ApiProperty({ example: 'SPECIFIC', enum: ['SPECIFIC', 'CATEGORY_ONLY'] })
  @IsString()
  @IsIn(['SPECIFIC', 'CATEGORY_ONLY'])
  asset_select_mode: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  asset_id?: string;

  @ApiPropertyOptional({ example: 'IT_EQUIPMENT', enum: ['IT_EQUIPMENT', 'SUPPLY', 'FACILITY', 'MEETING_ROOM'] })
  @IsOptional()
  @IsString()
  @IsIn(['IT_EQUIPMENT', 'SUPPLY', 'FACILITY', 'MEETING_ROOM'])
  asset_category?: string;

  @ApiProperty({ example: '프로젝트 수행용 장비 필요' })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({ example: '2026-03-01T09:00:00Z' })
  @IsString()
  @IsNotEmpty()
  start_at: string;

  @ApiProperty({ example: '2026-03-03T18:00:00Z' })
  @IsString()
  @IsNotEmpty()
  end_at: string;

  @ApiPropertyOptional({ example: '본사 3층' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  place?: string;

  @ApiPropertyOptional({ example: '스프린트 계획 회의', description: '회의실 예약 시 필수' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  meeting_title?: string;

  @ApiPropertyOptional({ example: 8, description: '회의실 예약 시 필수' })
  @IsOptional()
  attendee_count?: number;

  @ApiPropertyOptional({ example: 'INTERNAL', enum: ['INTERNAL', 'EXTERNAL', 'VIDEO'] })
  @IsOptional()
  @IsString()
  @IsIn(['INTERNAL', 'EXTERNAL', 'VIDEO'])
  meeting_type?: string;

  @ApiPropertyOptional({ type: [String], example: ['TV', 'PROJECTOR'] })
  @IsOptional()
  @IsArray()
  required_equipments?: string[];
}
