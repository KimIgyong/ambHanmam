import { apiClient } from '@/lib/api-client';

// ─── Response Types (camelCase) ─────────────────────────────────

export interface Asset {
  assetId: string;
  assetCode: string;
  assetName: string;
  assetCategory: string;
  ownershipType: string;
  unit: string | null;
  managerId: string | null;
  managerName: string | null;
  location: string | null;
  status: string;
  manufacturer: string | null;
  modelName: string | null;
  serialNo: string | null;
  purchaseDate: string | null;
  vendor: string | null;
  currency: string;
  purchaseAmount: string | null;
  depreciationYears: number | null;
  residualValue: string | null;
  quantity: number | null;
  barcode: string | null;
  rfidCode: string | null;
  roomCapacity: number | null;
  roomEquipments: string[] | null;
  roomAvailableFrom: string | null;
  roomAvailableTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetRequest {
  requestId: string;
  requestNo: string;
  requesterId: string;
  requesterName: string | null;
  requestType: string;
  assetSelectMode: string;
  assetId: string | null;
  assetCode: string | null;
  assetName: string | null;
  assetCategory: string | null;
  purpose: string;
  startAt: string;
  endAt: string;
  place: string | null;
  status: string;
  finalApproverId: string | null;
  returnedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDashboard {
  period: { from: string; to: string };
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
  categoryUsage: Array<{ category: string; usageCount: number }>;
}

export interface AssetRiskReport {
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

// ─── Request Types (snake_case) ─────────────────────────────────

export interface CreateAssetBody {
  asset_name: string;
  asset_category: string;
  ownership_type: string;
  unit?: string;
  manager_id?: string;
  location?: string;
  status?: string;
  manufacturer?: string;
  model_name?: string;
  serial_no?: string;
  purchase_date?: string;
  vendor?: string;
  currency?: string;
  purchase_amount?: string;
  depreciation_years?: number;
  residual_value?: string;
  quantity?: number;
  barcode?: string;
  rfid_code?: string;
  room_capacity?: number;
  room_equipments?: string[];
  room_available_from?: string;
  room_available_to?: string;
}

export interface UpdateAssetStatusBody {
  status: string;
  reason: string;
}

export interface UpdateAssetBody extends Partial<CreateAssetBody> {}

export interface CreateAssetRequestBody {
  request_type: string;
  asset_select_mode: string;
  asset_id?: string;
  asset_category?: string;
  purpose: string;
  start_at: string;
  end_at: string;
  place?: string;
  meeting_title?: string;
  attendee_count?: number;
  meeting_type?: string;
  required_equipments?: string[];
}

export interface UpdateAssetRequestBody extends Partial<CreateAssetRequestBody> {}

export interface ApproveAssetRequestBody {
  action: 'APPROVE' | 'REJECT';
  assign_asset_id?: string;
  comment?: string;
  reject_reason?: string;
}

// ─── Query Types ────────────────────────────────────────────────

export interface AssetListQuery {
  category?: string;
  status?: string;
  q?: string;
}

export interface AssetRequestListQuery {
  status?: string;
  request_type?: string;
}

// ─── API Response Wrapper ───────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// ─── Service ────────────────────────────────────────────────────

class AssetService {
  private readonly basePath = '/assets';
  private readonly requestPath = '/asset-requests';

  // === Assets ===

  getAssets = (query?: AssetListQuery) =>
    apiClient.get<ApiResponse<Asset[]>>(this.basePath, { params: query }).then((r) => r.data.data);

  getAssetById = (id: string) =>
    apiClient.get<ApiResponse<Asset>>(`${this.basePath}/${id}`).then((r) => r.data.data);

  createAsset = (data: CreateAssetBody) =>
    apiClient.post<ApiResponse<Asset>>(this.basePath, data).then((r) => r.data.data);

  updateAssetStatus = (id: string, data: UpdateAssetStatusBody) =>
    apiClient.patch<ApiResponse<Asset>>(`${this.basePath}/${id}/status`, data).then((r) => r.data.data);

  updateAsset = (id: string, data: UpdateAssetBody) =>
    apiClient.patch<ApiResponse<Asset>>(`${this.basePath}/${id}`, data).then((r) => r.data.data);

  deleteAsset = (id: string) =>
    apiClient.delete<ApiResponse<boolean>>(`${this.basePath}/${id}`).then((r) => r.data.data);

  // === Excel Import ===

  downloadImportTemplate = async () => {
    const res = await apiClient.get(`${this.basePath}/import/template`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset_import_template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  importExcel = (formData: FormData) =>
    apiClient.post<ApiResponse<{ totalRows: number; successCount: number; failCount: number; errors: { row: number; field: string; message: string }[] }>>(
      `${this.basePath}/import/excel`, formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then((r) => r.data.data);

  // === Dashboard / Stats ===

  getDashboard = (from?: string, to?: string) =>
    apiClient.get<ApiResponse<AssetDashboard>>(`${this.basePath}/stats/dashboard`, { params: { from, to } }).then((r) => r.data.data);

  getRiskReport = (limit?: number) =>
    apiClient.get<ApiResponse<AssetRiskReport>>(`${this.basePath}/stats/risk`, { params: { limit } }).then((r) => r.data.data);

  // === Asset Requests ===

  createDraft = (data: CreateAssetRequestBody) =>
    apiClient.post<ApiResponse<AssetRequest>>(this.requestPath, data).then((r) => r.data.data);

  updateDraft = (id: string, data: UpdateAssetRequestBody) =>
    apiClient.patch<ApiResponse<AssetRequest>>(`${this.requestPath}/${id}`, data).then((r) => r.data.data);

  submitRequest = (id: string) =>
    apiClient.post<ApiResponse<AssetRequest>>(`${this.requestPath}/${id}/submit`).then((r) => r.data.data);

  cancelRequest = (id: string) =>
    apiClient.delete<ApiResponse<boolean>>(`${this.requestPath}/${id}/cancel`).then((r) => r.data.data);

  getMyRequests = (query?: AssetRequestListQuery) =>
    apiClient.get<ApiResponse<AssetRequest[]>>(`${this.requestPath}/my`, { params: query }).then((r) => r.data.data);

  getApprovals = (query?: AssetRequestListQuery) =>
    apiClient.get<ApiResponse<AssetRequest[]>>(`${this.requestPath}/approvals`, { params: query }).then((r) => r.data.data);

  getRequestById = (id: string) =>
    apiClient.get<ApiResponse<AssetRequest>>(`${this.requestPath}/${id}`).then((r) => r.data.data);

  approveOrReject = (id: string, data: ApproveAssetRequestBody) =>
    apiClient.post<ApiResponse<AssetRequest>>(`${this.requestPath}/${id}/approve`, data).then((r) => r.data.data);
}

export const assetService = new AssetService();
