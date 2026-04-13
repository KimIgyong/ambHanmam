import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSectionRequest {
  @IsString()
  type: string;

  @IsOptional()
  config?: Record<string, any>;

  @IsOptional()
  content_en?: Record<string, any>;

  @IsOptional()
  content_ko?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;
}
