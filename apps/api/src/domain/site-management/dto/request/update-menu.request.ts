import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateMenuRequest {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name_en?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name_ko?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  is_visible?: boolean;

  @IsOptional()
  @IsString()
  menu_type?: string;

  @IsOptional()
  @IsString()
  external_url?: string;
}
