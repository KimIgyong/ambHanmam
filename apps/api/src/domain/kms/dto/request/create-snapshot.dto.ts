export class CreateSnapshotDto {
  metric_id: string;
  period: string; // '2026-Q1' | '2026-01'
  value: number;
  target?: number;
  status?: string; // 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK'
  annotation?: string;
  raw_data?: any;
}

export class BulkCreateSnapshotDto {
  period: string;
  snapshots: {
    metric_id: string;
    value: number;
    target?: number;
    annotation?: string;
  }[];
}
