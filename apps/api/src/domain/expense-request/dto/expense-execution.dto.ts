import {
  IsString, IsNotEmpty, IsOptional, IsNumber,
  IsIn, IsDateString, Min,
} from 'class-validator';

export class CreateExpenseExecutionDto {
  @IsDateString()
  executed_at: string;

  @IsIn(['CARD', 'CASH', 'TRANSFER', 'OTHER'])
  method: string;

  @IsString()
  @IsOptional()
  method_note?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsIn(['RECEIPT', 'TAX_INVOICE', 'NONE'])
  @IsOptional()
  receipt_type?: string;

  @IsString()
  @IsOptional()
  receipt_number?: string;

  @IsString()
  @IsOptional()
  receipt_link_url?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateExpenseExecutionDto {
  @IsDateString()
  @IsOptional()
  executed_at?: string;

  @IsIn(['CARD', 'CASH', 'TRANSFER', 'OTHER'])
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  method_note?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsIn(['RECEIPT', 'TAX_INVOICE', 'NONE'])
  @IsOptional()
  receipt_type?: string;

  @IsString()
  @IsOptional()
  receipt_number?: string;

  @IsString()
  @IsOptional()
  receipt_link_url?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
