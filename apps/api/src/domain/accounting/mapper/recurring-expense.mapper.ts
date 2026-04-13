import { RecurringExpenseEntity } from '../entity/recurring-expense.entity';
import { RecurringExpenseResponse } from '@amb/types';

export class RecurringExpenseMapper {
  static toResponse(entity: RecurringExpenseEntity, accountAlias?: string | null): RecurringExpenseResponse {
    return {
      id: entity.rexId,
      accountId: entity.bacId,
      accountAlias: accountAlias || null,
      name: entity.rexName,
      vendor: entity.rexVendor,
      amount: Number(entity.rexAmount),
      currency: entity.rexCurrency,
      dayOfMonth: entity.rexDayOfMonth,
      category: entity.rexCategory,
      description: entity.rexDescription,
      isActive: entity.rexIsActive,
      startDate: entity.rexStartDate,
      endDate: entity.rexEndDate,
      createdAt: entity.rexCreatedAt.toISOString(),
      updatedAt: entity.rexUpdatedAt.toISOString(),
    };
  }
}
