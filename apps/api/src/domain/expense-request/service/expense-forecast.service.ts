import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseForecastReportEntity } from '../entity/expense-forecast-report.entity';
import { ExpenseForecastItemEntity } from '../entity/expense-forecast-item.entity';
import { ExpenseRequestEntity } from '../entity/expense-request.entity';
import { ExpenseExecutionEntity } from '../entity/expense-execution.entity';
import { CreateForecastReportDto, UpdateForecastReportDto } from '../dto/expense-report.dto';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExpenseForecastService {
  constructor(
    @InjectRepository(ExpenseForecastReportEntity)
    private readonly reportRepo: Repository<ExpenseForecastReportEntity>,
    @InjectRepository(ExpenseForecastItemEntity)
    private readonly itemRepo: Repository<ExpenseForecastItemEntity>,
    @InjectRepository(ExpenseRequestEntity)
    private readonly requestRepo: Repository<ExpenseRequestEntity>,
    @InjectRepository(ExpenseExecutionEntity)
    private readonly executionRepo: Repository<ExpenseExecutionEntity>,
  ) {}

  /** 저장된 예정 리포트 목록 조회 */
  async findAll(entityId: string) {
    return this.reportRepo.find({
      where: { entId: entityId },
      order: { efrYear: 'DESC', efrMonth: 'DESC' },
    });
  }

  /** 특정 연월 예정 리포트 조회 */
  async findByMonth(entityId: string, year: number, month: number) {
    return this.reportRepo.findOne({
      where: { entId: entityId, efrYear: year, efrMonth: month },
      relations: ['items'],
    });
  }

  /** 자동 미리보기 — 정기 지출 기반 자동 구성 */
  async getPreview(entityId: string, year: number, month: number) {
    // 정기 지출 전체 조회 (APPROVED 상태)
    const recurringRequests = await this.requestRepo.find({
      where: { entId: entityId, exrFrequency: 'RECURRING' as any, exrStatus: 'APPROVED' },
    });

    // forecast 대상 월의 첫날 / 마지막날
    const targetFirstDay = new Date(year, month - 1, 1);
    const targetLastDay = new Date(year, month, 0);

    // 기간(period) 기반 필터링
    const filtered = recurringRequests.filter((req) => {
      // 시작일 이후인지 확인
      if (req.exrStartDate) {
        const startDate = new Date(req.exrStartDate);
        if (startDate > targetLastDay) return false; // 아직 시작 안 함
      }

      // 종료일 이전인지 확인
      if (req.exrEndDate) {
        const endDate = new Date(req.exrEndDate);
        if (endDate < targetFirstDay) return false; // 이미 종료됨
      }

      // 기간별 해당 월 여부
      const period = req.exrPeriod ?? 'MONTHLY';
      if (period === 'MONTHLY') return true;

      // 시작 월 기준 간격 계산
      if (!req.exrStartDate) return true; // startDate 없으면 포함
      const startDate = new Date(req.exrStartDate);
      const startMonthNum = startDate.getFullYear() * 12 + startDate.getMonth();
      const targetMonthNum = year * 12 + (month - 1);
      const diff = targetMonthNum - startMonthNum;
      if (diff < 0) return false;

      if (period === 'QUARTERLY') return diff % 3 === 0;
      if (period === 'SEMI_ANNUAL') return diff % 6 === 0;
      if (period === 'ANNUAL') return diff % 12 === 0;

      return true;
    });

    // 전월 집행 금액 조회
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevEnd = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

    const prevExecutions = await this.executionRepo
      .createQueryBuilder('ex')
      .innerJoin('ex.request', 'req')
      .where('req.entId = :entityId', { entityId })
      .andWhere('ex.exdExecutedAt BETWEEN :start AND :end', { start: prevStart, end: prevEnd })
      .select(['ex.exrId', 'ex.exdAmount'])
      .getRawMany();

    const prevAmountMap = new Map<string, number>();
    for (const p of prevExecutions) {
      prevAmountMap.set(p.exrId, Number(p.exdAmount));
    }

    const items = filtered.map((req) => ({
      type: 'RECURRING' as const,
      category: (req.exrCategory ?? 'OTHER') as any,
      name: req.exrTitle,
      amount: Number(req.exrTotalAmount),
      quantity: 1,
      note: req.exrPaymentDay ? `지불일: ${req.exrPaymentDay}일` : (null as string | null),
      currency: req.exrCurrency,
      prevAmount: prevAmountMap.get(req.exrId) ?? null,
      period: req.exrPeriod ?? 'MONTHLY',
      exrId: req.exrId,
    }));

    return items;
  }

  toReportResponse(report: ExpenseForecastReportEntity) {
    return {
      id: report.efrId,
      year: report.efrYear,
      month: report.efrMonth,
      status: (report.efrStatus ?? 'DRAFT') as 'DRAFT' | 'SUBMITTED' | 'APPROVED',
      totalAmount: Number(report.efrTotalVnd ?? 0),
      memo: report.efrNote ?? null,
      createdById: report.efrCreatorId,
      createdByName: '',
      createdAt: report.efrCreatedAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: report.efrUpdatedAt?.toISOString?.() ?? new Date().toISOString(),
      items: (report.items ?? []).map((item) => ({
        type: item.efiType,
        category: (item.efiCategory ?? 'OTHER') as any,
        name: item.efiTitle,
        amount: Number(item.efiAmount),
        quantity: item.efiQuantity ?? 1,
        note: item.efiNote ?? null,
        currency: item.efiCurrency ?? 'VND',
        prevAmount: item.efiPrevAmount !== null ? Number(item.efiPrevAmount) : null,
      })),
    };
  }

  private async findOneOrFail(id: string, entityId: string) {
    const report = await this.reportRepo.findOne({
      where: { efrId: id, entId: entityId },
      relations: ['items'],
    });
    if (!report) throw new NotFoundException('예정 리포트를 찾을 수 없습니다.');
    return report;
  }

  async submit(id: string, entityId: string) {
    const report = await this.findOneOrFail(id, entityId);
    if (report.efrStatus !== 'DRAFT') {
      throw new ConflictException('DRAFT 상태의 리포트만 검토 요청할 수 있습니다.');
    }
    report.efrStatus = 'SUBMITTED';
    return this.reportRepo.save(report);
  }

  async approve(id: string, entityId: string) {
    const report = await this.findOneOrFail(id, entityId);
    if (report.efrStatus !== 'SUBMITTED') {
      throw new ConflictException('검토 요청된 리포트만 승인할 수 있습니다.');
    }
    report.efrStatus = 'APPROVED';
    return this.reportRepo.save(report);
  }

  async reject(id: string, entityId: string) {
    const report = await this.findOneOrFail(id, entityId);
    if (report.efrStatus !== 'SUBMITTED') {
      throw new ConflictException('검토 요청된 리포트만 반려할 수 있습니다.');
    }
    report.efrStatus = 'DRAFT';
    return this.reportRepo.save(report);
  }

  async create(dto: CreateForecastReportDto, user: UserPayload, entityId: string) {
    const existing = await this.reportRepo.findOne({
      where: { entId: entityId, efrYear: dto.year, efrMonth: dto.month },
    });
    if (existing) {
      throw new ConflictException(`${dto.year}년 ${dto.month}월 예정 리포트가 이미 존재합니다.`);
    }

    const totals = { vnd: 0, usd: 0, krw: 0 };
    for (const item of dto.items) {
      const cur = (item.currency || 'VND').toUpperCase();
      if (cur === 'VND') totals.vnd += Number(item.amount);
      else if (cur === 'USD') totals.usd += Number(item.amount);
      else if (cur === 'KRW') totals.krw += Number(item.amount);
    }

    const report = this.reportRepo.create({
      entId: entityId,
      efrYear: dto.year,
      efrMonth: dto.month,
      efrTitle: dto.title || null,
      efrNote: dto.note || null,
      efrCreatorId: user.userId,
      efrTotalVnd: totals.vnd,
      efrTotalUsd: totals.usd,
      efrTotalKrw: totals.krw,
    });
    const saved = await this.reportRepo.save(report);

    const items = dto.items.map((item, idx) =>
      this.itemRepo.create({
        efrId: saved.efrId,
        efiType: item.type as any,
        exrId: item.exr_id || null,
        efiTitle: (item as any).name ?? item.title,
        efiCategory: item.category || null,
        efiPrevAmount: item.prev_amount ?? null,
        efiAmount: item.amount,
        efiCurrency: item.currency || 'VND',
        efiNote: item.note || null,
        efiSortOrder: item.sort_order ?? idx,
        efiQuantity: (item as any).quantity ?? 1,
      }),
    );
    await this.itemRepo.save(items);

    return this.reportRepo.findOne({ where: { efrId: saved.efrId }, relations: ['items'] });
  }

  async update(id: string, dto: UpdateForecastReportDto, entityId: string) {
    const report = await this.reportRepo.findOne({
      where: { efrId: id, entId: entityId },
      relations: ['items'],
    });
    if (!report) throw new NotFoundException('예정 리포트를 찾을 수 없습니다.');
    if (report.efrStatus === 'APPROVED') {
      throw new ConflictException('승인된 리포트는 수정할 수 없습니다.');
    }

    if (dto.title !== undefined) report.efrTitle = dto.title || null;
    if (dto.note !== undefined) report.efrNote = dto.note || null;

    if (dto.items) {
      await this.itemRepo.delete({ efrId: id });
      const totals = { vnd: 0, usd: 0, krw: 0 };
      const items = dto.items.map((item, idx) => {
        const cur = (item.currency || 'VND').toUpperCase();
        if (cur === 'VND') totals.vnd += Number(item.amount);
        else if (cur === 'USD') totals.usd += Number(item.amount);
        else if (cur === 'KRW') totals.krw += Number(item.amount);
        return this.itemRepo.create({
          efrId: id,
          efiType: item.type as any,
          exrId: item.exr_id || null,
          efiTitle: (item as any).name ?? item.title,
          efiCategory: item.category || null,
          efiPrevAmount: item.prev_amount ?? null,
          efiAmount: item.amount,
          efiCurrency: item.currency || 'VND',
          efiNote: item.note || null,
          efiSortOrder: item.sort_order ?? idx,
          efiQuantity: (item as any).quantity ?? 1,
        });
      });
      await this.itemRepo.save(items);
      report.efrTotalVnd = totals.vnd;
      report.efrTotalUsd = totals.usd;
      report.efrTotalKrw = totals.krw;
    }

    return this.reportRepo.save(report);
  }

  async exportToExcel(id: string, entityId: string): Promise<ExcelJS.Buffer> {
    const report = await this.reportRepo.findOne({
      where: { efrId: id, entId: entityId },
      relations: ['items'],
    });
    if (!report) throw new NotFoundException('예정 리포트를 찾을 수 없습니다.');

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`${report.efrYear}년 ${report.efrMonth}월 예정`);

    ws.mergeCells('A1', 'G1');
    ws.getCell('A1').value = `${report.efrYear}년 ${report.efrMonth}월 지출 예정 리포트`;
    ws.getCell('A1').font = { bold: true, size: 14 };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    const headerRow = ws.addRow(['유형', '제목', '카테고리', '전월집행', '예상금액', '통화', '메모']);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };

    report.items.forEach((item) => {
      ws.addRow([
        item.efiType,
        item.efiTitle,
        item.efiCategory || '',
        item.efiPrevAmount ?? '',
        Number(item.efiAmount),
        item.efiCurrency,
        item.efiNote || '',
      ]);
    });

    ws.getColumn(4).numFmt = '#,##0.00';
    ws.getColumn(5).numFmt = '#,##0.00';
    ws.columns = [
      { width: 10 }, { width: 30 }, { width: 15 },
      { width: 15 }, { width: 15 }, { width: 8 }, { width: 25 },
    ];

    return wb.xlsx.writeBuffer();
  }
}
