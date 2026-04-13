import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('amb_smtp_settings')
export class SmtpSettingsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'sms_id' })
  smsId: string;

  @Column({ name: 'sms_host', length: 200 })
  smsHost: string;

  @Column({ name: 'sms_port', type: 'int' })
  smsPort: number;

  @Column({ name: 'sms_user', length: 200 })
  smsUser: string;

  @Column({ name: 'sms_pass_encrypted', type: 'text' })
  smsPassEncrypted: string;

  @Column({ name: 'sms_pass_iv', length: 64 })
  smsPassIv: string;

  @Column({ name: 'sms_pass_tag', length: 64 })
  smsPassTag: string;

  @Column({ name: 'sms_from', length: 200 })
  smsFrom: string;

  @Column({ name: 'sms_secure', default: false })
  smsSecure: boolean;

  @UpdateDateColumn({ name: 'sms_updated_at' })
  smsUpdatedAt: Date;

  @Column({ name: 'sms_updated_by', type: 'uuid', nullable: true })
  smsUpdatedBy: string;
}
