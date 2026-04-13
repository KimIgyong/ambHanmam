import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class ClientProjectQueryRequest {
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
