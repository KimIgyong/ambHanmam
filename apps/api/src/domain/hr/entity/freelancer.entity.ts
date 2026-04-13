import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { HrEntityEntity } from './hr-entity.entity';

@Entity('amb_hr_freelancers')
@Unique(['entId', 'frlCode'])
export class FreelancerEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'frl_id' })
  frlId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'frl_code', length: 10 })
  frlCode: string;

  @Column({ name: 'frl_full_name', length: 100 })
  frlFullName: string;

  @Column({ name: 'frl_resident_no', length: 256, nullable: true })
  frlResidentNo: string;

  @Column({ name: 'frl_nationality', length: 5, nullable: true })
  frlNationality: string;

  @Column({ name: 'frl_address', type: 'text', nullable: true })
  frlAddress: string;

  @Column({ name: 'frl_phone', length: 20, nullable: true })
  frlPhone: string;

  @Column({ name: 'frl_contract_start', type: 'date', nullable: true })
  frlContractStart: string;

  @Column({ name: 'frl_contract_end', type: 'date', nullable: true })
  frlContractEnd: string;

  @Column({ name: 'frl_contract_amount', type: 'decimal', precision: 15, scale: 0, default: 0 })
  frlContractAmount: number;

  @Column({ name: 'frl_monthly_amount', type: 'decimal', precision: 15, scale: 0, default: 0 })
  frlMonthlyAmount: number;

  @Column({ name: 'frl_payment_type', length: 20, default: 'BUSINESS_INCOME' })
  frlPaymentType: string;

  @Column({ name: 'frl_tax_rate', type: 'decimal', precision: 4, scale: 2, default: 3.0 })
  frlTaxRate: number;

  @Column({ name: 'frl_status', length: 15, default: 'ACTIVE' })
  frlStatus: string;

  @CreateDateColumn({ name: 'frl_created_at' })
  frlCreatedAt: Date;

  @UpdateDateColumn({ name: 'frl_updated_at' })
  frlUpdatedAt: Date;

  @DeleteDateColumn({ name: 'frl_deleted_at' })
  frlDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
