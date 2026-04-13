import { IsString, IsOptional, IsNumber, IsInt, IsBoolean, Min, IsIn } from 'class-validator';

export class CreatePlanRequest {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  @IsIn(['MONTHLY', 'YEARLY', 'ONE_TIME', 'CUSTOM'])
  billing_cycle?: string;

  @IsOptional() @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsInt()
  @Min(1)
  max_users?: number;

  @IsOptional() @IsString()
  features_json?: string;

  @IsOptional() @IsBoolean()
  is_active?: boolean;

  @IsOptional() @IsInt() @Min(0)
  sort_order?: number;
}
