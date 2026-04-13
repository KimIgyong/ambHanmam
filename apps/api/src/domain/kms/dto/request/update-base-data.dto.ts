export class UpdateBaseDataDto {
  data: any; // JSONB matching category schema
  change_reason?: string;
  update_source?: string; // 'MANUAL' | 'AI_EXTRACTED' | 'MODULE_SYNC' | 'UPLOAD_DIFF' | 'DDD_SYNC'
}
