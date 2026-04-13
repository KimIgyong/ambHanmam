import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_issue_ratings')
@Unique(['issId', 'usrId'])
@Check('"isr_rating" >= 1 AND "isr_rating" <= 5')
export class IssueRatingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'isr_id' })
  isrId: string;

  @Column({ name: 'iss_id', type: 'uuid' })
  issId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'isr_rating', type: 'smallint' })
  isrRating: number;

  @CreateDateColumn({ name: 'isr_created_at' })
  isrCreatedAt: Date;

  @UpdateDateColumn({ name: 'isr_updated_at' })
  isrUpdatedAt: Date;

  @ManyToOne(() => IssueEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'iss_id' })
  issue: IssueEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
