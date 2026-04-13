import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateOtRecordRequest {
  @IsString()
  @IsNotEmpty()
  employee_id: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time_start: string;

  @IsString()
  @IsNotEmpty()
  time_end: string;

  @IsOptional()
  @IsString()
  project_description?: string;

  @IsString()
  @IsIn(['WEEKDAY_150', 'WEEKDAY_NIGHT_200', 'WEEKEND_200', 'WEEKEND_NIGHT_210', 'HOLIDAY_300'])
  ot_type: string;

  @IsNumber()
  actual_hours: number;

  @IsNumber()
  converted_hours: number;
}
