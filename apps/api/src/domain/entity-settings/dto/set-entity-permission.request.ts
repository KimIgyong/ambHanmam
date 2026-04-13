import { IsArray, ValidateNested, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionItem {
  @IsString()
  menu_code: string;

  @IsBoolean()
  accessible: boolean;
}

export class SetEntityPermissionRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionItem)
  permissions: PermissionItem[];
}
