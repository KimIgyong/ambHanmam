import { IsString, IsOptional, MaxLength, Matches, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateComponentRequest {
  @ApiPropertyOptional({ description: 'Component title', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Component description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'HEX color (#RRGGBB)', example: '#10B981' })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Owner user UUID' })
  @IsUUID()
  @IsOptional()
  owner_id?: string;
}
