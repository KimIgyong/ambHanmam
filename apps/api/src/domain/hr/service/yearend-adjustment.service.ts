import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { YearendAdjustmentEntity } from '../entity/yearend-adjustment.entity';
import { PayrollEntryKrEntity } from '../entity/payroll-entry-kr.entity';
import { PayrollPeriodEntity } from '../entity/payroll-period.entity';
import { EmployeeEntity } from '../entity/employee.entity';
import { CreateYearendAdjustmentRequest } from '../dto/request/create-yearend-adjustment.request';
import { UpdateYearendAdjustmentRequest } from '../dto/request/update-yearend-adjustment.request';
import { YearendAdjustmentMapper } from '../mapper/yearend-adjustment.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class YearendAdjustmentService {
  constructor(
    @InjectRepository(YearendAdjustmentEntity)
    private readonly yeaRepo: Repository<YearendAdjustmentEntity>,
    @InjectRepository(PayrollEntryKrEntity)
    private readonly krEntryRepo: Repository<PayrollEntryKrEntity>,
    @InjectRepository(PayrollPeriodEntity)
    private readonly periodRepo: Repository<PayrollPeriodEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepo: Repository<EmployeeEntity>,
  ) {}

  async getList(entityId: string, taxYear: number) {
    const items = await this.yeaRepo.find({
      where: { entId: entityId, yeaTaxYear: taxYear },
      relations: ['employee'],
      order: { employee: { empCode: 'ASC' } },
    });
    return items.map(YearendAdjustmentMapper.toResponse);
  }

  async getById(id: string) {
    const item = await this.yeaRepo.findOne({
      where: { yeaId: id },
      relations: ['employee'],
    });
    if (!item) {
      throw new NotFoundException(ERROR_CODE.HR_YEAREND_NOT_FOUND.message);
    }
    return YearendAdjustmentMapper.toResponse(item);
  }

  async create(entityId: string, dto: CreateYearendAdjustmentRequest) {
    const employee = await this.employeeRepo.findOne({
      where: { empId: dto.employee_id, entId: entityId },
    });
    if (!employee) {
      throw new NotFoundException(ERROR_CODE.HR_EMPLOYEE_NOT_FOUND.message);
    }

    const existing = await this.yeaRepo.findOne({
      where: { entId: entityId, empId: dto.employee_id, yeaTaxYear: dto.tax_year },
    });
    if (existing) {
      throw new BadRequestException('Year-end adjustment already exists for this employee and tax year.');
    }

    const entity = this.yeaRepo.create({
      entId: entityId,
      empId: dto.employee_id,
      yeaTaxYear: dto.tax_year,
      yeaSettleTax: dto.settle_tax,
      yeaSettleLocal: dto.settle_local,
      yeaNote: dto.note || null,
      yeaStatus: 'PENDING',
    });

    const saved = await this.yeaRepo.save(entity);
    return this.getById(saved.yeaId);
  }

  async update(id: string, dto: UpdateYearendAdjustmentRequest) {
    const item = await this.yeaRepo.findOne({ where: { yeaId: id } });
    if (!item) {
      throw new NotFoundException(ERROR_CODE.HR_YEAREND_NOT_FOUND.message);
    }
    if (item.yeaStatus === 'APPLIED') {
      throw new BadRequestException('Cannot modify an applied year-end adjustment.');
    }

    if (dto.settle_tax !== undefined) item.yeaSettleTax = dto.settle_tax;
    if (dto.settle_local !== undefined) item.yeaSettleLocal = dto.settle_local;
    if (dto.note !== undefined) item.yeaNote = dto.note || null;

    await this.yeaRepo.save(item);
    return this.getById(id);
  }

  async delete(id: string) {
    const item = await this.yeaRepo.findOne({ where: { yeaId: id } });
    if (!item) {
      throw new NotFoundException(ERROR_CODE.HR_YEAREND_NOT_FOUND.message);
    }
    if (item.yeaStatus === 'APPLIED') {
      throw new BadRequestException('Cannot delete an applied year-end adjustment.');
    }
    await this.yeaRepo.remove(item);
  }

  /**
   * 연말정산 급여 반영 — 선택한 급여기간의 KR 엔트리에 yearendTax/yearendLocal 반영
   */
  async applyToPayroll(entityId: string, adjustmentId: string, periodId: string) {
    const item = await this.yeaRepo.findOne({ where: { yeaId: adjustmentId } });
    if (!item) {
      throw new NotFoundException(ERROR_CODE.HR_YEAREND_NOT_FOUND.message);
    }
    if (item.yeaStatus === 'APPLIED') {
      throw new BadRequestException('Already applied.');
    }

    const period = await this.periodRepo.findOne({ where: { pypId: periodId } });
    if (!period) {
      throw new NotFoundException(ERROR_CODE.HR_PAYROLL_NOT_FOUND.message);
    }

    const krEntry = await this.krEntryRepo.findOne({
      where: { pypId: periodId, empId: item.empId },
    });
    if (!krEntry) {
      throw new NotFoundException('KR payroll entry not found for this period and employee.');
    }

    // 연말정산 금액 반영
    krEntry.pkrYearendTax = Number(item.yeaSettleTax);
    krEntry.pkrYearendLocal = Number(item.yeaSettleLocal);

    // 공제합계 재계산
    const insuranceTotal = Number(krEntry.pkrPension) + Number(krEntry.pkrHealthIns) +
      Number(krEntry.pkrLongtermCare) + Number(krEntry.pkrEmployIns) +
      Number(krEntry.pkrPensionSettle) + Number(krEntry.pkrHealthSettle) +
      Number(krEntry.pkrLongtermSettle) + Number(krEntry.pkrEmploySettle);
    const taxTotal = Number(krEntry.pkrIncomeTax) + Number(krEntry.pkrLocalTax) +
      Number(krEntry.pkrYearendTax) + Number(krEntry.pkrYearendLocal);
    krEntry.pkrDeductionTotal = insuranceTotal + taxTotal + Number(krEntry.pkrPrepaid);
    krEntry.pkrNetPay = Number(krEntry.pkrGrossTotal) - krEntry.pkrDeductionTotal;

    await this.krEntryRepo.save(krEntry);

    // 반영 상태 업데이트
    const appliedMonth = `${period.pypYear}-${String(period.pypMonth).padStart(2, '0')}`;
    item.yeaAppliedMonth = appliedMonth;
    item.yeaStatus = 'APPLIED';
    await this.yeaRepo.save(item);

    return this.getById(adjustmentId);
  }

  /**
   * 연말정산 일괄 반영 — 해당 연도 PENDING 항목 전부 → 지정 급여기간에 반영
   */
  async applyBatchToPayroll(entityId: string, taxYear: number, periodId: string) {
    const pendingItems = await this.yeaRepo.find({
      where: { entId: entityId, yeaTaxYear: taxYear, yeaStatus: 'PENDING' },
    });

    let appliedCount = 0;
    for (const item of pendingItems) {
      try {
        await this.applyToPayroll(entityId, item.yeaId, periodId);
        appliedCount++;
      } catch {
        // Skip entries without matching KR payroll entry
      }
    }

    return { appliedCount, totalPending: pendingItems.length };
  }

  /**
   * Excel Import — 형식: 사원번호, 성명, 귀속연도, 정산소득세, 정산지방소득세, 비고
   */
  async importExcel(entityId: string, buffer: Buffer) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);
    const ws = wb.worksheets[0];
    if (!ws) {
      throw new BadRequestException('Empty workbook.');
    }

    const results: { row: number; code: string; status: string }[] = [];
    const rows: ExcelJS.Row[] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 1) rows.push(row);
    });

    for (const row of rows) {
      const empCode = String(row.getCell(1).value || '').trim();
      const taxYear = Number(row.getCell(3).value) || 0;
      const settleTax = Number(row.getCell(4).value) || 0;
      const settleLocal = Number(row.getCell(5).value) || 0;
      const note = String(row.getCell(6).value || '').trim() || null;

      if (!empCode || !taxYear) {
        results.push({ row: row.number, code: empCode, status: 'SKIPPED' });
        continue;
      }

      const employee = await this.employeeRepo.findOne({
        where: { empCode, entId: entityId },
      });
      if (!employee) {
        results.push({ row: row.number, code: empCode, status: 'EMPLOYEE_NOT_FOUND' });
        continue;
      }

      // Upsert
      let existing = await this.yeaRepo.findOne({
        where: { entId: entityId, empId: employee.empId, yeaTaxYear: taxYear },
      });

      if (existing) {
        if (existing.yeaStatus === 'APPLIED') {
          results.push({ row: row.number, code: empCode, status: 'ALREADY_APPLIED' });
          continue;
        }
        existing.yeaSettleTax = settleTax;
        existing.yeaSettleLocal = settleLocal;
        if (note) existing.yeaNote = note;
        await this.yeaRepo.save(existing);
        results.push({ row: row.number, code: empCode, status: 'UPDATED' });
      } else {
        const entity = this.yeaRepo.create({
          entId: entityId,
          empId: employee.empId,
          yeaTaxYear: taxYear,
          yeaSettleTax: settleTax,
          yeaSettleLocal: settleLocal,
          yeaNote: note,
          yeaStatus: 'PENDING',
        });
        await this.yeaRepo.save(entity);
        results.push({ row: row.number, code: empCode, status: 'CREATED' });
      }
    }

    return results;
  }
}
