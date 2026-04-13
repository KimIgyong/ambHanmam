import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('amb_partners')
export class PartnerOrganizationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ptn_id' })
  ptnId: string;

  @Column({ name: 'ptn_code', length: 20, unique: true })
  ptnCode: string;

  @Column({ name: 'ptn_company_name', length: 200 })
  ptnCompanyName: string;

  @Column({ name: 'ptn_company_name_local', type: 'varchar', length: 200, nullable: true })
  ptnCompanyNameLocal: string | null;

  @Column({ name: 'ptn_country', type: 'varchar', length: 256, nullable: true })
  ptnCountry: string | null;

  @Column({ name: 'ptn_contact_name', type: 'varchar', length: 100, nullable: true })
  ptnContactName: string | null;

  @Column({ name: 'ptn_contact_email', type: 'varchar', length: 200, nullable: true })
  ptnContactEmail: string | null;

  @Column({ name: 'ptn_contact_phone', type: 'varchar', length: 30, nullable: true })
  ptnContactPhone: string | null;

  @Column({ name: 'ptn_address', type: 'text', nullable: true })
  ptnAddress: string | null;

  @Column({ name: 'ptn_tax_id', type: 'varchar', length: 50, nullable: true })
  ptnTaxId: string | null;

  @Column({ name: 'ptn_status', length: 20, default: 'ACTIVE' })
  ptnStatus: string;

  @Column({ name: 'ptn_note', type: 'text', nullable: true })
  ptnNote: string | null;

  @CreateDateColumn({ name: 'ptn_created_at' })
  ptnCreatedAt: Date;

  @UpdateDateColumn({ name: 'ptn_updated_at' })
  ptnUpdatedAt: Date;

  @DeleteDateColumn({ name: 'ptn_deleted_at' })
  ptnDeletedAt: Date;
}
