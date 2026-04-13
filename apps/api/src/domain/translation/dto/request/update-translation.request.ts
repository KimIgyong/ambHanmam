import { IsString, IsOptional } from 'class-validator';

export class UpdateTranslationRequest {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  change_reason?: string;
}
