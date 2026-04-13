import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  assetService,
  AssetListQuery,
  AssetRequestListQuery,
  CreateAssetBody,
  UpdateAssetBody,
  UpdateAssetStatusBody,
  CreateAssetRequestBody,
  UpdateAssetRequestBody,
  ApproveAssetRequestBody,
} from '../service/asset.service';
import { useEntityId } from '@/domain/hr/hooks/useEntity';

const KEYS = {
  assets: ['assets'] as const,
  assetList: (q?: AssetListQuery) => ['assets', 'list', q] as const,
  assetDetail: (id: string | null) => ['assets', 'detail', id] as const,
  dashboard: (from?: string, to?: string) => ['assets', 'dashboard', from, to] as const,
  risk: (limit?: number) => ['assets', 'risk', limit] as const,
  myRequests: (q?: AssetRequestListQuery) => ['asset-requests', 'my', q] as const,
  approvals: (q?: AssetRequestListQuery) => ['asset-requests', 'approvals', q] as const,
  requestDetail: (id: string | null) => ['asset-requests', 'detail', id] as const,
};

// ─── Assets ─────────────────────────────────────────────────────

export function useAssetList(query?: AssetListQuery) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.assetList(query),
    queryFn: () => assetService.getAssets(query),
    enabled: !!entityId,
  });
}

export function useAssetDetail(id: string | null) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.assetDetail(id),
    queryFn: () => assetService.getAssetById(id!),
    enabled: !!id && !!entityId,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetBody) => assetService.createAsset(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.assets }),
  });
}

export function useUpdateAssetStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetStatusBody }) =>
      assetService.updateAssetStatus(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.assets }),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetBody }) =>
      assetService.updateAsset(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.assets }),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetService.deleteAsset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.assets }),
  });
}

// ─── Excel Import ───────────────────────────────────────────────

export function useImportAssetExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => assetService.importExcel(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.assets }),
  });
}

// ─── Dashboard / Stats ──────────────────────────────────────────

export function useAssetDashboard(from?: string, to?: string) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.dashboard(from, to),
    queryFn: () => assetService.getDashboard(from, to),
    enabled: !!entityId,
  });
}

export function useAssetRisk(limit?: number) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.risk(limit),
    queryFn: () => assetService.getRiskReport(limit),
    enabled: !!entityId,
  });
}

// ─── Asset Requests ─────────────────────────────────────────────

export function useMyRequests(query?: AssetRequestListQuery) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.myRequests(query),
    queryFn: () => assetService.getMyRequests(query),
    enabled: !!entityId,
  });
}

export function useApprovals(query?: AssetRequestListQuery) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.approvals(query),
    queryFn: () => assetService.getApprovals(query),
    enabled: !!entityId,
  });
}

export function useRequestDetail(id: string | null) {
  return useQuery({
    queryKey: KEYS.requestDetail(id),
    queryFn: () => assetService.getRequestById(id!),
    enabled: !!id,
  });
}

export function useCreateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetRequestBody) => assetService.createDraft(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-requests'] });
    },
  });
}

export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssetRequestBody }) =>
      assetService.updateDraft(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-requests'] });
    },
  });
}

export function useSubmitRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetService.submitRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-requests'] });
    },
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetService.cancelRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-requests'] });
    },
  });
}

export function useApproveOrReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveAssetRequestBody }) =>
      assetService.approveOrReject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asset-requests'] });
      qc.invalidateQueries({ queryKey: KEYS.assets });
    },
  });
}
