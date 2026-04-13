import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_bil_documents')
export class BillingDocumentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'doc_id' })
  docId: string;

  @Column({ name: 'ent_id' })
  entId: string;

  @Column({ name: 'doc_ref_type', length: 20 })
  docRefType: string; // CONTRACT | SOW | INVOICE

  @Column({ name: 'doc_ref_id', type: 'uuid' })
  docRefId: string;

  @Column({ name: 'doc_type', length: 30 })
  docType: string; // SIGNED_CONTRACT | APPENDIX | SOW | ACCEPTANCE_MINUTES | INVOICE | PAYMENT_REQUEST | OTHER

  @Column({ name: 'doc_gdrive_file_id', length: 100, nullable: true })
  docGdriveFileId: string;

  @Column({ name: 'doc_gdrive_url', length: 500, nullable: true })
  docGdriveUrl: string;

  @Column({ name: 'doc_filename', length: 300 })
  docFilename: string;

  @Column({ name: 'doc_mime_type', length: 50, nullable: true })
  docMimeType: string;

  @Column({ name: 'doc_file_size', type: 'bigint', nullable: true })
  docFileSize: number;

  @Column({ name: 'doc_uploaded_by', type: 'uuid', nullable: true })
  docUploadedBy: string;

  @CreateDateColumn({ name: 'doc_created_at' })
  docCreatedAt: Date;

  @DeleteDateColumn({ name: 'doc_deleted_at' })
  docDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
