import { IsArray, ValidateNested, IsString, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class MenuGroupPermissionItem {
  @ApiProperty({ example: 'CHAT_HR' })
  @IsString()
  @IsNotEmpty()
  menu_code: string;

  @ApiProperty({ example: 'uuid-of-cell' })
  @IsString()
  @IsNotEmpty()
  cel_id: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  accessible: boolean;
}

export class UpdateMenuGroupPermissionsRequest {
  @ApiProperty({ type: [MenuGroupPermissionItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuGroupPermissionItem)
  permissions: MenuGroupPermissionItem[];
}
