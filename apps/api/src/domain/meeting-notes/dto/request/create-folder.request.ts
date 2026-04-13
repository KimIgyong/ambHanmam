import { IsNotEmpty, IsString, MaxLength, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderRequest {
  @ApiProperty({ example: '프로젝트 회의' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sort_order?: number;
}
