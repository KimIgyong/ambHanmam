import { IsString } from 'class-validator';

export class GenerateInvoicesRequest {
  @IsString()
  year_month: string; // YYYY-MM
}
