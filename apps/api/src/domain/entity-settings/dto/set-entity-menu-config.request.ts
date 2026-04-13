import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class EntityMenuConfigItem {
  @IsString()
  menu_code: string;

  @IsIn(['WORK_TOOL', 'WORK_MODULE'])
  category: 'WORK_TOOL' | 'WORK_MODULE';

  @IsInt()
  @Min(1)
  sort_order: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class SetEntityMenuConfigRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityMenuConfigItem)
  configs: EntityMenuConfigItem[];
}
