import { IsString, IsOptional, IsIn } from 'class-validator';

export class RejectExpenseRequestDto {
  @IsString()
  comment: string;
}

export class ApproveExpenseRequestDto {
  @IsString()
  @IsOptional()
  comment?: string;
}

export class QueryExpenseRequestDto {
  @IsOptional()
  @IsIn(['my', 'all'])
  view?: 'my' | 'all';

  @IsOptional()
  status?: string;

  @IsOptional()
  category?: string;

  @IsOptional()
  frequency?: string;

  @IsOptional()
  keyword?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;

  @IsOptional()
  year_month?: string;

  @IsOptional()
  requester_id?: string;
}
