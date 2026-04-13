import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateLeaveRequestRequest {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ANNUAL', 'AM_HALF', 'PM_HALF', 'SICK', 'SPECIAL', 'MENSTRUATION'])
  type: string;

  @IsString()
  @IsNotEmpty()
  start_date: string;

  @IsString()
  @IsNotEmpty()
  end_date: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
