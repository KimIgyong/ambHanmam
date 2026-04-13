import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { ExpenseRequestEntity } from './entity/expense-request.entity';
import { ExpenseRequestItemEntity } from './entity/expense-request-item.entity';
import { ExpenseApprovalEntity } from './entity/expense-approval.entity';
import { ExpenseAttachmentEntity } from './entity/expense-attachment.entity';
import { ExpenseExecutionEntity } from './entity/expense-execution.entity';
import { ExpenseForecastReportEntity } from './entity/expense-forecast-report.entity';
import { ExpenseForecastItemEntity } from './entity/expense-forecast-item.entity';
import { UserEntity } from '../auth/entity/user.entity';

import { ExpenseRequestController } from './controller/expense-request.controller';
import { ExpenseExecutionController, ExpenseReportController } from './controller/expense-report.controller';

import { ExpenseRequestService } from './service/expense-request.service';
import { ExpenseApprovalService } from './service/expense-approval.service';
import { ExpenseNumberService } from './service/expense-number.service';
import { ExpenseRecurringService } from './service/expense-recurring.service';
import { ExpenseExecutionService } from './service/expense-execution.service';
import { ExpenseAttachmentService } from './service/expense-attachment.service';
import { ExpenseReportService } from './service/expense-report.service';
import { ExpenseForecastService } from './service/expense-forecast.service';

import { MailModule } from '../../infrastructure/external/mail/mail.module';
import { HrModule } from '../hr/hr.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExpenseRequestEntity,
      ExpenseRequestItemEntity,
      ExpenseApprovalEntity,
      ExpenseAttachmentEntity,
      ExpenseExecutionEntity,
      ExpenseForecastReportEntity,
      ExpenseForecastItemEntity,
      UserEntity,
    ]),
    MulterModule.register({ storage: memoryStorage() }),
    MailModule,
    HrModule,
  ],
  controllers: [
    ExpenseRequestController,
    ExpenseExecutionController,
    ExpenseReportController,
  ],
  providers: [
    ExpenseRequestService,
    ExpenseApprovalService,
    ExpenseNumberService,
    ExpenseRecurringService,
    ExpenseExecutionService,
    ExpenseAttachmentService,
    ExpenseReportService,
    ExpenseForecastService,
  ],
  exports: [
    ExpenseRequestService,
    ExpenseReportService,
    ExpenseForecastService,
  ],
})
export class ExpenseRequestModule {}
