import { IsOptional, IsString } from 'class-validator';
import { OpenPaginationDto } from './open-common.dto';

export class OpenIssueListDto extends OpenPaginationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  assignee_id?: string;

  @IsOptional()
  @IsString()
  project_id?: string;
}
