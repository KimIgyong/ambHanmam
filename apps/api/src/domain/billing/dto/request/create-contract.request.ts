import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CreateMilestoneDto {
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
}

class CreatePaymentScheduleDto {
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
}

export class CreateContractRequest {
  @IsString()
  partner_id: string;

  @IsString()
  @IsIn(['RECEIVABLE', 'PAYABLE'])
  direction: string;

  @IsString()
  @IsIn(['TECH_BPO', 'SI_DEV', 'MAINTENANCE', 'MARKETING', 'GENERAL_AFFAIRS', 'OTHER'])
  category: string;

  @IsString()
  @IsIn(['FIXED', 'USAGE_BASED', 'MILESTONE', 'AD_HOC'])
  type: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  start_date: string;

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
  predecessor_id?: string;

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
  @Type(() => CreateMilestoneDto)
  milestones?: CreateMilestoneDto[];

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
  @Type(() => CreatePaymentScheduleDto)
  payment_schedules?: CreatePaymentScheduleDto[];
}
