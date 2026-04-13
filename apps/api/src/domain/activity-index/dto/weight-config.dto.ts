import { IsArray, ValidateNested, IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class WeightItemDto {
  @IsString()
  category: string; // ISSUE | MEETING_NOTE | COMMENT | TODO | CHAT_MESSAGE

  @IsInt()
  @Min(0)
  @Max(10)
  weight: number;

  @IsInt()
  @Min(0)
  @Max(10)
  engagement_weight: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  daily_cap?: number | null;
}

export class UpdateWeightsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeightItemDto)
  weights: WeightItemDto[];
}
