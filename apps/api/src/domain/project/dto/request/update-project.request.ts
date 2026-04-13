import { IsString, IsOptional, IsNumber, IsIn, Min } from 'class-validator';

export class UpdateProjectRequest {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  @IsIn(['TECH_BPO', 'SI_DEV', 'INTERNAL', 'R_AND_D', 'MARKETING', 'OTHER'])
  category?: string;

  @IsOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'SUBMITTED', 'REVIEW', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @IsOptional()
  @IsString()
  proposer_id?: string;

  @IsOptional()
  @IsString()
  manager_id?: string;

  @IsOptional()
  @IsString()
  sponsor_id?: string;

  @IsOptional()
  @IsString()
  dept_id?: string;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  contract_id?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
