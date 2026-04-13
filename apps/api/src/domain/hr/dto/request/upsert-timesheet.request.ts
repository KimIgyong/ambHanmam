import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TimesheetEntryDto {
  @IsString()
  @IsNotEmpty()
  employee_id: string;

  @IsString()
  @IsNotEmpty()
  work_date: string;

  @IsOptional()
  @IsString()
  attendance_code?: string;

  @IsOptional()
  @IsNumber()
  work_hours?: number;
}

export class UpsertTimesheetRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimesheetEntryDto)
  entries: TimesheetEntryDto[];

  @IsOptional()
  @IsString()
  period_id?: string;
}
