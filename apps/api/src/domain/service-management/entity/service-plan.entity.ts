import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { SvcServiceEntity } from './service.entity';

@Entity('amb_svc_plans')
@Unique(['svcId', 'splCode'])
export class SvcPlanEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'spl_id' })
  splId: string;

  @Column({ name: 'svc_id', type: 'uuid' })
  svcId: string;

  @Column({ name: 'spl_code', length: 30 })
  splCode: string;

  @Column({ name: 'spl_name', length: 200 })
  splName: string;

  @Column({ name: 'spl_description', type: 'text', nullable: true })
  splDescription: string;

  @Column({ name: 'spl_billing_cycle', length: 20, default: 'MONTHLY' })
  splBillingCycle: string;

  @Column({ name: 'spl_price', type: 'decimal', precision: 15, scale: 2, default: 0 })
  splPrice: number;

  @Column({ name: 'spl_currency', length: 3, default: 'USD' })
  splCurrency: string;

  @Column({ name: 'spl_max_users', type: 'int', nullable: true })
  splMaxUsers: number;

  @Column({ name: 'spl_features_json', type: 'text', nullable: true })
  splFeaturesJson: string;

  @Column({ name: 'spl_is_active', type: 'boolean', default: true })
  splIsActive: boolean;

  @Column({ name: 'spl_sort_order', type: 'int', default: 0 })
  splSortOrder: number;

  @Column({ name: 'spl_stripe_price_monthly_id', length: 50, nullable: true })
  splStripePriceMonthlyId: string;

  @Column({ name: 'spl_stripe_price_annual_id', length: 50, nullable: true })
  splStripePriceAnnualId: string;

  @Column({ name: 'spl_trial_days', type: 'int', default: 14 })
  splTrialDays: number;

  @Column({ name: 'spl_overage_unit_price', type: 'decimal', precision: 10, scale: 4, nullable: true })
  splOverageUnitPrice: number;

  @Column({ name: 'spl_overage_metric', length: 30, nullable: true })
  splOverageMetric: string;

  @CreateDateColumn({ name: 'spl_created_at' })
  splCreatedAt: Date;

  @UpdateDateColumn({ name: 'spl_updated_at' })
  splUpdatedAt: Date;

  @ManyToOne(() => SvcServiceEntity)
  @JoinColumn({ name: 'svc_id' })
  service: SvcServiceEntity;
}
