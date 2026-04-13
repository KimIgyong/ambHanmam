import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccountEntity } from './entity/bank-account.entity';
import { TransactionEntity } from './entity/transaction.entity';
import { RecurringExpenseEntity } from './entity/recurring-expense.entity';
import { AnalysisReportEntity } from './entity/analysis-report.entity';
import { AnalysisPromptEntity } from './entity/analysis-prompt.entity';
import { AccountingService } from './service/accounting.service';
import { ExcelImportService } from './service/excel-import.service';
import { RecurringExpenseService } from './service/recurring-expense.service';
import { AnalysisService } from './service/analysis.service';
import { AccountController } from './controller/account.controller';
import { TransactionController } from './controller/transaction.controller';
import { RecurringExpenseController } from './controller/recurring-expense.controller';
import { AnalysisController } from './controller/analysis.controller';
import { HrModule } from '../hr/hr.module';
import { ClaudeModule } from '../../infrastructure/external/claude/claude.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankAccountEntity, TransactionEntity, RecurringExpenseEntity,
      AnalysisReportEntity, AnalysisPromptEntity,
    ]),
    HrModule,
    ClaudeModule,
  ],
  controllers: [AnalysisController, RecurringExpenseController, AccountController, TransactionController],
  providers: [AccountingService, ExcelImportService, RecurringExpenseService, AnalysisService],
})
export class AccountingModule {}
