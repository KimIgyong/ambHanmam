import { IsString, IsArray, IsOptional, IsInt, IsIn, IsUUID, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ImportDefaultsDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsUUID()
  project_id?: string;
}

export class ImportTasksRequest {
  @IsUUID()
  app_id: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  task_ids: string[];

  @IsOptional()
  @IsString()
  group_id?: string;

  @IsOptional()
  @IsString()
  project_name?: string;

  @IsOptional()
  @IsString()
  group_name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImportDefaultsDto)
  defaults: ImportDefaultsDto;
}
