import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_entity_custom_apps')
@Unique(['entId', 'ecaCode'])
export class EntityCustomAppEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'eca_id' })
  ecaId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  /** 앱 고유 코드 (법인 내 unique, URL slug로 사용) */
  @Column({ name: 'eca_code', type: 'varchar', length: 50 })
  ecaCode: string;

  /** 앱 표시명 */
  @Column({ name: 'eca_name', type: 'varchar', length: 200 })
  ecaName: string;

  /** 앱 설명 */
  @Column({ name: 'eca_description', type: 'text', nullable: true })
  ecaDescription: string | null;

  /** 사이드바 아이콘 (Lucide 아이콘명) */
  @Column({ name: 'eca_icon', type: 'varchar', length: 100, default: 'AppWindow' })
  ecaIcon: string;

  /** 외부 앱 URL */
  @Column({ name: 'eca_url', type: 'varchar', length: 500 })
  ecaUrl: string;

  /** 인증 방식: jwt | none | api_key */
  @Column({ name: 'eca_auth_mode', type: 'varchar', length: 20, default: 'jwt' })
  ecaAuthMode: string;

  /** 오픈 방식: iframe | new_tab */
  @Column({ name: 'eca_open_mode', type: 'varchar', length: 10, default: 'iframe' })
  ecaOpenMode: string;

  /** API Key (AES-256-GCM 암호화 저장, api_key 인증 방식일 때 사용) */
  @Column({ name: 'eca_api_key_enc', type: 'text', nullable: true })
  ecaApiKeyEnc: string | null;

  /** 접근 허용 역할 목록 (null이면 전체 허용) */
  @Column({ name: 'eca_allowed_roles', type: 'simple-array', nullable: true })
  ecaAllowedRoles: string[] | null;

  /** 사이드바 정렬 순서 */
  @Column({ name: 'eca_sort_order', type: 'int', default: 0 })
  ecaSortOrder: number;

  /** 활성 여부 */
  @Column({ name: 'eca_is_active', type: 'boolean', default: true })
  ecaIsActive: boolean;

  /** 등록한 관리자 ID */
  @Column({ name: 'eca_registered_by', type: 'uuid', nullable: true })
  ecaRegisteredBy: string | null;

  @CreateDateColumn({ name: 'eca_created_at' })
  ecaCreatedAt: Date;

  @UpdateDateColumn({ name: 'eca_updated_at' })
  ecaUpdatedAt: Date;

  /** 원본 파트너 앱 ID (앱스토어에서 가져온 경우) */
  @Column({ name: 'eca_source_pap_id', type: 'uuid', nullable: true })
  ecaSourcePapId: string | null;

  /** Soft delete */
  @Column({ name: 'eca_deleted_at', type: 'timestamp', nullable: true })
  ecaDeletedAt: Date | null;

  @ManyToOne(() => HrEntityEntity, { nullable: false })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
