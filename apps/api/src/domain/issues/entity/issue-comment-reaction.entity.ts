import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique,
} from 'typeorm';

@Entity('amb_issue_comment_reactions')
@Unique(['iscId', 'usrId', 'icrType'])
export class IssueCommentReactionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'icr_id' })
  icrId: string;

  @Column({ name: 'isc_id', type: 'uuid' })
  iscId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'icr_type', type: 'varchar', length: 20 })
  icrType: string;

  @CreateDateColumn({ name: 'icr_created_at' })
  icrCreatedAt: Date;
}
