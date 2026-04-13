export class CreateGaugeScoreDto {
  period: string; // '2026-Q1'
  dimension: string; // 'process' | 'capability' | 'quality'
  score: number; // 0.0 ~ 100.0
  details?: any;
  assessed_by?: string; // 'AI' | 'MANAGER' | 'SELF'
}

export class BulkCreateGaugeScoreDto {
  period: string;
  scores: {
    dimension: string;
    score: number;
    details?: any;
  }[];
}
