import { IsString, IsIn, IsObject, IsOptional } from 'class-validator';

export class SaveWithTranslationRequest {
  @IsString()
  @IsIn(['TODO', 'MEETING_NOTE', 'NOTICE', 'ISSUE', 'ISSUE_COMMENT', 'PROJECT', 'PARTNER', 'CLIENT'])
  source_type: string;

  @IsString()
  source_id: string;

  @IsString()
  @IsIn(['en', 'ko', 'vi'])
  target_lang: string;

  @IsObject()
  translated_content: Record<string, string>;

  @IsOptional()
  @IsString()
  @IsIn(['AI', 'HUMAN', 'AI_EDITED'])
  method?: string;
}
