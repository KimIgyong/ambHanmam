export interface AssetOpsMetricsResponse {
  generatedAt: string;
  dataVolume: {
    assets: number;
    requests: number;
    requestLogs: number;
    changeLogs: number;
  };
  processing: {
    dashboardQueryMs: number;
    riskQueryMs: number;
    calendarQueryMs: number;
  };
}

export interface AssetRetentionStatusResponse {
  generatedAt: string;
  policy: {
    minimumRetentionYears: number;
    deleteProtection: boolean;
  };
  oldestRecords: {
    assetChangeLogAt: string | null;
    requestStatusLogAt: string | null;
  };
  compliance: {
    withinPolicy: boolean;
    note: string;
  };
}

export interface AssetIntegrationReadinessResponse {
  generatedAt: string;
  integrations: {
    sso: {
      required: boolean;
      implemented: boolean;
      note: string;
    };
    accountLockPolicy: {
      required: boolean;
      implemented: boolean;
      note: string;
    };
  };
}