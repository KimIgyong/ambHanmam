import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  MaxLength,
} from 'class-validator';

export class CreateSiteErrorDto {
  @IsIn(['FRONTEND', 'BACKEND'])
  source: string;

  @IsIn(['WEB', 'PORTAL_WEB', 'API', 'PORTAL_API'])
  app: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  page_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  api_endpoint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  http_method?: string;

  @IsOptional()
  @IsInt()
  http_status?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  error_code?: string;

  @IsString()
  @MaxLength(5000)
  error_message: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  stack_trace?: string;
}
