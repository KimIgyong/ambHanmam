import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseRequestEntity } from '../entity/expense-request.entity';
import { ExpenseExecutionEntity } from '../entity/expense-execution.entity';
import { CreateExpenseExecutionDto, UpdateExpenseExecutionDto } from '../dto/expense-execution.dto';
import { UserPayload } from '../../../global/decorator/current-user.decorator';

@Injectable()
export class ExpenseExecutionService {
  constructor(
    @InjectRepository(ExpenseRequestEntity)
    private readonly requestRepo: Repository<ExpenseRequestEntity>,
    @InjectRepository(ExpenseExecutionEntity)
    private readonly executionRepo: Repository<ExpenseExecutionEntity>,
  ) {}

  async create(
    requestId: string,
    dto: CreateExpenseExecutionDto,
    user: UserPayload,
    entityId: string,
  ): Promise<ExpenseExecutionEntity> {
    const request = await this.requestRepo.findOne({
      where: { exrId: requestId, entId: entityId },
    });
    if (!request) throw new NotFoundException('지출결의서를 찾을 수 없습니다.');
    if (request.exrStatus !== 'APPROVED') {
      throw new BadRequestException('승인 완료(APPROVED) 상태에서만 집행 정보를 입력할 수 있습니다.');
    }

    // 기존 집행 정보 있으면 삭제 후 재생성 (1:1 관계)
    await this.executionRepo.delete({ exrId: requestId });

    const execution = this.executionRepo.create({
      exrId: requestId,
      exdExecutedAt: dto.executed_at,
      exdMethod: dto.method as any,
      exdMethodNote: dto.method_note || null,
      exdAmount: dto.amount,
      exdCurrency: dto.currency || request.exrCurrency,
      exdReceiptType: (dto.receipt_type as any) || 'NONE',
      exdReceiptNumber: dto.receipt_number || null,
      exdReceiptLinkUrl: dto.receipt_link_url || null,
      exdNote: dto.note || null,
      exdExecutorId: user.userId,
    });

    const saved = await this.executionRepo.save(execution);

    // 결의서 상태 EXECUTED로 전이
    await this.requestRepo.update(requestId, { exrStatus: 'EXECUTED' });

    return saved;
  }

  async update(
    requestId: string,
    dto: UpdateExpenseExecutionDto,
    user: UserPayload,
    entityId: string,
  ): Promise<ExpenseExecutionEntity> {
    const request = await this.requestRepo.findOne({
      where: { exrId: requestId, entId: entityId },
    });
    if (!request) throw new NotFoundException('지출결의서를 찾을 수 없습니다.');
    if (request.exrStatus !== 'EXECUTED') {
      throw new BadRequestException('집행 완료(EXECUTED) 상태에서만 수정 가능합니다.');
    }

    const execution = await this.executionRepo.findOne({ where: { exrId: requestId } });
    if (!execution) throw new NotFoundException('집행 정보를 찾을 수 없습니다.');

    if (dto.executed_at !== undefined) execution.exdExecutedAt = dto.executed_at;
    if (dto.method !== undefined) execution.exdMethod = dto.method as any;
    if (dto.method_note !== undefined) execution.exdMethodNote = dto.method_note || null;
    if (dto.amount !== undefined) execution.exdAmount = dto.amount;
    if (dto.receipt_type !== undefined) execution.exdReceiptType = dto.receipt_type as any;
    if (dto.receipt_number !== undefined) execution.exdReceiptNumber = dto.receipt_number || null;
    if (dto.receipt_link_url !== undefined) execution.exdReceiptLinkUrl = dto.receipt_link_url || null;
    if (dto.note !== undefined) execution.exdNote = dto.note || null;

    return this.executionRepo.save(execution);
  }

  async uploadReceiptFile(
    requestId: string,
    file: Express.Multer.File,
    user: UserPayload,
    entityId: string,
  ): Promise<ExpenseExecutionEntity> {
    const execution = await this.executionRepo.findOne({ where: { exrId: requestId } });
    if (!execution) throw new NotFoundException('집행 정보를 먼저 입력해주세요.');

    // 파일 저장 (FileModule 연동 필요, 현재는 로컬 저장 경로 사용)
    const storageKey = `expense-executions/${requestId}/${Date.now()}_${file.originalname}`;
    execution.exdReceiptFileName = file.originalname;
    execution.exdReceiptFileSize = file.size;
    execution.exdReceiptMimeType = file.mimetype;
    execution.exdReceiptStorageKey = storageKey;

    return this.executionRepo.save(execution);
  }
}
