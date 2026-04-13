import { IsOptional, IsString } from 'class-validator';
import { OpenPaginationDto } from './open-common.dto';

export class OpenAssetListDto extends OpenPaginationDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
