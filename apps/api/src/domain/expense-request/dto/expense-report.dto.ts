import {
  IsString, IsOptional, IsInt, IsNumber, IsArray,
  ValidateNested, IsIn, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MonthlyReportQueryDto {
  @IsInt()
  year: number;

  @IsInt()
  month: number;
}

export class ForecastItemDto {
  @IsIn(['RECURRING', 'MANUAL'])
  type: string;

  @IsString()
  @IsOptional()
  exr_id?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @IsOptional()
  prev_amount?: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsInt()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}

export class CreateForecastReportDto {
  @IsInt()
  year: number;

  @IsInt()
  month: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ForecastItemDto)
  items: ForecastItemDto[];
}

export class UpdateForecastReportDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ForecastItemDto)
  @IsOptional()
  items?: ForecastItemDto[];
}
