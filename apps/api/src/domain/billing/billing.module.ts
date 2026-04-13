import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PartnerEntity } from './entity/partner.entity';
import { ContractEntity } from './entity/contract.entity';
import { ContractMilestoneEntity } from './entity/contract-milestone.entity';
import { PaymentScheduleEntity } from './entity/payment-schedule.entity';
import { SowEntity } from './entity/sow.entity';
import { BillingDocumentEntity } from './entity/document.entity';
import { InvoiceEntity } from './entity/invoice.entity';
import { InvoiceItemEntity } from './entity/invoice-item.entity';
import { PaymentEntity } from './entity/payment.entity';
import { ContractHistoryEntity } from './entity/contract-history.entity';
import { PartnerService } from './service/partner.service';
import { ContractService } from './service/contract.service';
import { SowService } from './service/sow.service';
import { BillingDocumentService } from './service/billing-document.service';
import { InvoiceService } from './service/invoice.service';
import { InvoiceNumberingService } from './service/invoice-numbering.service';
import { InvoicePdfService } from './service/invoice-pdf.service';
import { PaymentService } from './service/payment.service';
import { BillingAutomationService } from './service/billing-automation.service';
import { BillingReportService } from './service/billing-report.service';
import { InvoiceEmailService } from './service/invoice-email.service';
import { InvoiceApprovalService } from './service/invoice-approval.service';
import { InvoiceTodoService } from './service/invoice-todo.service';
import { WorkReportService } from './service/work-report.service';
import { PartnerSeedService } from './service/partner-seed.service';
import { ContractSeedService } from './service/contract-seed.service';
import { EinvoiceService } from './service/einvoice/einvoice.service';
import { EinvoiceXmlService } from './service/einvoice/einvoice-xml.service';
import { TvanMockService } from './service/einvoice/tvan-mock.service';
import { TvanRealService } from './service/einvoice/tvan-real.service';
import { TVAN_API_SERVICE } from './service/einvoice/tvan-api.interface';
import { NtsTaxInvoiceService } from './service/nts-tax-invoice.service';
import { PartnerController } from './controller/partner.controller';
import { ContractController } from './controller/contract.controller';
import { SowController } from './controller/sow.controller';
import { BillingDocumentController } from './controller/billing-document.controller';
import { InvoiceController } from './controller/invoice.controller';
import { PaymentController } from './controller/payment.controller';
import { BillingAutomationController } from './controller/billing-automation.controller';
import { BillingReportController } from './controller/billing-report.controller';
import { HrModule } from '../hr/hr.module';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { TodoEntity } from '../todo/entity/todo.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { GoogleSheetsModule } from '../../infrastructure/external/google-sheets/google-sheets.module';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PartnerEntity, ContractEntity, ContractMilestoneEntity, PaymentScheduleEntity, SowEntity,
      BillingDocumentEntity, InvoiceEntity, InvoiceItemEntity, PaymentEntity,
      ContractHistoryEntity, HrEntityEntity, TodoEntity, UserEntity,
    ]),
    ScheduleModule.forRoot(),
    HrModule,
    GoogleSheetsModule,
    ConfigModule,
    TranslationModule,
  ],
  controllers: [PartnerController, ContractController, SowController, BillingDocumentController, InvoiceController, PaymentController, BillingAutomationController, BillingReportController],
  providers: [
    PartnerService, ContractService, SowService, BillingDocumentService,
    InvoiceService, InvoiceNumberingService, InvoicePdfService, InvoiceEmailService,
    InvoiceApprovalService, InvoiceTodoService, WorkReportService,
    PaymentService, BillingAutomationService, BillingReportService, PartnerSeedService, ContractSeedService,
    // E-Invoice services
    EinvoiceService,
    EinvoiceXmlService,
    {
      provide: TVAN_API_SERVICE,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('TVAN_PROVIDER', 'mock');
        return provider === 'real' ? new TvanRealService() : new TvanMockService();
      },
      inject: [ConfigService],
    },
    // NTS Tax Invoice (Korea)
    NtsTaxInvoiceService,
  ],
  exports: [PartnerService, ContractService, SowService, BillingDocumentService, InvoiceService, PaymentService],
})
export class BillingModule {}
