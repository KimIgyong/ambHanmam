import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { BusinessIncomeEntity } from '../entity/business-income.entity';
import { FreelancerEntity } from '../entity/freelancer.entity';
import { CreateBusinessIncomeRequest } from '../dto/request/create-business-income.request';
import { UpdateBusinessIncomeRequest } from '../dto/request/update-business-income.request';
import { BusinessIncomeMapper } from '../mapper/business-income.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { HrBusinessIncomeResponse } from '@amb/types';

/**
 * 사업소득 계산:
 * totalAmount = grossAmount + weeklyHoliday + incentive
 * taxable = totalAmount - prepaid
 * incomeTax = FLOOR(taxable × taxRate / 100)
 * localTax  = FLOOR(incomeTax × 10 / 100)
 * deductionTotal = incomeTax + localTax + employIns + accidentIns + studentLoan
 * netAmount = totalAmount - prepaid - deductionTotal
 */

@Injectable()
export class BusinessIncomeService {
  constructor(
    @InjectRepository(BusinessIncomeEntity)
    private readonly bipRepo: Repository<BusinessIncomeEntity>,
    @InjectRepository(FreelancerEntity)
    private readonly freelancerRepo: Repository<FreelancerEntity>,
  ) {}

  async getPayments(entityId: string, yearMonth?: string): Promise<HrBusinessIncomeResponse[]> {
    const where: Record<string, unknown> = { entId: entityId };
    if (yearMonth) where.bipYearMonth = yearMonth;

    const entities = await this.bipRepo.find({
      where,
      relations: ['freelancer'],
      order: { bipYearMonth: 'DESC', bipCreatedAt: 'DESC' },
    });
    return entities.map(BusinessIncomeMapper.toResponse);
  }

  async getPaymentById(id: string, entityId: string): Promise<HrBusinessIncomeResponse> {
    const entity = await this.bipRepo.findOne({
      where: { bipId: id, entId: entityId },
      relations: ['freelancer'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_BUSINESS_INCOME_NOT_FOUND.message);
    }
    return BusinessIncomeMapper.toResponse(entity);
  }

  async createPayment(entityId: string, dto: CreateBusinessIncomeRequest): Promise<HrBusinessIncomeResponse> {
    // Verify freelancer exists
    const freelancer = await this.freelancerRepo.findOne({
      where: { frlId: dto.freelancer_id, entId: entityId },
    });
    if (!freelancer) {
      throw new NotFoundException(ERROR_CODE.HR_FREELANCER_NOT_FOUND.message);
    }

    const taxRate = Number(freelancer.frlTaxRate);
    const calc = this.calculateTax(
      dto.gross_amount,
      dto.weekly_holiday || 0,
      dto.incentive || 0,
      dto.prepaid || 0,
      taxRate,
      dto.employ_ins || 0,
      dto.accident_ins || 0,
      dto.student_loan || 0,
    );

    const entity = this.bipRepo.create({
      entId: entityId,
      frlId: dto.freelancer_id,
      bipYearMonth: dto.year_month,
      bipPaymentDate: dto.payment_date || undefined,
      bipGrossAmount: dto.gross_amount,
      bipWeeklyHoliday: dto.weekly_holiday || 0,
      bipIncentive: dto.incentive || 0,
      bipTotalAmount: calc.totalAmount,
      bipPrepaid: dto.prepaid || 0,
      bipIncomeTax: calc.incomeTax,
      bipLocalTax: calc.localTax,
      bipEmployIns: dto.employ_ins || 0,
      bipAccidentIns: dto.accident_ins || 0,
      bipStudentLoan: dto.student_loan || 0,
      bipDeductionTotal: calc.deductionTotal,
      bipNetAmount: calc.netAmount,
      bipStatus: 'DRAFT',
    } as DeepPartial<BusinessIncomeEntity>);

    const saved: BusinessIncomeEntity = await this.bipRepo.save(entity as BusinessIncomeEntity);
    return this.getPaymentById(saved.bipId, entityId);
  }

  async updatePayment(id: string, entityId: string, dto: UpdateBusinessIncomeRequest): Promise<HrBusinessIncomeResponse> {
    const entity = await this.bipRepo.findOne({
      where: { bipId: id, entId: entityId },
      relations: ['freelancer'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_BUSINESS_INCOME_NOT_FOUND.message);
    }
    if (entity.bipStatus === 'FINALIZED' && dto.status !== 'DRAFT') {
      throw new BadRequestException('Cannot modify a finalized payment.');
    }

    if (dto.payment_date !== undefined) entity.bipPaymentDate = dto.payment_date;
    if (dto.gross_amount !== undefined) entity.bipGrossAmount = dto.gross_amount;
    if (dto.weekly_holiday !== undefined) entity.bipWeeklyHoliday = dto.weekly_holiday;
    if (dto.incentive !== undefined) entity.bipIncentive = dto.incentive;
    if (dto.prepaid !== undefined) entity.bipPrepaid = dto.prepaid;
    if (dto.employ_ins !== undefined) entity.bipEmployIns = dto.employ_ins;
    if (dto.accident_ins !== undefined) entity.bipAccidentIns = dto.accident_ins;
    if (dto.student_loan !== undefined) entity.bipStudentLoan = dto.student_loan;
    if (dto.status !== undefined) entity.bipStatus = dto.status;

    // Recalculate
    const taxRate = Number(entity.freelancer?.frlTaxRate || 3);
    const calc = this.calculateTax(
      Number(entity.bipGrossAmount),
      Number(entity.bipWeeklyHoliday),
      Number(entity.bipIncentive),
      Number(entity.bipPrepaid),
      taxRate,
      Number(entity.bipEmployIns),
      Number(entity.bipAccidentIns),
      Number(entity.bipStudentLoan),
    );

    entity.bipTotalAmount = calc.totalAmount;
    entity.bipIncomeTax = calc.incomeTax;
    entity.bipLocalTax = calc.localTax;
    entity.bipDeductionTotal = calc.deductionTotal;
    entity.bipNetAmount = calc.netAmount;

    await this.bipRepo.save(entity);
    return this.getPaymentById(id, entityId);
  }

  async deletePayment(id: string, entityId: string): Promise<void> {
    const entity = await this.bipRepo.findOne({
      where: { bipId: id, entId: entityId },
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.HR_BUSINESS_INCOME_NOT_FOUND.message);
    }
    if (entity.bipStatus === 'FINALIZED') {
      throw new BadRequestException('Cannot delete a finalized payment.');
    }
    await this.bipRepo.remove(entity);
  }

  private calculateTax(
    grossAmount: number,
    weeklyHoliday: number,
    incentive: number,
    prepaid: number,
    taxRate: number,
    employIns: number,
    accidentIns: number,
    studentLoan: number,
  ) {
    const totalAmount = grossAmount + weeklyHoliday + incentive;
    const taxable = totalAmount - prepaid;
    const incomeTax = Math.floor(taxable * taxRate / 100);
    const localTax = Math.floor(incomeTax * 10 / 100);
    const deductionTotal = incomeTax + localTax + employIns + accidentIns + studentLoan;
    const netAmount = totalAmount - prepaid - deductionTotal;

    return { totalAmount, incomeTax, localTax, deductionTotal, netAmount };
  }
}
