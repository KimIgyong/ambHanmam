import { IsString, IsOptional, IsUUID, IsBoolean, MaxLength } from 'class-validator';

export class CreatePostRequest {
  @IsString()
  @MaxLength(500)
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  featured_image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  tags?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
