import { IsArray, ValidateNested, IsUUID, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class MenuOrderItem {
  @IsUUID()
  id: string;

  @IsInt()
  sort_order: number;

  @IsOptional()
  @IsUUID()
  parent_id?: string | null;
}

export class ReorderMenuRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuOrderItem)
  items: MenuOrderItem[];
}
