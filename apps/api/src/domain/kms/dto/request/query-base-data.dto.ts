export class QueryBaseDataDto {
  category?: string; // category code (e.g., 'COMPANY_IDENTITY')
  language?: string; // 'en' | 'ko' | 'vi'
  confidentiality?: string; // 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL'
}
