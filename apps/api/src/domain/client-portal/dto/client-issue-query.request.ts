import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class ClientIssueQueryRequest {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  project_id?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumberString()
  @IsOptional()
  page?: number;

  @IsNumberString()
  @IsOptional()
  size?: number;
}
