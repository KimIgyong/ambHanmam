import { IsNotEmpty, IsString, MaxLength, IsOptional, IsIn, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateNoticeRequest {
  @ApiProperty({ example: 'Company announcement' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '<p>Notice content...</p>' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'PUBLIC', enum: ['PUBLIC', 'DEPARTMENT', 'GROUP'] })
  @IsString()
  @IsOptional()
  @IsIn(['PUBLIC', 'DEPARTMENT', 'GROUP'])
  visibility?: string;

  @ApiPropertyOptional({ example: 'IT' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Required when visibility is GROUP' })
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
