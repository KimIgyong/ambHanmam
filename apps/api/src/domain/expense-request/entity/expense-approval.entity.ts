import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { ExpenseRequestEntity } from './expense-request.entity';

export type ApprovalAction = 'APPROVED' | 'REJECTED';

@Entity('amb_expense_approvals')
@Index(['exrId'])
export class ExpenseApprovalEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'eap_id' })
  eapId: string;

  @Column({ name: 'exr_id' })
  exrId: string;

  @Column({ name: 'eap_approver_id' })
  eapApproverId: string;

  @Column({ name: 'eap_level', type: 'int' })
  eapLevel: number;

  @Column({ name: 'eap_action', length: 20 })
  eapAction: ApprovalAction;

  @Column({ name: 'eap_comment', type: 'text', nullable: true })
  eapComment: string | null;

  @Column({ name: 'eap_is_self_approval', default: false })
  eapIsSelfApproval: boolean;

  @CreateDateColumn({ name: 'eap_actioned_at' })
  eapActionedAt: Date;

  // Relations
  @ManyToOne(() => ExpenseRequestEntity, (req) => req.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exr_id' })
  request: ExpenseRequestEntity;
}
