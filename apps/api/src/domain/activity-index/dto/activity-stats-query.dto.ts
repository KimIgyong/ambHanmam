import { IsOptional, IsString, IsIn } from 'class-validator';

export class ActivityStatsQueryDto {
  @IsString()
  start_date: string;

  @IsString()
  end_date: string;

  @IsOptional()
  @IsString()
  cell_id?: string;

  @IsOptional()
  @IsIn(['total_score', 'activity_score', 'engagement_score'])
  sort_by?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: string;
}
