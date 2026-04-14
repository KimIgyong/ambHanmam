import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';

@Entity('amb_hr_entities')
export class HrEntityEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ent_id' })
  entId: string;

  @Column({ name: 'ent_code', length: 10, unique: true })
  entCode: string;

  @Column({ name: 'ent_name', length: 200 })
  entName: string;

  @Column({ name: 'ent_name_en', length: 200, nullable: true })
  entNameEn: string;

  @Column({ name: 'ent_country', length: 5 })
  entCountry: string;

  @Column({ name: 'ent_currency', length: 5 })
  entCurrency: string;

  @Column({ name: 'ent_reg_no', length: 50, nullable: true })
  entRegNo: string;

  @Column({ name: 'ent_address', type: 'text', nullable: true })
  entAddress: string;

  @Column({ name: 'ent_representative', length: 100, nullable: true })
  entRepresentative: string;

  @Column({ name: 'ent_phone', length: 20, nullable: true })
  entPhone: string;

  @Column({ name: 'ent_email', length: 100, nullable: true })
  entEmail: string;

  @Column({ name: 'ent_pay_day', type: 'int', default: 25 })
  entPayDay: number;

  /** 급여 산정 기간 유형: MONTHLY_FULL | CUSTOM */
  @Column({ name: 'ent_pay_period_type', type: 'varchar', length: 30, default: 'MONTHLY_FULL' })
  entPayPeriodType: string;

  /** 커스텀 산정 기간 시작일 */
  @Column({ name: 'ent_pay_period_start', type: 'smallint', default: 1 })
  entPayPeriodStart: number;

  /** 커스텀 산정 기간 종료일 */
  @Column({ name: 'ent_pay_period_end', type: 'smallint', default: 31 })
  entPayPeriodEnd: number;

  /** 1일 기준 근무시간 */
  @Column({ name: 'ent_work_hours_per_day', type: 'smallint', default: 8 })
  entWorkHoursPerDay: number;

  /** 주 근무일 수 */
  @Column({ name: 'ent_work_days_per_week', type: 'smallint', default: 5 })
  entWorkDaysPerWeek: number;

  /** 연간 기본 연차 일수 */
  @Column({ name: 'ent_leave_base_days', type: 'smallint', default: 15 })
  entLeaveBaseDays: number;

  @Column({ name: 'ent_status', length: 10, default: 'ACTIVE' })
  entStatus: string;

  @Column({ name: 'ent_stamp_image', type: 'bytea', nullable: true })
  entStampImage: Buffer;

  // ── 조직 계층 구조 ──

  /** 조직 레벨: ROOT (HQ) | SUBSIDIARY (하위 법인) */
  @Column({ name: 'ent_level', length: 20, default: 'SUBSIDIARY' })
  entLevel: string;

  /** 상위 조직 ID (ROOT이면 null) */
  @Column({ name: 'ent_parent_id', type: 'uuid', nullable: true })
  entParentId: string | null;

  @ManyToOne(() => HrEntityEntity, (entity) => entity.children, { nullable: true })
  @JoinColumn({ name: 'ent_parent_id' })
  parent: HrEntityEntity;

  @OneToMany(() => HrEntityEntity, (entity) => entity.parent)
  children: HrEntityEntity[];

  /** HQ 조직 여부 (바로가기) */
  @Column({ name: 'ent_is_hq', type: 'boolean', default: false })
  entIsHq: boolean;

  /** 정렬 순서 */
  @Column({ name: 'ent_sort_order', type: 'int', default: 0 })
  entSortOrder: number;

  /** 대표이사 사용자 ID (hanmam tbl_comp.CEO_USER_NO → UUID 매핑) */
  @Column({ name: 'ent_ceo_user_id', type: 'uuid', nullable: true })
  entCeoUserId: string | null;

  /** 인건비 귀속 프로젝트 ID (hanmam tbl_comp.LABOR_PRJ_NO → UUID 매핑) */
  @Column({ name: 'ent_labor_prj_id', type: 'uuid', nullable: true })
  entLaborPrjId: string | null;

  // ── 초대 이메일 브랜딩 ──

  /** 초대 이메일 표시 법인명 (미설정 시 entNameEn → entName 순 사용) */
  @Column({ name: 'ent_email_display_name', type: 'varchar', length: 200, nullable: true })
  entEmailDisplayName: string | null;

  /** 초대 이메일 브랜드 색상 (hex #RRGGBB) */
  @Column({ name: 'ent_email_brand_color', type: 'varchar', length: 10, nullable: true })
  entEmailBrandColor: string | null;

  /** 초대 이메일 로고 이미지 URL */
  @Column({ name: 'ent_email_logo_url', type: 'varchar', length: 500, nullable: true })
  entEmailLogoUrl: string | null;

  @CreateDateColumn({ name: 'ent_created_at' })
  entCreatedAt: Date;

  @UpdateDateColumn({ name: 'ent_updated_at' })
  entUpdatedAt: Date;
}
