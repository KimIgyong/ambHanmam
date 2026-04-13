import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSiteSettingsRequest {
  @ApiProperty({ example: 'https://portal.amoeba.com', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  portal_url?: string;

  @ApiProperty({ example: 'portal.amoeba.com', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  portal_domain?: string;

  @ApiProperty({ example: ['192.168.1.0/24'], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  allowed_ips?: string[];

  @ApiProperty({ example: ['amoeba.com'], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  allowed_domains?: string[];

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @ApiProperty({ example: 'https://cdn.amoeba.com/logo.png', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  logo_url?: string;

  @ApiProperty({ example: 'https://cdn.amoeba.com/favicon.ico', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  favicon_url?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  index_enabled?: boolean;

  @ApiProperty({ example: '<h1>Welcome</h1>', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000000)
  index_html?: string;
}
