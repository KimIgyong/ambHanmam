import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { IssueEntity } from './issue.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_issue_status_logs')
export class IssueStatusLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'isl_id' })
  islId: string;

  @Column({ name: 'iss_id' })
  issId: string;

  @Column({ name: 'isl_change_type', type: 'varchar', length: 20, default: 'STATUS' })
  islChangeType: string;

  @Column({ name: 'isl_from_status', type: 'varchar', length: 100 })
  islFromStatus: string;

  @Column({ name: 'isl_to_status', type: 'varchar', length: 100 })
  islToStatus: string;

  @Column({ name: 'isl_changed_by' })
  islChangedBy: string;

  @Column({ name: 'isl_note', type: 'text', nullable: true })
  islNote: string | null;

  @Column({ name: 'isl_created_at', type: 'timestamp', default: () => 'NOW()' })
  islCreatedAt: Date;

  @ManyToOne(() => IssueEntity)
  @JoinColumn({ name: 'iss_id' })
  issue: IssueEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'isl_changed_by' })
  changedByUser: UserEntity;
}
