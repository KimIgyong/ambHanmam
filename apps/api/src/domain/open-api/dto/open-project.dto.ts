import { IsOptional, IsString } from 'class-validator';
import { OpenPaginationDto } from './open-common.dto';

export class OpenProjectListDto extends OpenPaginationDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
