import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsNumberString } from 'class-validator';

export class GetNotificationsRequest {
  @ApiPropertyOptional({ description: '페이지 번호', default: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: '페이지 크기', default: '20' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    description: '읽음 필터',
    enum: ['true', 'false'],
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  is_read?: string;

  @ApiPropertyOptional({
    description: '리소스 유형 필터',
    enum: ['TODO', 'ISSUE', 'MEETING_NOTE', 'CALENDAR'],
  })
  @IsOptional()
  @IsIn(['TODO', 'ISSUE', 'MEETING_NOTE', 'CALENDAR'])
  resource_type?: string;
}
