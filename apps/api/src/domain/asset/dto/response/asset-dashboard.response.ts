export interface AssetDashboardResponse {
  period: {
    from: string;
    to: string;
  };
  assetSummary: {
    totalAssets: number;
    inUseAssets: number;
    reservedAssets: number;
    storedAssets: number;
    usageRate: number;
    reservationRate: number;
  };
  requestSummary: {
    totalRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    delayedReturns: number;
  };
  categoryUsage: Array<{
    category: string;
    usageCount: number;
  }>;
}

export interface AssetRiskReportResponse {
  generatedAt: string;
  overdueReturns: Array<{
    requestId: string;
    requestNo: string;
    requesterName: string | null;
    assetName: string | null;
    endAt: string;
    delayedDays: number;
  }>;
  overuseRequests: Array<{
    requestId: string;
    requestNo: string;
    requesterName: string | null;
    assetName: string | null;
    status: string;
    endAt: string;
  }>;
  frequentExtensionUsers: Array<{
    requesterId: string;
    requesterName: string | null;
    extensionCount: number;
  }>;
}