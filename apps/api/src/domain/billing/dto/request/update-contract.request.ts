import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNumber()
  seq: number;

  @IsString()
  label: string;

  @IsNumber()
  percentage: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  due_date?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

class UpdatePaymentScheduleDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNumber()
  seq: number;

  @IsString()
  billing_date: string;

  @IsOptional()
  @IsString()
  billing_period?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateContractRequest {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'ENDED', 'RENEWED', 'TERMINATED', 'LIQUIDATED'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;

  @IsOptional()
  @IsNumber()
  billing_day?: number;

  @IsOptional()
  @IsString()
  billing_period?: string;

  @IsOptional()
  @IsBoolean()
  auto_generate?: boolean;

  @IsOptional()
  @IsNumber()
  unit_price?: number;

  @IsOptional()
  @IsString()
  unit_desc?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  gsheet_url?: string;

  @IsOptional()
  @IsString()
  gsheet_tab_pattern?: string;

  @IsOptional()
  @IsString()
  assigned_user_id?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMilestoneDto)
  milestones?: UpdateMilestoneDto[];

  @IsOptional()
  @IsString()
  @IsIn(['REGULAR', 'IRREGULAR'])
  payment_type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  billing_amount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePaymentScheduleDto)
  payment_schedules?: UpdatePaymentScheduleDto[];
}
