export class CreateDashboardDto {
  framework_id: string;
  name: string;
  scope: string; // 'ENTITY' | 'SERVICE' | 'PROJECT'
  scope_id?: string;
  period_type?: string; // 'MONTH' | 'QUARTER' | 'YEAR'
  config?: any;
  strategy_step?: number;
}
