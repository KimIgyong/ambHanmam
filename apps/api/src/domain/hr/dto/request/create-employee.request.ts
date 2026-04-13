import { IsString, IsNotEmpty, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  employee_code?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  full_name: string;

  @ApiProperty()
  @IsString()
  @IsIn(['VIETNAMESE', 'FOREIGNER', 'KOREAN'])
  nationality: string;

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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty()
  @IsString()
  @IsIn(['OFFICIAL', 'PROBATION', 'PARENTAL_LEAVE', 'TEMPORARY_LEAVE', 'RESIGNED'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsIn(['EMPLOYEE', 'FREELANCER'])
  contract_type?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  department: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  position: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  region?: string;

  @ApiProperty()
  @IsString()
  @IsIn(['GROSS', 'NET'])
  salary_type: string;

  @ApiProperty()
  @IsString()
  @IsIn(['MON_FRI', 'MON_SAT'])
  work_schedule: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entity_id?: string;
}
