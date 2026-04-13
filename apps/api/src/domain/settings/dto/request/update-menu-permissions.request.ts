import { IsArray, ValidateNested, IsString, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class MenuPermissionItem {
  @ApiProperty({ example: 'CHAT_HR' })
  @IsString()
  @IsNotEmpty()
  menu_code: string;

  @ApiProperty({ example: 'USER' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  accessible: boolean;
}

export class UpdateMenuPermissionsRequest {
  @ApiProperty({ type: [MenuPermissionItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuPermissionItem)
  permissions: MenuPermissionItem[];
}
