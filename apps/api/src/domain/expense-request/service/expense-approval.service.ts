import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseRequestEntity } from '../entity/expense-request.entity';
import { ExpenseApprovalEntity } from '../entity/expense-approval.entity';
import { RejectExpenseRequestDto, ApproveExpenseRequestDto } from '../dto/query-expense-request.dto';
import { ExpenseNumberService } from './expense-number.service';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { MailService } from '../../../infrastructure/external/mail/mail.service';

const ROLE_LEVEL: Record<string, number> = {
  VIEWER: 1, MEMBER: 2, MANAGER: 3, MASTER: 4, ADMIN: 5, SUPER_ADMIN: 6,
};

@Injectable()
export class ExpenseApprovalService {
  constructor(
    @InjectRepository(ExpenseRequestEntity)
    private readonly requestRepo: Repository<ExpenseRequestEntity>,
    @InjectRepository(ExpenseApprovalEntity)
    private readonly approvalRepo: Repository<ExpenseApprovalEntity>,
    private readonly numberService: ExpenseNumberService,
    private readonly mailService: MailService,
  ) {}

  async submit(id: string, user: UserPayload, entityId: string): Promise<ExpenseRequestEntity> {
    const entity = await this.findAndCheck(id, entityId);

    if (!['DRAFT', 'REJECTED'].includes(entity.exrStatus)) {
      throw new BadRequestException('DRAFT 또는 REJECTED 상태에서만 제출 가능합니다.');
    }
    if (entity.exrRequesterId !== user.userId) {
      throw new ForbiddenException('본인이 작성한 결의서만 제출할 수 있습니다.');
    }

    // 결의서 번호 부여 (최초 제출 시)
    if (!entity.exrNumber) {
      entity.exrNumber = await this.numberService.generateNumber(entityId, entity.exrExpenseDate);
    }

    // 승인자 없거나 자가 승인 조건 (MASTER+ 자신이 단독 승인인 경우)
    const isSelfApprover1 = entity.exrApprover1Id === user.userId;
    const isMasterPlus = ROLE_LEVEL[user.role] >= 4;

    if (!entity.exrApprover1Id || (isSelfApprover1 && isMasterPlus)) {
      // 자가 승인: MASTER+ 권한이면 단계 건너뜀
      if (!entity.exrApprover2Id || entity.exrApprover2Id === user.userId) {
        entity.exrStatus = 'APPROVED';
        await this.saveApprovalRecord(entity, user, 1, 'APPROVED', true);
        await this.requestRepo.save(entity);
        return entity;
      }
      entity.exrStatus = 'APPROVED_L1';
      await this.saveApprovalRecord(entity, user, 1, 'APPROVED', isSelfApprover1);
    } else {
      entity.exrStatus = 'PENDING';
    }

    await this.requestRepo.save(entity);
    await this.sendApprovalNotification(entity, 1);
    return entity;
  }

  async approve(id: string, dto: ApproveExpenseRequestDto, user: UserPayload, entityId: string): Promise<ExpenseRequestEntity> {
    const entity = await this.findAndCheck(id, entityId);
    const userLevel = ROLE_LEVEL[user.role] || 1;

    if (entity.exrStatus === 'PENDING') {
      // 1차 승인
      this.checkApprover(entity.exrApprover1Id, user, entity);
      entity.exrStatus = 'APPROVED_L1';
      const isSelf = entity.exrApprover1Id === user.userId;
      await this.saveApprovalRecord(entity, user, 1, 'APPROVED', isSelf, dto.comment);

      // 2차 승인자가 없거나 본인이면 최종 승인
      if (!entity.exrApprover2Id) {
        entity.exrStatus = 'APPROVED';
      } else if (entity.exrApprover2Id === user.userId && ROLE_LEVEL[user.role] >= 4) {
        // 자가 2차 승인 (MASTER+)
        entity.exrStatus = 'APPROVED';
        await this.saveApprovalRecord(entity, user, 2, 'APPROVED', true, dto.comment);
      }
    } else if (entity.exrStatus === 'APPROVED_L1') {
      // 2차 승인
      this.checkApprover(entity.exrApprover2Id, user, entity);
      entity.exrStatus = 'APPROVED';
      const isSelf = entity.exrApprover2Id === user.userId;
      await this.saveApprovalRecord(entity, user, 2, 'APPROVED', isSelf, dto.comment);
    } else {
      throw new BadRequestException('승인 대기 상태가 아닙니다.');
    }

    await this.requestRepo.save(entity);
    return entity;
  }

  async reject(id: string, dto: RejectExpenseRequestDto, user: UserPayload, entityId: string): Promise<ExpenseRequestEntity> {
    const entity = await this.findAndCheck(id, entityId);

    if (!['PENDING', 'APPROVED_L1'].includes(entity.exrStatus)) {
      throw new BadRequestException('승인 대기 상태가 아닙니다.');
    }

    const level = entity.exrStatus === 'PENDING' ? 1 : 2;
    const approverId = level === 1 ? entity.exrApprover1Id : entity.exrApprover2Id;
    this.checkApprover(approverId, user, entity);

    entity.exrStatus = 'REJECTED';
    await this.saveApprovalRecord(entity, user, level, 'REJECTED', false, dto.comment);
    await this.requestRepo.save(entity);
    await this.sendRejectionNotification(entity, dto.comment);
    return entity;
  }

  private checkApprover(approverId: string | null, user: UserPayload, entity: ExpenseRequestEntity) {
    const userLevel = ROLE_LEVEL[user.role] || 1;
    // 지정된 승인자가 없으면 MASTER+ 이상이 승인 가능
    if (!approverId) {
      if (userLevel < 4) throw new ForbiddenException('이 결의서를 승인할 권한이 없습니다.');
      return;
    }
    if (approverId !== user.userId) {
      // ADMIN, SUPER_ADMIN은 대리 승인 가능
      if (userLevel < 5) throw new ForbiddenException('이 결의서의 지정된 승인자가 아닙니다.');
    }
  }

  private async saveApprovalRecord(
    entity: ExpenseRequestEntity,
    user: UserPayload,
    level: number,
    action: 'APPROVED' | 'REJECTED',
    isSelf: boolean,
    comment?: string,
  ) {
    const approval = this.approvalRepo.create({
      exrId: entity.exrId,
      eapApproverId: user.userId,
      eapLevel: level,
      eapAction: action,
      eapComment: comment || null,
      eapIsSelfApproval: isSelf,
    });
    await this.approvalRepo.save(approval);
  }

  private async findAndCheck(id: string, entityId: string): Promise<ExpenseRequestEntity> {
    const entity = await this.requestRepo.findOne({ where: { exrId: id, entId: entityId } });
    if (!entity) throw new NotFoundException(`지출결의서를 찾을 수 없습니다. (${id})`);
    return entity;
  }

  private async sendApprovalNotification(entity: ExpenseRequestEntity, level: number) {
    const approverId = level === 1 ? entity.exrApprover1Id : entity.exrApprover2Id;
    if (!approverId) return;
    try {
      // 실제 이메일 발송은 사용자 이메일 조회 필요하나 여기서는 로깅만 처리
      // TODO: 사용자 이메일 조회 후 mailService.sendRawEmail 호출
    } catch {
      // 이메일 실패는 무시 (graceful fail)
    }
  }

  private async sendRejectionNotification(entity: ExpenseRequestEntity, reason: string) {
    try {
      // TODO: 작성자에게 반려 알림 발송
    } catch {
      // graceful fail
    }
  }
}
