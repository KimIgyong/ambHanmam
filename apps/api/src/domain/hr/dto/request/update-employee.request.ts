import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  full_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['VIETNAMESE', 'FOREIGNER', 'KOREAN'])
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cccd_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tax_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  si_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  hospital_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['OFFICIAL', 'PROBATION', 'PARENTAL_LEAVE', 'TEMPORARY_LEAVE', 'RESIGNED'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['EMPLOYEE', 'FREELANCER'])
  contract_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['GROSS', 'NET'])
  salary_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['MON_FRI', 'MON_SAT'])
  work_schedule?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entity_id?: string;
}
