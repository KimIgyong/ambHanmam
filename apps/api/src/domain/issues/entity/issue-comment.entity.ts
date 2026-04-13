import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { IssueEntity } from './issue.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_issue_comments')
export class IssueCommentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'isc_id' })
  iscId: string;

  @Column({ name: 'iss_id' })
  issId: string;

  @Column({ name: 'isc_author_id' })
  iscAuthorId: string;

  @Column({ name: 'isc_author_type', length: 10, default: 'USER' })
  iscAuthorType: string;

  @Column({ name: 'isc_content', type: 'text' })
  iscContent: string;

  @Column({ name: 'isc_issue_status', type: 'varchar', length: 20, nullable: true })
  iscIssueStatus: string | null;

  @Column({ name: 'isc_parent_id', type: 'uuid', nullable: true })
  iscParentId: string | null;

  @Column({ name: 'isc_client_visible', type: 'boolean', default: false })
  iscClientVisible: boolean;

  @CreateDateColumn({ name: 'isc_created_at' })
  iscCreatedAt: Date;

  @ManyToOne(() => IssueEntity, (i) => i.comments)
  @JoinColumn({ name: 'iss_id' })
  issue: IssueEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'isc_author_id' })
  author: UserEntity;

  @ManyToOne(() => IssueCommentEntity, (c) => c.replies, { nullable: true })
  @JoinColumn({ name: 'isc_parent_id' })
  parent: IssueCommentEntity;

  @OneToMany(() => IssueCommentEntity, (c) => c.parent)
  replies: IssueCommentEntity[];
}
