import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateSiteEventRequest {
  @IsString()
  @MaxLength(50)
  event_type: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  page_path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
