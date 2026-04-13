import { IsString, IsOptional, IsNumber, IsIn, Min, Max } from 'class-validator';

export class ReviewProjectRequest {
  @IsString()
  @IsIn(['APPROVE', 'REJECT', 'HOLD', 'COMMENT'])
  action: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(2)
  step?: number;
}
