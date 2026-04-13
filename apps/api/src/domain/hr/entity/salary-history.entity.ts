import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';

@Entity('amb_hr_salary_history')
export class SalaryHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'slh_id' })
  slhId: string;

  @Column({ name: 'emp_id' })
  empId: string;

  @Column({ name: 'slh_base_salary_vnd', type: 'decimal', precision: 15, scale: 0, default: 0 })
  slhBaseSalaryVnd: number;

  @Column({ name: 'slh_base_salary_krw', type: 'decimal', precision: 15, scale: 0, default: 0 })
  slhBaseSalaryKrw: number;

  @Column({ name: 'slh_base_salary_usd', type: 'decimal', precision: 15, scale: 2, default: 0 })
  slhBaseSalaryUsd: number;

  @Column({ name: 'slh_exchange_rate_krw', type: 'decimal', precision: 10, scale: 0, default: 1 })
  slhExchangeRateKrw: number;

  @Column({ name: 'slh_exchange_rate_usd', type: 'decimal', precision: 10, scale: 0, default: 1 })
  slhExchangeRateUsd: number;

  @Column({ name: 'slh_meal_allowance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  slhMealAllowance: number;

  @Column({ name: 'slh_cskh_allowance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  slhCskhAllowance: number;

  @Column({ name: 'slh_fuel_allowance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  slhFuelAllowance: number;

  @Column({ name: 'slh_parking_allowance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  slhParkingAllowance: number;

  @Column({ name: 'slh_other_allowance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  slhOtherAllowance: number;

  @Column({ name: 'slh_effective_date', type: 'date' })
  slhEffectiveDate: string;

  @CreateDateColumn({ name: 'slh_created_at' })
  slhCreatedAt: Date;

  @UpdateDateColumn({ name: 'slh_updated_at' })
  slhUpdatedAt: Date;

  @ManyToOne(() => EmployeeEntity, (emp) => emp.salaryHistory)
  @JoinColumn({ name: 'emp_id' })
  employee: EmployeeEntity;
}
