import { TransactionEntity } from '../entity/transaction.entity';
import { TransactionResponse } from '@amb/types';

export class TransactionMapper {
  static toResponse(entity: TransactionEntity): TransactionResponse {
    return {
      transactionId: entity.txnId,
      accountId: entity.bacId,
      seqNo: entity.txnSeqNo ?? 0,
      transactionDate: entity.txnDate,
      projectName: entity.txnProjectName,
      netValue: Number(entity.txnNetValue),
      vat: Number(entity.txnVat),
      bankCharge: Number(entity.txnBankCharge),
      totalValue: Number(entity.txnTotalValue),
      balance: Number(entity.txnBalance),
      cumulativeBalance: Number(entity.txnCumulativeBalance),
      vendor: entity.txnVendor,
      description: entity.txnDescription,
      createdAt: entity.txnCreatedAt.toISOString(),
      updatedAt: entity.txnUpdatedAt.toISOString(),
    };
  }
}
