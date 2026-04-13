import { AssetEntity } from '../entity/asset.entity';
import { AssetResponse } from '../dto/response/asset.response';

export class AssetMapper {
  static toResponse(entity: AssetEntity): AssetResponse {
    return {
      assetId: entity.astId,
      assetCode: entity.astCode,
      assetName: entity.astName,
      assetCategory: entity.astCategory,
      ownershipType: entity.astOwnershipType,
      unit: entity.astUnit,
      managerId: entity.astManagerId,
      managerName: entity.manager?.usrName || null,
      location: entity.astLocation,
      status: entity.astStatus,
      manufacturer: entity.astManufacturer,
      modelName: entity.astModelName,
      serialNo: entity.astSerialNo,
      purchaseDate: entity.astPurchaseDate
        ? (entity.astPurchaseDate instanceof Date
            ? entity.astPurchaseDate.toISOString().split('T')[0]
            : String(entity.astPurchaseDate))
        : null,
      vendor: entity.astVendor,
      currency: entity.astCurrency || 'USD',
      purchaseAmount: entity.astPurchaseAmount,
      depreciationYears: entity.astDepreciationYears,
      residualValue: entity.astResidualValue,
      quantity: entity.astQuantity,
      barcode: entity.astBarcode,
      rfidCode: entity.astRfidCode,
      roomCapacity: entity.astRoomCapacity,
      roomEquipments: entity.astRoomEquipments,
      roomAvailableFrom: entity.astRoomAvailableFrom,
      roomAvailableTo: entity.astRoomAvailableTo,
      createdAt: entity.astCreatedAt.toISOString(),
      updatedAt: entity.astUpdatedAt.toISOString(),
    };
  }
}
