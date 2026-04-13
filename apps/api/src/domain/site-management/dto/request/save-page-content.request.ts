import { IsString, IsOptional } from 'class-validator';

export class SavePageContentRequest {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  sections_json?: Record<string, any>;
}
