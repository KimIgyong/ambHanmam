import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HrEntityEntity } from '../entity/hr-entity.entity';
import { EntityUserRoleEntity } from '../entity/entity-user-role.entity';
import * as bcrypt from 'bcrypt';

/**
 * Multi-Entity Seed Service
 * - HQ (ROOT) + VN01 + KR01 (SUBSIDIARY) 계층 구조 자동 생성
 * - 기존 테이블의 entity_id가 null인 레코드에 VN01 할당
 * - SEED_ADMIN 환경변수 기반 초기 관리자 생성
 */
@Injectable()
export class EntitySeedService implements OnModuleInit {
  private readonly logger = new Logger(EntitySeedService.name);

  constructor(
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly roleRepo: Repository<EntityUserRoleEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.seedEntities();
    await this.migrateNullEntityData();
    await this.seedInitialAdmin();
    await this.ensureHoldingUnits();
  }

  private async seedEntities() {
    // ── 1. HQ (최상위 조직) ──
    let hq = await this.entityRepo.findOne({ where: { entCode: 'HQ' } });
    if (!hq) {
      hq = await this.entityRepo.save(this.entityRepo.create({
        entCode: 'HQ',
        entName: 'Amoeba HQ',
        entNameEn: 'Amoeba HQ',
        entCountry: 'GL',
        entCurrency: 'USD',
        entRepresentative: 'Kim Igyong',
        entLevel: 'ROOT',
        entParentId: null,
        entIsHq: true,
        entSortOrder: 0,
      }));
      this.logger.log(`Created HQ entity (${hq.entId})`);
    } else {
      // 기존 HQ가 있으면 계층 정보 업데이트
      if (hq.entLevel !== 'ROOT' || !hq.entIsHq) {
        hq.entLevel = 'ROOT';
        hq.entIsHq = true;
        hq.entParentId = null;
        hq.entSortOrder = 0;
        await this.entityRepo.save(hq);
        this.logger.log('Updated HQ entity hierarchy fields');
      }
    }

    // ── 2. VN 법인 ──
    let vnEntity = await this.entityRepo.findOne({ where: { entCode: 'VN01' } });
    if (!vnEntity) {
      vnEntity = await this.entityRepo.save(this.entityRepo.create({
        entCode: 'VN01',
        entName: 'AMOEBA CO., LTD',
        entNameEn: 'AMOEBA CO., LTD',
        entCountry: 'VN',
        entCurrency: 'VND',
        entRepresentative: 'Kim Igyong',
        entPayDay: 25,
        entLevel: 'SUBSIDIARY',
        entParentId: hq.entId,
        entIsHq: false,
        entSortOrder: 1,
      }));
      this.logger.log(`Created VN01 entity (${vnEntity.entId})`);
    } else {
      // 기존 법인에 계층 정보 업데이트
      if (!vnEntity.entParentId || vnEntity.entLevel !== 'SUBSIDIARY') {
        vnEntity.entLevel = 'SUBSIDIARY';
        vnEntity.entParentId = hq.entId;
        vnEntity.entIsHq = false;
        vnEntity.entSortOrder = 1;
        await this.entityRepo.save(vnEntity);
        this.logger.log('Updated VN01 entity hierarchy fields');
      }
    }

    // ── 3. KR 법인 ──
    let krEntity = await this.entityRepo.findOne({ where: { entCode: 'KR01' } });
    if (!krEntity) {
      krEntity = await this.entityRepo.save(this.entityRepo.create({
        entCode: 'KR01',
        entName: '아메바컴퍼니주식회사',
        entNameEn: 'Amoeba Company Inc.',
        entCountry: 'KR',
        entCurrency: 'KRW',
        entRepresentative: '김익용',
        entPayDay: 15,
        entLevel: 'SUBSIDIARY',
        entParentId: hq.entId,
        entIsHq: false,
        entSortOrder: 2,
      }));
      this.logger.log(`Created KR01 entity (${krEntity.entId})`);
    } else {
      if (!krEntity.entParentId || krEntity.entLevel !== 'SUBSIDIARY') {
        krEntity.entLevel = 'SUBSIDIARY';
        krEntity.entParentId = hq.entId;
        krEntity.entIsHq = false;
        krEntity.entSortOrder = 2;
        await this.entityRepo.save(krEntity);
        this.logger.log('Updated KR01 entity hierarchy fields');
      }
    }

    // Assign existing data to VN01
    await this.assignExistingDataToEntity(vnEntity.entId);

    // Assign admin user to both entities
    await this.assignAdminRoles(vnEntity.entId, krEntity.entId);
  }

