import { IsArray, ValidateNested, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class CellPermissionItem {
  @IsString()
  menu_code: string;

  @IsBoolean()
  accessible: boolean;
}

export class SetCellPermissionRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CellPermissionItem)
  permissions: CellPermissionItem[];
}
