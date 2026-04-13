import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { IssueEntity } from './issue.entity';

@Entity('amb_issue_participants')
@Unique(['issId', 'usrId'])
export class IssueParticipantEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'isp_id' })
  ispId: string;

  @Column({ name: 'iss_id', type: 'uuid' })
  issId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'isp_role', type: 'varchar', length: 20, default: 'PARTICIPANT' })
  ispRole: string; // PARTICIPANT | FORMER_ASSIGNEE

  @CreateDateColumn({ name: 'isp_created_at' })
  ispCreatedAt: Date;

  @ManyToOne(() => IssueEntity)
  @JoinColumn({ name: 'iss_id' })
  issue: IssueEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
