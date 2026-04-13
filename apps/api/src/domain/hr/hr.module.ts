import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from './entity/employee.entity';
import { DependentEntity } from './entity/dependent.entity';
import { SalaryHistoryEntity } from './entity/salary-history.entity';
import { SystemParamEntity } from './entity/system-param.entity';
import { HolidayEntity } from './entity/holiday.entity';
import { PayrollPeriodEntity } from './entity/payroll-period.entity';
import { PayrollDetailEntity } from './entity/payroll-detail.entity';
import { TimesheetEntity } from './entity/timesheet.entity';
import { OtRecordEntity } from './entity/ot-record.entity';
import { LeaveBalanceEntity } from './entity/leave-balance.entity';
import { HrEntityEntity } from './entity/hr-entity.entity';
import { EntityUserRoleEntity } from './entity/entity-user-role.entity';
import { EmployeeKrEntity } from './entity/employee-kr.entity';
import { FreelancerEntity } from './entity/freelancer.entity';
import { InsuranceParamsKrEntity } from './entity/insurance-params-kr.entity';
import { TaxSimpleTableEntity } from './entity/tax-simple-table.entity';
import { PayrollEntryKrEntity } from './entity/payroll-entry-kr.entity';
import { BusinessIncomeEntity } from './entity/business-income.entity';
import { YearendAdjustmentEntity } from './entity/yearend-adjustment.entity';
import { LeaveRequestEntity } from './entity/leave-request.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { InvitationEntity } from '../invitation/entity/invitation.entity';
import { EmployeeService } from './service/employee.service';
import { SystemParamService } from './service/system-param.service';
import { PayrollCalcService } from './service/payroll-calc.service';
import { PayrollService } from './service/payroll.service';
import { TimesheetService } from './service/timesheet.service';
import { OtRecordService } from './service/ot-record.service';
import { LeaveService } from './service/leave.service';
import { SeveranceService } from './service/severance.service';
import { EntityService } from './service/entity.service';
import { EmployeeKrService } from './service/employee-kr.service';
import { FreelancerService } from './service/freelancer.service';
import { InsuranceParamsKrService } from './service/insurance-params-kr.service';
import { TaxTableService } from './service/tax-table.service';
import { KrInsuranceCalcService } from './service/kr-insurance-calc.service';
import { KrTaxCalcService } from './service/kr-tax-calc.service';
import { KrPayrollCalcService } from './service/kr-payroll-calc.service';
import { BusinessIncomeService } from './service/business-income.service';
import { YearendAdjustmentService } from './service/yearend-adjustment.service';
import { LeaveRequestService } from './service/leave-request.service';
import { KrReportService } from './service/kr-report.service';
import { KrPayslipPdfService } from './service/kr-payslip-pdf.service';
import { EmployeeController } from './controller/employee.controller';
import { SystemParamController } from './controller/system-param.controller';
import { PayrollController } from './controller/payroll.controller';
import { TimesheetController } from './controller/timesheet.controller';
import { OtRecordController } from './controller/ot-record.controller';
import { LeaveController } from './controller/leave.controller';
import { SeveranceController } from './controller/severance.controller';
import { EntityController } from './controller/entity.controller';
import { EmployeeKrController } from './controller/employee-kr.controller';
import { FreelancerController } from './controller/freelancer.controller';
import { KrSettingsController } from './controller/kr-settings.controller';
import { BusinessIncomeController } from './controller/business-income.controller';
import { YearendAdjustmentController } from './controller/yearend-adjustment.controller';
import { LeaveRequestController } from './controller/leave-request.controller';
import { KrReportController } from './controller/kr-report.controller';
import { HrReportService } from './service/hr-report.service';
import { PayslipPdfService } from './service/payslip-pdf.service';
import { HrReportController } from './controller/hr-report.controller';
import { HrSeedService } from './service/hr-seed.service';
import { EmployeeSeedService } from './service/employee-seed.service';
import { EntitySeedService } from './service/entity-seed.service';
import { EntityGuard } from './guard/entity.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeEntity, DependentEntity, SalaryHistoryEntity,
      SystemParamEntity, HolidayEntity,
      PayrollPeriodEntity, PayrollDetailEntity,
      TimesheetEntity, OtRecordEntity, LeaveBalanceEntity,
      HrEntityEntity, EntityUserRoleEntity,
      EmployeeKrEntity, FreelancerEntity,
      InsuranceParamsKrEntity, TaxSimpleTableEntity,
      PayrollEntryKrEntity, BusinessIncomeEntity,
      YearendAdjustmentEntity, LeaveRequestEntity,
      UserEntity,
      InvitationEntity,
    ]),
  ],
  controllers: [
    EmployeeController, SystemParamController, PayrollController,
    TimesheetController, OtRecordController, LeaveController,
    SeveranceController, HrReportController, EntityController,
    EmployeeKrController, FreelancerController, KrSettingsController,
    BusinessIncomeController,
    KrReportController,
    YearendAdjustmentController,
    LeaveRequestController,
  ],
  providers: [
    EmployeeService, SystemParamService, PayrollCalcService, PayrollService,
    TimesheetService, OtRecordService, LeaveService, SeveranceService,
    HrReportService, PayslipPdfService, HrSeedService, EmployeeSeedService,
    EntitySeedService, EntityService, EntityGuard,
    EmployeeKrService, FreelancerService,
    InsuranceParamsKrService, TaxTableService,
    KrInsuranceCalcService, KrTaxCalcService, KrPayrollCalcService,
    BusinessIncomeService,
    KrReportService, KrPayslipPdfService,
    YearendAdjustmentService,
    LeaveRequestService,
  ],
  exports: [
    EmployeeService, SystemParamService, PayrollService,
    TimesheetService, OtRecordService, LeaveService,
    SeveranceService, EntityService, EntityGuard,
    EmployeeKrService, FreelancerService,
    InsuranceParamsKrService, TaxTableService,
    KrInsuranceCalcService, KrTaxCalcService, KrPayrollCalcService,
    BusinessIncomeService,
  ],
})
export class HrModule {}
