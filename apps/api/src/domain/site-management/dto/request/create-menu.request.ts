import { IsString, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';

export class CreateMenuRequest {
  @IsString()
  @MaxLength(200)
  name_en: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name_ko?: string;

  @IsString()
  @MaxLength(200)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @IsOptional()
  @IsString()
  menu_type?: string;

  @IsOptional()
  @IsString()
  external_url?: string;

  @IsString()
  page_type: string;

  @IsOptional()
  page_config?: Record<string, any>;
}
