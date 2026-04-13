import { IsOptional, IsString, IsIn, IsInt } from 'class-validator';

export class QuerySiteErrorDto {
  @IsOptional()
  @IsIn(['FRONTEND', 'BACKEND'])
  source?: string;

  @IsOptional()
  @IsIn(['WEB', 'PORTAL_WEB', 'API', 'PORTAL_API'])
  app?: string;

  @IsOptional()
  @IsString()
  usr_level?: string;

  @IsOptional()
  @IsIn(['OPEN', 'RESOLVED', 'IGNORED'])
  status?: string;

  @IsOptional()
  @IsInt()
  http_status?: number;

  @IsOptional()
  @IsString()
  error_code?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsInt()
  page?: number;

  @IsOptional()
  @IsInt()
  limit?: number;
}
