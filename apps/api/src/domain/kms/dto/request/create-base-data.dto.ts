export class CreateBaseDataDto {
  category_id: string;
  language?: string; // 'en' | 'ko' | 'vi', default: 'en'
  data: any; // JSONB matching category schema
  update_source?: string; // 'MANUAL' | 'AI_EXTRACTED' | 'MODULE_SYNC' | 'DDD_SYNC'
}
