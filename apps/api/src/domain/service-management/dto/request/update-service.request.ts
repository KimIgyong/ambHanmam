import { IsString, IsOptional, IsInt, Min, IsIn } from 'class-validator';

export class UpdateServiceRequest {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  name_ko?: string;

  @IsOptional() @IsString()
  name_vi?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  @IsIn(['COMMUNICATION', 'COMMERCE', 'MARKETING', 'PACKAGE', 'OTHER'])
  category?: string;

  @IsOptional() @IsString()
  icon?: string;

  @IsOptional() @IsString()
  color?: string;

  @IsOptional() @IsString()
  website_url?: string;

  @IsOptional() @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'DEPRECATED'])
  status?: string;

  @IsOptional() @IsString()
  launch_date?: string;

  @IsOptional() @IsInt() @Min(0)
  sort_order?: number;
}
