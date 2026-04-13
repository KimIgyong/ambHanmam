import { IsArray, ValidateNested, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class UnitPermissionItem {
  @IsString()
  menu_code: string;

  @IsBoolean()
  accessible: boolean;
}

export class SetUnitPermissionRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitPermissionItem)
  permissions: UnitPermissionItem[];
}
