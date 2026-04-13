import { IsString, IsOptional } from 'class-validator';

export class CreateAsanaMappingDto {
  @IsString()
  asana_project_gid: string;

  @IsString()
  @IsOptional()
  asana_project_name?: string;

  @IsString()
  @IsOptional()
  project_id?: string;
}

export class ImportAsanaTasksDto {
  @IsString()
  @IsOptional()
  completed_filter?: 'all' | 'active' | 'completed';
}
