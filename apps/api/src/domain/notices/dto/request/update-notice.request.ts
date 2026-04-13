import { IsString, MaxLength, IsOptional, IsIn, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateNoticeRequest {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: '<p>Updated content</p>' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'PUBLIC', enum: ['PUBLIC', 'DEPARTMENT', 'GROUP'] })
  @IsString()
  @IsOptional()
  @IsIn(['PUBLIC', 'DEPARTMENT', 'GROUP'])
  visibility?: string;

  @ApiPropertyOptional({ example: 'IT' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: 'uuid or null', description: 'Required when visibility is GROUP' })
  @IsString()
  @IsOptional()
  group_id?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  is_pinned?: boolean;
}
