import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { SvcClientEntity } from './client.entity';

@Entity('amb_svc_client_contacts')
export class SvcClientContactEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ctc_id' })
  ctcId: string;

  @Column({ name: 'cli_id', type: 'uuid' })
  cliId: string;

  @Column({ name: 'ctc_name', length: 100 })
  ctcName: string;

  @Column({ name: 'ctc_email', length: 200, nullable: true })
  ctcEmail: string;

  @Column({ name: 'ctc_phone', length: 30, nullable: true })
  ctcPhone: string;

  @Column({ name: 'ctc_position', length: 100, nullable: true })
  ctcPosition: string;

  @Column({ name: 'ctc_department', length: 100, nullable: true })
  ctcDepartment: string;

  @Column({ name: 'ctc_is_primary', type: 'boolean', default: false })
  ctcIsPrimary: boolean;

  @Column({ name: 'ctc_note', type: 'text', nullable: true })
  ctcNote: string;

  @CreateDateColumn({ name: 'ctc_created_at' })
  ctcCreatedAt: Date;

  @UpdateDateColumn({ name: 'ctc_updated_at' })
  ctcUpdatedAt: Date;

  @DeleteDateColumn({ name: 'ctc_deleted_at' })
  ctcDeletedAt: Date;

  @ManyToOne(() => SvcClientEntity)
  @JoinColumn({ name: 'cli_id' })
  client: SvcClientEntity;
}
