import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateSiteEventRequest {
  @IsString()
  @MaxLength(20)
  site: string; // 'portal' | 'app'

  @IsString()
  @MaxLength(50)
  event_type: string; // 'page_view' | 'login' | 'register_visit' | 'subscription'

  @IsOptional()
  @IsUUID()
  entity_id?: string;

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
