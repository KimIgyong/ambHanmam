import { IsString, IsOptional, IsIn, IsInt, MaxLength, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEntityRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name_en?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['KR', 'VN', 'US', 'JP', 'SG'])
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['KRW', 'VND', 'USD', 'JPY', 'SGD'])
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  registration_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  representative?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  pay_day?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @ApiPropertyOptional({ description: '초대 이메일 표시 법인명' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  email_display_name?: string;

  @ApiPropertyOptional({ description: '초대 이메일 브랜드 색상 (#RRGGBB)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  email_brand_color?: string;

  @ApiPropertyOptional({ description: '초대 이메일 로고 이미지 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  email_logo_url?: string;
}
