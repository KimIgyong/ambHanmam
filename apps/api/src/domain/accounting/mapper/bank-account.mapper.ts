import { BankAccountEntity } from '../entity/bank-account.entity';
import { BankAccountResponse } from '@amb/types';

export class BankAccountMapper {
  static toResponse(
    entity: BankAccountEntity,
    currentBalance?: number,
    lastTransactionDate?: string | null,
  ): BankAccountResponse {
    return {
      accountId: entity.bacId,
      bankName: entity.bacBankName,
      branchName: entity.bacBranchName,
      accountNumber: entity.bacAccountNumber,
      accountAlias: entity.bacAccountAlias,
      currency: entity.bacCurrency,
      openingBalance: Number(entity.bacOpeningBalance),
      openingDate: entity.bacOpeningDate || null,
      isActive: entity.bacIsActive,
      currentBalance: currentBalance !== undefined ? currentBalance : Number(entity.bacOpeningBalance),
      lastTransactionDate: lastTransactionDate || null,
      createdAt: entity.bacCreatedAt.toISOString(),
      updatedAt: entity.bacUpdatedAt.toISOString(),
    };
  }
}
