import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { PayrollPeriodEntity } from '../entity/payroll-period.entity';
import { PayrollDetailEntity } from '../entity/payroll-detail.entity';
import { PayrollEntryKrEntity } from '../entity/payroll-entry-kr.entity';
import { EmployeeEntity } from '../entity/employee.entity';
import { EmployeeKrEntity } from '../entity/employee-kr.entity';
import { SalaryHistoryEntity } from '../entity/salary-history.entity';
import { DependentEntity } from '../entity/dependent.entity';
import { HrEntityEntity } from '../entity/hr-entity.entity';
import { CreatePayrollPeriodRequest } from '../dto/request/create-payroll-period.request';
import { PayrollMapper } from '../mapper/payroll.mapper';
import { PayrollKrMapper } from '../mapper/payroll-kr.mapper';
import { PayrollCalcService } from './payroll-calc.service';
import { KrPayrollCalcService } from './kr-payroll-calc.service';
import { InsuranceParamsKrService } from './insurance-params-kr.service';
import { SystemParamService } from './system-param.service';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { HrPayrollPeriodResponse, HrPayrollDetailResponse, HrPayrollEntryKrResponse } from '@amb/types';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    @InjectRepository(PayrollPeriodEntity)
    private readonly periodRepo: Repository<PayrollPeriodEntity>,
    @InjectRepository(PayrollDetailEntity)
    private readonly detailRepo: Repository<PayrollDetailEntity>,
    @InjectRepository(PayrollEntryKrEntity)
    private readonly krEntryRepo: Repository<PayrollEntryKrEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
    @InjectRepository(EmployeeKrEntity)
    private readonly employeeKrRepo: Repository<EmployeeKrEntity>,
    @InjectRepository(SalaryHistoryEntity)
    private readonly salaryRepo: Repository<SalaryHistoryEntity>,
    @InjectRepository(DependentEntity)
    private readonly dependentRepo: Repository<DependentEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    private readonly calcService: PayrollCalcService,
    private readonly krCalcService: KrPayrollCalcService,
    private readonly insuranceParamsService: InsuranceParamsKrService,
    private readonly paramService: SystemParamService,
  ) {}

  async getPeriods(entityId: string): Promise<HrPayrollPeriodResponse[]> {
    const entities = await this.periodRepo.find({
      where: { entId: entityId },
      relations: ['details'],
      order: { pypYear: 'DESC', pypMonth: 'DESC' },
    });
    return entities.map(PayrollMapper.toPeriodResponse);
  }

  async getPeriodById(periodId: string, entityId: string): Promise<HrPayrollPeriodResponse> {
    const entity = await this.periodRepo.findOne({
      where: { pypId: periodId, entId: entityId },
      relations: ['details'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }
    return PayrollMapper.toPeriodResponse(entity);
  }

  async createPeriod(entityId: string, dto: CreatePayrollPeriodRequest): Promise<HrPayrollPeriodResponse> {
    const existing = await this.periodRepo.findOne({
      where: { pypYear: dto.year, pypMonth: dto.month, entId: entityId },
    });
    if (existing) {
      throw new ConflictException(ERROR_CODE.HR_PAYROLL_PERIOD_EXISTS.message);
    }

    const entity = this.periodRepo.create({
      pypYear: dto.year,
      pypMonth: dto.month,
      pypPaymentDate: dto.payment_date || undefined,
      pypStatus: 'DRAFT',
      entId: entityId,
    } as DeepPartial<PayrollPeriodEntity>);
    const saved: PayrollPeriodEntity = await this.periodRepo.save(entity as PayrollPeriodEntity);
    saved.details = [];
    return PayrollMapper.toPeriodResponse(saved);
  }

  async calculatePayroll(periodId: string, entityId: string): Promise<HrPayrollPeriodResponse> {
    const period = await this.periodRepo.findOne({
      where: { pypId: periodId, entId: entityId },
      relations: ['details'],
    });
    if (!period) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }
    if (period.pypStatus === 'FINALIZED') {
      throw new BadRequestException(ERROR_CODE.HR_PAYROLL_ALREADY_FINAL.message);
    }

    // Determine entity country for routing
    let country = 'VN';
    const hrEntity = await this.entityRepo.findOne({ where: { entId: entityId } });
    if (hrEntity) {
      country = hrEntity.entCountry;
    }

    // Update status to CALCULATING
    period.pypStatus = 'CALCULATING';
    await this.periodRepo.save(period);

    try {
      if (country === 'KR') {
        await this.calculateKrPayroll(period);
      } else {
        await this.calculateVnPayroll(period);
      }

      // Update status
      period.pypStatus = 'CALCULATED';
      await this.periodRepo.save(period);

      const updated = await this.periodRepo.findOne({
        where: { pypId: periodId, entId: entityId },
        relations: ['details'],
      });
      return PayrollMapper.toPeriodResponse(updated!);
    } catch (error) {
      // Revert status on error
      period.pypStatus = 'DRAFT';
      await this.periodRepo.save(period);
      this.logger.error(`Payroll calculation error: ${error.message}`, error.stack);
      throw new BadRequestException(ERROR_CODE.HR_PAYROLL_CALC_ERROR.message);
    }
  }

  // ── KR 급여 계산 ──
  private async calculateKrPayroll(period: PayrollPeriodEntity): Promise<void> {
    const entityId = period.entId;
    const refDate = `${period.pypYear}-${String(period.pypMonth).padStart(2, '0')}-15`;

    // Get active employees for this entity
    const employees = await this.employeeRepo
      .createQueryBuilder('emp')
      .where('emp.entId = :entityId', { entityId })
      .andWhere('emp.empStatus != :resigned', { resigned: 'RESIGNED' })
      .getMany();

    // Get insurance params
    const insuranceParams = await this.insuranceParamsService.getCurrentParams(entityId, refDate);
    if (!insuranceParams) {
      throw new BadRequestException('KR insurance parameters not found for this period.');
    }

    // Delete existing KR entries for recalculation
    const existingKrEntries = await this.krEntryRepo.find({ where: { pypId: period.pypId } });
    if (existingKrEntries.length > 0) {
      await this.krEntryRepo.remove(existingKrEntries);
    }

    const entries: PayrollEntryKrEntity[] = [];

    for (const emp of employees) {
      // Get KR extension info
      const krInfo = await this.employeeKrRepo.findOne({ where: { empId: emp.empId } });
      if (!krInfo) {
        this.logger.warn(`No KR info for employee ${emp.empCode}, skipping.`);
        continue;
      }

      // Get latest salary
      const salary = await this.salaryRepo
        .createQueryBuilder('s')
        .where('s.empId = :empId', { empId: emp.empId })
        .andWhere('s.slhEffectiveDate <= :refDate', { refDate })
        .orderBy('s.slhEffectiveDate', 'DESC')
        .getOne();

      if (!salary) {
        this.logger.warn(`No salary found for employee ${emp.empCode}, skipping.`);
        continue;
      }

      const result = await this.krCalcService.processEmployee({
        employee: emp,
        krInfo,
        salary,
        insuranceParams,
        entityId,
        periodYear: period.pypYear,
        periodMonth: period.pypMonth,
      });

      const entry = this.krEntryRepo.create({
        pypId: period.pypId,
        empId: emp.empId,
        entId: entityId,
        pkrBasePay: result.basePay,
        pkrOtExtend: result.otExtend,
        pkrOtHoliday: result.otHoliday,
        pkrOtNight: result.otNight,
        pkrOtEtc: result.otEtc,
        pkrAnnualLeave: result.annualLeave,
        pkrBonus: result.bonus,
        pkrVehicleSub: result.vehicleSub,
        pkrMealAllow: result.mealAllow,
        pkrChildcare: result.childcare,
        pkrTaxableTotal: result.taxableTotal,
        pkrExemptTotal: result.exemptTotal,
        pkrGrossTotal: result.grossTotal,
        pkrPension: result.pension,
        pkrHealthIns: result.healthIns,
        pkrLongtermCare: result.longtermCare,
        pkrEmployIns: result.employIns,
        pkrPensionSettle: result.pensionSettle,
        pkrHealthSettle: result.healthSettle,
        pkrLongtermSettle: result.longtermSettle,
        pkrEmploySettle: result.employSettle,
        pkrIncomeTax: result.incomeTax,
        pkrLocalTax: result.localTax,
        pkrYearendTax: result.yearendTax,
        pkrYearendLocal: result.yearendLocal,
        pkrPrepaid: result.prepaid,
        pkrDeductionTotal: result.deductionTotal,
        pkrNetPay: result.netPay,
      });

      entries.push(entry);
    }

    await this.krEntryRepo.save(entries);
  }

  // ── VN 급여 계산 (기존 로직) ──
  private async calculateVnPayroll(period: PayrollPeriodEntity): Promise<void> {
    const refDate = `${period.pypYear}-${String(period.pypMonth).padStart(2, '0')}-15`;

    // Get all active employees scoped to entity
    const employees = await this.employeeRepo.createQueryBuilder('emp')
      .where('emp.empStatus != :resigned', { resigned: 'RESIGNED' })
      .andWhere('emp.entId = :entityId', { entityId: period.entId })
      .getMany();

    // Get params for this period
    const params = await this.paramService.getParamMap(refDate);

    // Get holidays to determine standard working days
    const holidayDates = await this.paramService.getHolidayDatesForMonth(period.pypYear, period.pypMonth);
    const standardWorkingDays = this.calculateStandardWorkingDays(period.pypYear, period.pypMonth, holidayDates);

    // Delete existing details for recalculation
    if (period.details?.length > 0) {
      await this.detailRepo.remove(period.details);
    }

    const details: PayrollDetailEntity[] = [];

    for (const emp of employees) {
      const salary = await this.salaryRepo
        .createQueryBuilder('s')
        .where('s.empId = :empId', { empId: emp.empId })
        .andWhere('s.slhEffectiveDate <= :refDate', { refDate })
        .orderBy('s.slhEffectiveDate', 'DESC')
        .getOne();

      if (!salary) {
        this.logger.warn(`No salary found for employee ${emp.empCode}, skipping.`);
        continue;
      }

      const dependents = await this.dependentRepo.find({
        where: { empId: emp.empId },
      });

      const actualWorkingDays = emp.empWorkSchedule === 'MON_SAT'
        ? this.calculateStandardWorkingDaysSat(period.pypYear, period.pypMonth, holidayDates)
        : standardWorkingDays;

      const result = this.calcService.processEmployee({
        employee: emp,
        salary,
        dependents,
        standardWorkingDays: emp.empWorkSchedule === 'MON_SAT'
          ? this.calculateStandardWorkingDaysSat(period.pypYear, period.pypMonth, holidayDates)
          : standardWorkingDays,
        actualWorkingDays,
        params,
        periodYear: period.pypYear,
        periodMonth: period.pypMonth,
      });

      const detail = this.detailRepo.create({
        pypId: period.pypId,
        empId: emp.empId,
        pydBaseSalary: result.baseSalary,
        pydActualSalary: result.actualSalary,
        pydMealAllowance: result.mealAllowance,
        pydCskhAllowance: result.cskhAllowance,
        pydFuelAllowance: result.fuelAllowance,
        pydOtherAllowance: result.otherAllowance,
        pydTotalIncome: result.totalIncome,
        pydInsuranceBaseSi: result.insuranceBaseSi,
        pydInsuranceBaseUi: result.insuranceBaseUi,
        pydCompanySiSickness: result.companySiSickness,
        pydCompanySiAccident: result.companySiAccident,
        pydCompanySiRetirement: result.companySiRetirement,
        pydCompanyHi: result.companyHi,
        pydCompanyUi: result.companyUi,
        pydCompanyUnion: result.companyUnion,
        pydTotalCompanyInsurance: result.totalCompanyInsurance,
        pydEmployeeSi: result.employeeSi,
        pydEmployeeHi: result.employeeHi,
        pydEmployeeUi: result.employeeUi,
        pydTotalEmployeeInsurance: result.totalEmployeeInsurance,
        pydSelfDeduction: result.selfDeduction,
        pydDependentDeduction: result.dependentDeduction,
        pydNumDependents: result.numDependents,
        pydTaxExemptIncome: result.taxExemptIncome,
        pydTaxableIncome: result.taxableIncome,
        pydPitAmount: result.pitAmount,
        pydStandardWorkingDays: result.standardWorkingDays,
        pydActualWorkingDays: result.actualWorkingDays,
        pydNetSalaryVnd: result.netSalaryVnd,
      });

      details.push(detail);
    }

    await this.detailRepo.save(details);
  }

  async submitForApproval(periodId: string, entityId: string): Promise<HrPayrollPeriodResponse> {
    return this.updatePeriodStatus(periodId, entityId, ['CALCULATED'], 'PENDING_APPROVAL');
  }

  async approveL1(periodId: string, entityId: string, userId: string): Promise<HrPayrollPeriodResponse> {
    const period = await this.getPeriodEntity(periodId, entityId);
    if (period.pypStatus !== 'PENDING_APPROVAL') {
      throw new BadRequestException(ERROR_CODE.HR_PAYROLL_INVALID_STATUS.message);
    }
    period.pypStatus = 'APPROVED_L1';
    period.pypApprovedByL1 = userId;
    const saved = await this.periodRepo.save(period);
    saved.details = period.details;
    return PayrollMapper.toPeriodResponse(saved);
  }

  async approveL2(periodId: string, entityId: string, userId: string): Promise<HrPayrollPeriodResponse> {
    const period = await this.getPeriodEntity(periodId, entityId);
    if (period.pypStatus !== 'APPROVED_L1') {
      throw new BadRequestException(ERROR_CODE.HR_PAYROLL_INVALID_STATUS.message);
    }
    period.pypStatus = 'FINALIZED';
    period.pypApprovedByL2 = userId;
    period.pypFinalizedAt = new Date();
    const saved = await this.periodRepo.save(period);
    saved.details = period.details;
    return PayrollMapper.toPeriodResponse(saved);
  }

  async rejectPayroll(periodId: string, entityId: string): Promise<HrPayrollPeriodResponse> {
    return this.updatePeriodStatus(periodId, entityId, ['PENDING_APPROVAL', 'APPROVED_L1'], 'CALCULATED');
  }

  async getPayrollDetails(periodId: string, entityId: string): Promise<HrPayrollDetailResponse[]> {
    await this.getPeriodEntity(periodId, entityId);
    const details = await this.detailRepo.find({
      where: { pypId: periodId },
      relations: ['employee'],
      order: { employee: { empCode: 'ASC' } },
    });
    return details.map(PayrollMapper.toDetailResponse);
  }

  async getPayrollDetailByEmployee(periodId: string, empId: string, entityId: string): Promise<HrPayrollDetailResponse> {
    await this.getPeriodEntity(periodId, entityId);
    const detail = await this.detailRepo.findOne({
      where: { pypId: periodId, empId },
      relations: ['employee'],
    });
    if (!detail) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }
    return PayrollMapper.toDetailResponse(detail);
  }

  // ── KR Payroll Detail Queries ──

  async getKrPayrollDetails(periodId: string, entityId: string): Promise<HrPayrollEntryKrResponse[]> {
    await this.getPeriodEntity(periodId, entityId);
    const entries = await this.krEntryRepo.find({
      where: { pypId: periodId },
      relations: ['employee'],
      order: { employee: { empCode: 'ASC' } },
    });
    return entries.map(PayrollKrMapper.toResponse);
  }

  async getKrPayrollDetailByEmployee(periodId: string, empId: string, entityId: string): Promise<HrPayrollEntryKrResponse> {
    await this.getPeriodEntity(periodId, entityId);
    const entry = await this.krEntryRepo.findOne({
      where: { pypId: periodId, empId },
      relations: ['employee'],
    });
    if (!entry) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }
    return PayrollKrMapper.toResponse(entry);
  }

  // --- Helper methods ---

  private async getPeriodEntity(periodId: string, entityId: string): Promise<PayrollPeriodEntity> {
    const entity = await this.periodRepo.findOne({
      where: { pypId: periodId, entId: entityId },
      relations: ['details'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }
    return entity;
  }

  private async updatePeriodStatus(
    periodId: string, entityId: string, allowedStatuses: string[], newStatus: string,
  ): Promise<HrPayrollPeriodResponse> {
    const period = await this.getPeriodEntity(periodId, entityId);
    if (!allowedStatuses.includes(period.pypStatus)) {
      throw new BadRequestException(ERROR_CODE.HR_PAYROLL_INVALID_STATUS.message);
    }
    period.pypStatus = newStatus;
    const saved = await this.periodRepo.save(period);
    saved.details = period.details;
    return PayrollMapper.toPeriodResponse(saved);
  }

  private calculateStandardWorkingDays(year: number, month: number, holidayDates: string[]): number {
    let count = 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (holidayDates.includes(dateStr)) continue;
      count++;
    }
    return count;
  }

  private calculateStandardWorkingDaysSat(year: number, month: number, holidayDates: string[]): number {
    let count = 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0) continue; // Skip Sunday only
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      if (holidayDates.includes(dateStr)) continue;
      count++;
    }
    return count;
  }
}
