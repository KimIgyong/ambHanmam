import {
  Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { CellEntity } from '../../members/entity/cell.entity';
import { UnitEntity } from '../../unit/entity/unit.entity';
import { MenuConfigEntity } from '../../settings/entity/menu-config.entity';
import { EntityMenuConfigEntity } from '../entity/entity-menu-config.entity';
import { UserMenuPermissionService } from '../../settings/service/user-menu-permission.service';
import { MenuGroupPermissionService } from '../../settings/service/menu-group-permission.service';
import { MenuUnitPermissionService } from '../../settings/service/menu-unit-permission.service';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { SetEntityPermissionRequest } from '../dto/set-entity-permission.request';
import { SetUnitPermissionRequest } from '../dto/set-unit-permission.request';
import { SetCellPermissionRequest } from '../dto/set-cell-permission.request';
import { SetEntityMenuConfigRequest } from '../dto/set-entity-menu-config.request';

/** MASTER가 수정 불가능한 메뉴 코드 패턴 */
const RESTRICTED_MENU_PREFIXES = ['SETTINGS_', 'ENTITY_'];

/** Admin Module — ADMIN_LEVEL 전용 */
const ADMIN_MODULE_CODES = ['AGENTS', 'SERVICE_MANAGEMENT', 'SITE_MANAGEMENT'];

@Injectable()
export class EntityPermissionService {
  private readonly logger = new Logger(EntityPermissionService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(MenuConfigEntity)
    private readonly menuConfigRepo: Repository<MenuConfigEntity>,
    @InjectRepository(EntityMenuConfigEntity)
    private readonly entityMenuConfigRepo: Repository<EntityMenuConfigEntity>,
    @InjectRepository(CellEntity)
    private readonly cellRepo: Repository<CellEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepo: Repository<UnitEntity>,
    private readonly userMenuPermissionService: UserMenuPermissionService,
    private readonly menuGroupPermissionService: MenuGroupPermissionService,
    private readonly menuUnitPermissionService: MenuUnitPermissionService,
  ) {}

  /**
   * 설정 가능한 메뉴 목록 (WORK_TOOL + WORK_MODULE만)
   */
  async getAvailableMenus() {
    const menus = await this.menuConfigRepo.find({
      where: { mcfEnabled: true },
      order: { mcfSortOrder: 'ASC' },
    });

    return menus
      .filter((m) => {
        const code = m.mcfMenuCode;
        if (RESTRICTED_MENU_PREFIXES.some((p) => code.startsWith(p))) return false;
        if (ADMIN_MODULE_CODES.includes(code)) return false;
        return true;
      })
      .map((m) => ({
        menuCode: m.mcfMenuCode,
        label: m.mcfLabelKey,
        icon: m.mcfIcon,
        path: m.mcfPath,
        category: m.mcfCategory,
      }));
  }

  async getEntityMenuConfig(entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const baseMenus = await this.menuConfigRepo.find({
      where: { mcfEnabled: true },
      order: { mcfSortOrder: 'ASC' },
    });

    const filteredMenus = baseMenus.filter((m) => {
      const code = m.mcfMenuCode;
      if (RESTRICTED_MENU_PREFIXES.some((p) => code.startsWith(p))) return false;
      if (ADMIN_MODULE_CODES.includes(code)) return false;
      return true;
    });

    const overrides = await this.entityMenuConfigRepo.find({
      where: { entId: entityId },
    });
    const overrideMap = new Map(overrides.map((o) => [o.emcMenuCode, o]));

    return filteredMenus
      .map((m) => {
        const override = overrideMap.get(m.mcfMenuCode);
        return {
          menuCode: m.mcfMenuCode,
          label: m.mcfLabelKey,
          icon: m.mcfIcon,
          path: m.mcfPath,
          category: override?.emcCategory ?? (m.mcfCategory === 'WORK_TOOL' ? 'WORK_TOOL' : 'WORK_MODULE'),
          sortOrder: override?.emcSortOrder ?? m.mcfSortOrder,
          visible: override ? override.emcVisible : true,
          isOverridden: !!override,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async setEntityMenuConfig(entityId: string, dto: SetEntityMenuConfigRequest, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const baseMenus = await this.getAvailableMenus();
    const allowedMenuCodes = new Set(baseMenus.map((m) => m.menuCode));
    const dtoMenuCodes = new Set(dto.configs.map((c) => c.menu_code));

    if (allowedMenuCodes.size !== dtoMenuCodes.size) {
      throw new BadRequestException('All available menus must be configured exactly once');
    }

    for (const menuCode of dtoMenuCodes) {
      if (!allowedMenuCodes.has(menuCode)) {
        throw new BadRequestException(`Invalid menu code: ${menuCode}`);
      }
    }

    const entity = this.entityMenuConfigRepo.manager;
    await entity.transaction(async (tx) => {
      await tx.delete(EntityMenuConfigEntity, { entId: entityId });
      const rows = dto.configs.map((c) => tx.create(EntityMenuConfigEntity, {
        entId: entityId,
        emcMenuCode: c.menu_code,
        emcCategory: c.category,
        emcSortOrder: c.sort_order,
        emcVisible: c.visible ?? true,
        emcUpdatedBy: user.userId,
      }));
      await tx.save(EntityMenuConfigEntity, rows);
    });

    return this.getEntityMenuConfig(entityId, user);
  }

  async resetEntityMenuConfig(entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    await this.entityMenuConfigRepo.delete({ entId: entityId });

    return {
      entityId,
      reset: true,
    };
  }

  // ─── Unit (부서) 관련 ───

  /**
   * 법인의 고유 Unit 목록 조회
   */
  async getUnits(entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const units = await this.unitRepo.find({
      where: { entId: entityId },
      order: { untLevel: 'ASC', untSortOrder: 'ASC', untName: 'ASC' },
    });

    const memberCounts = await this.userRepo
      .createQueryBuilder('u')
      .select('u.usrUnit', 'unit')
      .addSelect('COUNT(*)', 'count')
      .where('u.usrCompanyId = :entityId', { entityId })
      .andWhere('u.usrLevelCode = :level', { level: 'USER_LEVEL' })
      .andWhere('u.usrUnit IS NOT NULL')
      .andWhere("u.usrUnit != ''")
      .andWhere('u.usrDeletedAt IS NULL')
      .groupBy('u.usrUnit')
      .getRawMany();

    const countMap = new Map(
      memberCounts.map((r) => [r.unit as string, parseInt(r.count, 10)]),
    );

    return units.map((u) => ({
      unitName: u.untName,
      memberCount: countMap.get(u.untName) ?? 0,
    }));
  }

  /**
   * Unit별 메뉴 권한 조회
   */
  async getUnitPermissions(unitName: string, entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);
    return this.menuUnitPermissionService.findByUnitName(unitName, entityId);
  }

  /**
   * Unit별 메뉴 권한 설정
   */
  async setUnitPermissions(
    unitName: string,
    entityId: string,
    dto: SetUnitPermissionRequest,
    user: UserPayload,
  ) {
    this.ensureEntityAccess(entityId, user);
    this.validateMenuCodes(dto.permissions);

    return this.menuUnitPermissionService.setPermissions(
      unitName,
      entityId,
      dto.permissions,
    );
  }

  // ─── Cell (그룹) 관련 ───

  /**
   * 법인의 Cell 목록 조회
   */
  async getCells(entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const cells = await this.cellRepo.find({
      where: { entId: entityId },
      order: { celName: 'ASC' },
    });

    return cells.map((c) => ({
      cellId: c.celId,
      cellName: c.celName,
      description: c.celDescription,
    }));
  }

  /**
   * Cell별 메뉴 권한 조회
   */
  async getCellPermissions(cellId: string, entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);

    const cell = await this.cellRepo.findOne({
      where: { celId: cellId, entId: entityId },
    });
    if (!cell) {
      throw new NotFoundException('Cell not found in this entity');
    }

    const all = await this.menuGroupPermissionService.findAll();
    return all.filter((p) => p.celId === cellId);
  }

  /**
   * Cell별 메뉴 권한 설정
   */
  async setCellPermissions(
    cellId: string,
    entityId: string,
    dto: SetCellPermissionRequest,
    user: UserPayload,
  ) {
    this.ensureEntityAccess(entityId, user);

    const cell = await this.cellRepo.findOne({
      where: { celId: cellId, entId: entityId },
    });
    if (!cell) {
      throw new NotFoundException('Cell not found in this entity');
    }

    this.validateMenuCodes(dto.permissions);

    return this.menuGroupPermissionService.bulkUpdate({
      permissions: dto.permissions.map((p) => ({
        menu_code: p.menu_code,
        cel_id: cellId,
        accessible: p.accessible,
      })),
    });
  }

  // ─── Individual (개인) 관련 ───

  /**
   * 법인 멤버의 현재 메뉴 권한 조회
   */
  async getMemberPermissions(userId: string, entityId: string, user: UserPayload) {
    this.ensureEntityAccess(entityId, user);
    await this.ensureTargetInEntity(userId, entityId, user);

    return this.userMenuPermissionService.findByUserId(userId);
  }

  /**
   * 법인 멤버 메뉴 권한 설정
   */
  async setMemberPermissions(
    userId: string,
    entityId: string,
    dto: SetEntityPermissionRequest,
    user: UserPayload,
  ) {
    this.ensureEntityAccess(entityId, user);
    await this.ensureTargetInEntity(userId, entityId, user);

    this.validateMenuCodes(dto.permissions);

    return this.userMenuPermissionService.setPermissions(
      userId,
      { permissions: dto.permissions },
      user.userId,
    );
  }

  /**
   * 법인 멤버 메뉴 권한 제거
   */
  async removeMemberPermission(
    userId: string,
    menuCode: string,
    entityId: string,
    user: UserPayload,
  ) {
    this.ensureEntityAccess(entityId, user);
    await this.ensureTargetInEntity(userId, entityId, user);

    if (RESTRICTED_MENU_PREFIXES.some((p) => menuCode.startsWith(p))) {
      throw new BadRequestException(`Cannot remove permission for ${menuCode}`);
    }

    await this.userMenuPermissionService.removePermission(userId, menuCode);
    return { userId, menuCode, removed: true };
  }

  // ─── 공통 유틸 ───

  private validateMenuCodes(permissions: { menu_code: string }[]) {
    for (const perm of permissions) {
      if (RESTRICTED_MENU_PREFIXES.some((p) => perm.menu_code.startsWith(p))) {
        throw new BadRequestException(`Cannot modify permission for ${perm.menu_code}`);
      }
      if (ADMIN_MODULE_CODES.includes(perm.menu_code)) {
        throw new BadRequestException(`Cannot modify Admin Module permission: ${perm.menu_code}`);
      }
    }
  }

  private ensureEntityAccess(entityId: string, user: UserPayload) {
    if (user.level === 'ADMIN_LEVEL') return;
    if (user.companyId !== entityId) {
      throw new ForbiddenException('Cannot access permissions of another entity');
    }
  }

  private async ensureTargetInEntity(userId: string, entityId: string, user: UserPayload) {
    const target = await this.userRepo.findOne({
      where: { usrId: userId, usrCompanyId: entityId },
    });
    if (!target) {
      throw new NotFoundException('User not found in this entity');
    }

    if (target.usrLevelCode === 'ADMIN_LEVEL') {
      throw new ForbiddenException('Cannot modify ADMIN_LEVEL user permissions');
    }

    if (user.role === 'MASTER' && target.usrRole === 'MASTER') {
      throw new ForbiddenException('MASTER cannot modify another MASTER user permissions');
    }
  }
}
