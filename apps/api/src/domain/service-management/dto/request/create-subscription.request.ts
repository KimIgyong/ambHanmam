import { IsString, IsOptional, IsNumber, IsInt, IsBoolean, IsUUID, Min, IsIn } from 'class-validator';

export class CreateSubscriptionRequest {
  @IsUUID()
  client_id: string;

  @IsUUID()
  service_id: string;

  @IsOptional() @IsUUID()
  plan_id?: string;

  @IsOptional() @IsString()
  @IsIn(['TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRING', 'EXPIRED', 'CANCELLED'])
  status?: string;

  @IsString()
  start_date: string;

  @IsOptional() @IsString()
  end_date?: string;

  @IsOptional() @IsString()
  trial_end_date?: string;

  @IsOptional() @IsString()
  @IsIn(['MONTHLY', 'YEARLY', 'ONE_TIME', 'CUSTOM'])
  billing_cycle?: string;

  @IsOptional() @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsNumber()
  @Min(0)
  discount_rate?: number;

  @IsOptional() @IsInt()
  @Min(0)
  max_users?: number;

  @IsOptional() @IsInt()
  @Min(0)
  actual_users?: number;

  @IsOptional() @IsUUID()
  contract_id?: string;

  @IsOptional() @IsBoolean()
  auto_renew?: boolean;

  @IsOptional() @IsString()
  note?: string;
}
