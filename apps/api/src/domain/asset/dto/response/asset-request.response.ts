export interface AssetRequestResponse {
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
