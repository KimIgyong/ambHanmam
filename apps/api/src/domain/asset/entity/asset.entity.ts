import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_assets')
@Index(['entId', 'astCategory'])
@Index(['entId', 'astStatus'])
export class AssetEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ast_id' })
  astId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'ast_code', type: 'varchar', length: 50, unique: true })
  astCode: string;

  @Column({ name: 'ast_name', type: 'varchar', length: 200 })
  astName: string;

  @Column({ name: 'ast_category', type: 'varchar', length: 30 })
  astCategory: string;

  @Column({ name: 'ast_ownership_type', type: 'varchar', length: 20 })
  astOwnershipType: string;

  @Column({ name: 'ast_unit', type: 'varchar', length: 50, nullable: true })
  astUnit: string | null;

  @Column({ name: 'ast_manager_id', type: 'uuid', nullable: true })
  astManagerId: string | null;

  @Column({ name: 'ast_location', type: 'varchar', length: 200, nullable: true })
  astLocation: string | null;

  @Column({ name: 'ast_status', type: 'varchar', length: 30, default: 'STORED' })
  astStatus: string;

  @Column({ name: 'ast_manufacturer', type: 'varchar', length: 100, nullable: true })
  astManufacturer: string | null;

  @Column({ name: 'ast_model_name', type: 'varchar', length: 100, nullable: true })
  astModelName: string | null;

  @Column({ name: 'ast_serial_no', type: 'varchar', length: 100, nullable: true })
  astSerialNo: string | null;

  @Column({ name: 'ast_purchase_date', type: 'date', nullable: true })
  astPurchaseDate: Date | null;

  @Column({ name: 'ast_vendor', type: 'varchar', length: 150, nullable: true })
  astVendor: string | null;

  @Column({ name: 'ast_currency', type: 'varchar', length: 3, default: 'USD' })
  astCurrency: string;

  @Column({ name: 'ast_purchase_amount', type: 'numeric', precision: 15, scale: 2, nullable: true })
  astPurchaseAmount: string | null;

  @Column({ name: 'ast_depreciation_years', type: 'int', nullable: true })
  astDepreciationYears: number | null;

  @Column({ name: 'ast_residual_value', type: 'numeric', precision: 15, scale: 2, nullable: true })
  astResidualValue: string | null;

  @Column({ name: 'ast_quantity', type: 'int', nullable: true, default: 1 })
  astQuantity: number | null;

  @Column({ name: 'ast_barcode', type: 'varchar', length: 100, nullable: true })
  astBarcode: string | null;

  @Column({ name: 'ast_rfid_code', type: 'varchar', length: 100, nullable: true })
  astRfidCode: string | null;

  @Column({ name: 'ast_room_capacity', type: 'int', nullable: true })
  astRoomCapacity: number | null;

  @Column({ name: 'ast_room_equipments', type: 'jsonb', nullable: true })
  astRoomEquipments: string[] | null;

  @Column({ name: 'ast_room_available_from', type: 'varchar', length: 5, nullable: true })
  astRoomAvailableFrom: string | null;

  @Column({ name: 'ast_room_available_to', type: 'varchar', length: 5, nullable: true })
  astRoomAvailableTo: string | null;

  @CreateDateColumn({ name: 'ast_created_at' })
  astCreatedAt: Date;

  @UpdateDateColumn({ name: 'ast_updated_at' })
  astUpdatedAt: Date;

  @DeleteDateColumn({ name: 'ast_deleted_at' })
  astDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'ast_manager_id' })
  manager: UserEntity | null;
}
