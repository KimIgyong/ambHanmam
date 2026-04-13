import { IsArray, ValidateNested, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class SectionOrderItem {
  @IsUUID()
  id: string;

  @IsInt()
  sort_order: number;
}

export class ReorderSectionRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionOrderItem)
  items: SectionOrderItem[];
}