  private async assignExistingDataToEntity(vnEntityId: string) {
    const tables = [
      { table: 'amb_hr_employees', column: 'ent_id' },
      { table: 'amb_hr_payroll_periods', column: 'ent_id' },
      { table: 'amb_hr_system_params', column: 'ent_id' },
      { table: 'amb_hr_holidays', column: 'ent_id' },
    ];

    for (const { table, column } of tables) {
      try {
        const result = await this.dataSource.query(
          `UPDATE ${table} SET ${column} = $1 WHERE ${column} IS NULL`,
          [vnEntityId],
        );
        const affected = result?.[1] ?? 0;
        if (affected > 0) {
          this.logger.log(`Assigned ${affected} rows in ${table} to VN01`);
        }
      } catch (e) {
        // Column may not exist yet on first run; ignore
        this.logger.warn(`Could not update ${table}: ${e.message}`);
      }
    }
  }

  /**
   * 기존 데이터(ent_id = NULL)를 기본 법인(VN01)으로 마이그레이션
   * 서버 시작 시 매번 실행되며, NULL인 레코드가 없으면 즉시 종료
   */
  private async migrateNullEntityData() {
    // 기본 법인(VN01) 조회
    const defaultEntity = await this.entityRepo.findOne({
      where: { entCode: 'VN01' },
    });
    if (!defaultEntity) {
      this.logger.warn('Default entity VN01 not found, skipping NULL data migration');
      return;
    }

    const tables = [
      { table: 'amb_notices', column: 'ent_id' },
      { table: 'amb_todos', column: 'ent_id' },
      { table: 'amb_meeting_notes', column: 'ent_id' },
      { table: 'amb_attendances', column: 'ent_id' },
      { table: 'amb_conversations', column: 'ent_id' },
      { table: 'amb_bank_accounts', column: 'ent_id' },
      { table: 'amb_groups', column: 'ent_id' },
      { table: 'amb_work_items', column: 'ent_id' },
    ];

    let totalAffected = 0;
    for (const { table, column } of tables) {
      try {
        const result = await this.dataSource.query(
          `UPDATE ${table} SET ${column} = $1 WHERE ${column} IS NULL`,
          [defaultEntity.entId],
        );
        const affected = result?.[1] ?? 0;
        if (affected > 0) {
          this.logger.log(`Migrated ${affected} rows in ${table} → VN01`);
          totalAffected += affected;
        }
      } catch (e) {
        this.logger.warn(`Could not migrate ${table}: ${e.message}`);
      }
    }

    if (totalAffected > 0) {
      this.logger.log(`NULL entity migration complete: ${totalAffected} total rows assigned to VN01 (${defaultEntity.entId})`);
    }
  }

