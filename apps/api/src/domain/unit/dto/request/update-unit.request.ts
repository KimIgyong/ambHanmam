import { IsString, IsOptional, IsInt, IsBoolean, IsUUID, Min, Max } from 'class-validator';

export class UpdateUnitRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  name_local?: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  level?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
