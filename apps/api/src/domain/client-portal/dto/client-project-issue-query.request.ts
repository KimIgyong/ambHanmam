import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class ClientProjectIssueQueryRequest {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  exclude_closed?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sort?: string;

  @IsNumberString()
  @IsOptional()
  page?: number;

  @IsNumberString()
  @IsOptional()
  size?: number;
}