  private async assignAdminRoles(vnEntityId: string, krEntityId: string) {
    try {
      // Find admin user (SEED_ADMIN or legacy admin)
      const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@amoeba.group';
      const result = await this.dataSource.query(
        `SELECT usr_id FROM amb_users WHERE usr_email = $1 LIMIT 1`,
        [adminEmail],
      );
      if (!result || result.length === 0) {
        this.logger.warn(`${adminEmail} not found, skipping role assignment`);
        return;
      }

      const adminUserId = result[0].usr_id;

      // HQ entity for SYSTEM_ADMIN
      const hq = await this.entityRepo.findOne({ where: { entIsHq: true } });

      // Assign SYSTEM_ADMIN to HQ + both subsidiaries
      const entityIds = [hq?.entId, vnEntityId, krEntityId].filter(Boolean) as string[];
      for (const entityId of entityIds) {
        const existing = await this.roleRepo.findOne({
          where: { entId: entityId, usrId: adminUserId },
        });
        if (!existing) {
          await this.roleRepo.save(
            this.roleRepo.create({
              entId: entityId,
              usrId: adminUserId,
              eurRole: 'SYSTEM_ADMIN',
            }),
          );
        }
      }

      this.logger.log(`Assigned SYSTEM_ADMIN to admin user for HQ, VN01, and KR01`);
    } catch (e) {
      this.logger.warn(`Could not assign admin roles: ${e.message}`);
    }
  }

  /**
   * 모든 법인에 "Holding" 기본 Unit 자동 생성
   */
  private async ensureHoldingUnits() {
    const entities = await this.entityRepo.find();
    for (const entity of entities) {
      await this.ensureHoldingUnit(entity.entId);
    }
  }

  private async ensureHoldingUnit(entityId: string) {
    const existing = await this.dataSource.query(
      `SELECT unt_id FROM amb_units WHERE ent_id = $1 AND unt_name = 'Holding' LIMIT 1`,
      [entityId],
    );
    if (existing?.length > 0) return;
    await this.dataSource.query(
      `INSERT INTO amb_units (ent_id, unt_name, unt_name_local, unt_level, unt_is_active, unt_sort_order)
       VALUES ($1, 'Holding', 'Holding', 1, true, 9999)`,
      [entityId],
    );
    this.logger.log(`Created Holding unit for entity ${entityId}`);
  }

  /**
   * 환경변수 기반 초기 관리자 생성
   * SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME
   */
  private async seedInitialAdmin() {
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminName = process.env.SEED_ADMIN_NAME || 'System Admin';

    if (!adminEmail || !adminPassword) {
      return; // env 미설정 시 스킵
    }

    try {
      const existing = await this.dataSource.query(
        `SELECT usr_id FROM amb_users WHERE usr_email = $1 LIMIT 1`,
        [adminEmail],
      );
      if (existing && existing.length > 0) {
        // 기존 사용자에 그룹/역할/상태 업데이트 (마이그레이션)
        const userId = existing[0].usr_id;
        const hq = await this.entityRepo.findOne({ where: { entIsHq: true } });
        if (hq) {
          await this.dataSource.query(
            `UPDATE amb_users SET
              usr_level_code = 'ADMIN_LEVEL',
              usr_role = 'SUPER_ADMIN',
              usr_status = 'ACTIVE',
              usr_company_id = $1,
              usr_join_method = COALESCE(usr_join_method, 'SEED')
            WHERE usr_id = $2 AND (usr_level_code IS NULL OR usr_level_code != 'ADMIN_LEVEL')`,
            [hq.entId, userId],
          );
        }
        return;
      }

      // 신규 관리자 생성
      const hq = await this.entityRepo.findOne({ where: { entIsHq: true } });
      if (!hq) {
        this.logger.warn('HQ entity not found, cannot create seed admin');
        return;
      }

      const hashedPw = await bcrypt.hash(adminPassword, 12);
      await this.dataSource.query(
        `INSERT INTO amb_users (
          usr_email, usr_password, usr_name, usr_unit,
          usr_role, usr_level_code, usr_status, usr_must_change_pw,
          usr_join_method, usr_company_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          adminEmail, hashedPw, adminName, 'GENERAL',
          'SUPER_ADMIN', 'ADMIN_LEVEL', 'ACTIVE', true,
          'SEED', hq.entId,
        ],
      );
      this.logger.log(`Created seed admin: ${adminEmail} (SUPER_ADMIN / ADMIN_LEVEL / HQ)`);
    } catch (e) {
      this.logger.warn(`Could not seed initial admin: ${e.message}`);
    }
  }
}
