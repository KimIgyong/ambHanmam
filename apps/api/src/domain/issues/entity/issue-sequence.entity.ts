import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('amb_issue_sequences')
export class IssueSequenceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'isq_id' })
  isqId: string;

  @Column({ name: 'ent_id', type: 'uuid', unique: true })
  entId: string;

  @Column({ name: 'isq_last_number', type: 'integer', default: 0 })
  isqLastNumber: number;

  @UpdateDateColumn({ name: 'isq_updated_at' })
  isqUpdatedAt: Date;
}
