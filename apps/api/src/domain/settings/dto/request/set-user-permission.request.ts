import { IsArray, ValidateNested, IsString, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class UserPermissionItem {
  @ApiProperty({ example: 'HR' })
  @IsString()
  @IsNotEmpty()
  menu_code: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  accessible: boolean;
}

export class SetUserPermissionsRequest {
  @ApiProperty({ type: [UserPermissionItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserPermissionItem)
  permissions: UserPermissionItem[];
}
