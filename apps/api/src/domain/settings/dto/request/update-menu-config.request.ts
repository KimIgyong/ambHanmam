import { IsArray, ValidateNested, IsString, IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class MenuConfigItem {
  @ApiProperty({ example: 'TODO' })
  @IsString()
  @IsNotEmpty()
  menu_code: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: 100 })
  @IsInt()
  sort_order: number;
}

export class UpdateMenuConfigRequest {
  @ApiProperty({ type: [MenuConfigItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuConfigItem)
  configs: MenuConfigItem[];
}

export class PatchMenuConfigRequest {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsInt()
  sort_order?: number;
}
