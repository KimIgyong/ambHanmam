import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('amb_email_templates')
export class EmailTemplateEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'emt_id' })
  emtId: string;

  /** null = 전역(ADMIN용), not null = 법인별(MASTER용) */
  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  /** 'ACCOUNT_CREATED' | 'INVITATION' */
  @Column({ name: 'emt_code', length: 50 })
  emtCode: string;

  @Column({ name: 'emt_subject', length: 500 })
  emtSubject: string;

  @Column({ name: 'emt_body', type: 'text' })
  emtBody: string;

  @UpdateDateColumn({ name: 'emt_updated_at' })
  emtUpdatedAt: Date;

  @Column({ name: 'emt_updated_by', type: 'uuid', nullable: true })
  emtUpdatedBy: string | null;
}
