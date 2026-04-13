import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdatePageRequest {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  og_image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  seo_keywords?: string;

  @IsOptional()
  config?: Record<string, any>;
}
