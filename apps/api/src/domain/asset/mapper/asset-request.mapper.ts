import { AssetRequestEntity } from '../entity/asset-request.entity';
import { AssetRequestResponse } from '../dto/response/asset-request.response';

export class AssetRequestMapper {
  static toResponse(entity: AssetRequestEntity): AssetRequestResponse {
    return {
      requestId: entity.asrId,
      requestNo: entity.asrRequestNo,
      requesterId: entity.asrRequesterId,
      requesterName: entity.requester?.usrName || null,
      requestType: entity.asrRequestType,
      assetSelectMode: entity.asrAssetSelectMode,
      assetId: entity.astId,
      assetCode: entity.asset?.astCode || null,
      assetName: entity.asset?.astName || null,
      assetCategory: entity.asrAssetCategory,
      purpose: entity.asrPurpose,
      startAt: entity.asrStartAt.toISOString(),
      endAt: entity.asrEndAt.toISOString(),
      place: entity.asrPlace,
      status: entity.asrStatus,
      finalApproverId: entity.asrFinalApproverId,
      returnedAt: entity.asrReturnedAt ? entity.asrReturnedAt.toISOString() : null,
      createdAt: entity.asrCreatedAt.toISOString(),
      updatedAt: entity.asrUpdatedAt.toISOString(),
    };
  }
}
