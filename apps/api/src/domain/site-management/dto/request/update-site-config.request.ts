import { IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSiteConfigRequest {
  @ApiProperty({ description: '설정 값 (JSONB)', example: {} })
  @IsNotEmpty()
  @IsObject()
  value: Record<string, any>;
}
