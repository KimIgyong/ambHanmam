import { IsString, IsArray, IsIn } from 'class-validator';

export class TranslateRequest {
  @IsString()
  @IsIn(['TODO', 'MEETING_NOTE', 'NOTICE', 'ISSUE', 'ISSUE_COMMENT', 'PROJECT', 'PARTNER', 'CLIENT', 'REPORT', 'MISSION'])
  source_type: string;

  @IsString()
  source_id: string;

  @IsArray()
  @IsString({ each: true })
  source_fields: string[];

  @IsString()
  @IsIn(['en', 'ko', 'vi'])
  target_lang: string;
}
