import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuPermissionEntity } from '../entity/menu-permission.entity';
import { UpdateMenuPermissionsRequest } from '../dto/request/update-menu-permissions.request';
import {
  ALL_MENU_CODES,
  ROLES,
  DEFAULT_PERMISSIONS,
  MENU_NAMES,
  ADMIN_MODULE_CODES,
} from '../../../global/constant/menu-code.constant';
import { MenuPermissionResponse, MyMenuItemResponse } from '@amb/types';
import { MenuConfigService } from './menu-config.service';
import { UserMenuPermissionService } from './user-menu-permission.service';
import { MenuGroupPermissionService } from './menu-group-permission.service';
import { MenuUnitPermissionService } from './menu-unit-permission.service';
import { UserCellEntity } from '../../members/entity/user-cell.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { EntityMenuConfigEntity } from '../../entity-settings/entity/entity-menu-config.entity';

@Injectable()
export class MenuPermissionService implements OnModuleInit {
  private readonly logger = new Logger(MenuPermissionService.name);

  constructor(
    @InjectRepository(MenuPermissionEntity)
    private readonly permissionRepository: Repository<MenuPermissionEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userGroupRepository: Repository<UserCellEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(EntityMenuConfigEntity)
    private readonly entityMenuConfigRepository: Repository<EntityMenuConfigEntity>,
    private readonly menuConfigService: MenuConfigService,
    private readonly userMenuPermissionService: UserMenuPermissionService,
    private readonly menuGroupPermissionService: MenuGroupPermissionService,
    private readonly menuUnitPermissionService: MenuUnitPermissionService,
  ) {}

  async onModuleInit() {
    await this.initDefaults();
  }

  async findAll(): Promise<MenuPermissionResponse[]> {
    const entities = await this.permissionRepository.find({
      order: { mpmMenuCode: 'ASC', mpmRole: 'ASC' },
    });
    return entities.map((e) => ({
      id: e.mpmId,
      menuCode: e.mpmMenuCode as MenuPermissionResponse['menuCode'],
      menuName: MENU_NAMES[e.mpmMenuCode] || e.mpmMenuCode,
      role: e.mpmRole,
      accessible: e.mpmAccessible,
    }));
  }

  /** ADMIN_LEVEL 역할(수정 불가) 여부 판정 */
  private isAdminRole(role: string): boolean {
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  }

  async bulkUpdate(dto: UpdateMenuPermissionsRequest): Promise<MenuPermissionResponse[]> {
    for (const perm of dto.permissions) {
      if (this.isAdminRole(perm.role)) continue;

      const existing = await this.permissionRepository.findOne({
        where: {
          mpmMenuCode: perm.menu_code,
          mpmRole: perm.role,
        },
      });

      if (existing) {
        existing.mpmAccessible = perm.accessible;
        await this.permissionRepository.save(existing);
      } else {
        const entity = this.permissionRepository.create({
          mpmMenuCode: perm.menu_code,
          mpmRole: perm.role,
          mpmAccessible: perm.accessible,
        });
        await this.permissionRepository.save(entity);
      }
    }

    return this.findAll();
  }

  async getAccessibleMenus(role: string): Promise<string[]> {
    const entities = await this.permissionRepository.find({
      where: { mpmRole: role, mpmAccessible: true },
    });
    return entities.map((e) => e.mpmMenuCode);
  }

  /**
   * 통합 권한 판정: 메뉴 설정 + 역할 권한 + Unit 권한 + 사용자별 권한을 모두 고려하여
   * 현재 사용자가 접근 가능한 메뉴 목록을 반환합니다.
   *
   * 판정 순서 (우선순위: 개별 > Unit > 역할):
   * 0. 메뉴 enabled=false → 전체 숨김
   * 1. ADMIN → 활성 메뉴 전부 접근
   * 2. 사용자별 개별 설정 → 최우선
   * 3. Unit 설정 (해당 메뉴에 Unit 설정이 있으면 적용)
   * 4. 역할별 설정 → 등급 기본값
   * 5. Cell 필터 → 그룹 설정이 있는 메뉴만 필터
   */
  async getMyMenus(userId: string, role: string, requestedEntityId?: string): Promise<MyMenuItemResponse[]> {
    // 1. 활성화된 메뉴만 조회
    const enabledMenus = await this.menuConfigService.findEnabledMenus();

    if (enabledMenus.length === 0) return [];

    const userEntity = await this.userRepository.findOne({ where: { usrId: userId } });
    const canCrossEntity = this.isAdminRole(role) || role === 'MASTER';
    const entityId = canCrossEntity
      ? (requestedEntityId || userEntity?.usrCompanyId)
      : userEntity?.usrCompanyId;
    const entityOverrides = entityId
      ? await this.entityMenuConfigRepository.find({ where: { entId: entityId } })
      : [];
    const overrideMap = new Map(entityOverrides.map((row) => [row.emcMenuCode, row]));

    /** 법인 설정에서 visible=false로 지정된 메뉴인지 판별 */
    const isEntityHidden = (menuCode: string): boolean => {
      const override = overrideMap.get(menuCode);
      return override ? override.emcVisible === false : false;
    };

    const toMyMenuItem = (menu: {
      mcfMenuCode: string;
      mcfPath: string;
      mcfIcon: string;
      mcfLabelKey: string;
      mcfSortOrder: number;
      mcfCategory: string;
    }): MyMenuItemResponse => {
      const override = overrideMap.get(menu.mcfMenuCode);
      return {
        menuCode: menu.mcfMenuCode,
        path: menu.mcfPath,
        icon: menu.mcfIcon,
        labelKey: menu.mcfLabelKey,
        sortOrder: override?.emcSortOrder ?? menu.mcfSortOrder,
        category: override?.emcCategory ?? (menu.mcfCategory === 'WORK_TOOL' ? 'WORK_TOOL' : 'WORK_MODULE'),
      };
    };

    // 2. ADMIN_LEVEL 역할(SUPER_ADMIN/ADMIN)은 활성 메뉴 전부 접근
    if (this.isAdminRole(role)) {
      return enabledMenus
        .map(toMyMenuItem)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    // 2-1. MASTER: 활성화된 모든 메뉴 접근 (ADMIN_MODULE, SETTINGS, 법인 비노출 제외)
    //  → 개별/Unit/Cell 오버라이드와 무관하게 보장
    if (role === 'MASTER') {
      const adminModuleCodes: readonly string[] = ADMIN_MODULE_CODES;
      return enabledMenus
        .filter((m) =>
          !adminModuleCodes.includes(m.mcfMenuCode) &&
          !m.mcfMenuCode.startsWith('SETTINGS_') &&
          !isEntityHidden(m.mcfMenuCode),
        )
        .map(toMyMenuItem)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    // 3. 사용자별 개별 설정 조회
    const userPerms = await this.userMenuPermissionService.findRawByUserId(userId);
    const userPermMap = new Map(userPerms.map((p) => [p.umpMenuCode, p.umpAccessible]));

    // 3-1. Unit 권한 조회
    let unitPermMap = new Map<string, boolean>();
    let menuCodesWithUnitSettings = new Set<string>();
    if (userEntity?.usrUnit && userEntity.usrCompanyId) {
      unitPermMap = await this.menuUnitPermissionService.getAccessMapForUnit(
        userEntity.usrUnit,
        userEntity.usrCompanyId,
      );
      menuCodesWithUnitSettings = await this.menuUnitPermissionService.getMenuCodesWithUnitSettings(
        userEntity.usrCompanyId,
      );
    }

    // 4. 역할별 권한 조회
    const rolePerms = await this.permissionRepository.find({
      where: { mpmRole: role },
    });
    const rolePermMap = new Map(rolePerms.map((p) => [p.mpmMenuCode, p.mpmAccessible]));

    // 5. 메뉴별 판정
    const result: MyMenuItemResponse[] = [];
    for (const menu of enabledMenus) {
      const code = menu.mcfMenuCode;

      // 5-0. 법인 설정에서 비노출된 메뉴는 건너뜀
      if (isEntityHidden(code)) continue;

      const menuItem = toMyMenuItem(menu);

      // 5-1. 개별 설정이 있으면 최우선
      if (userPermMap.has(code)) {
        if (userPermMap.get(code)) {
          result.push(menuItem);
        }
        continue;
      }

      // 5-2. Unit 설정이 존재하는 메뉴이고, 사용자의 Unit에 설정이 있으면 적용
      if (menuCodesWithUnitSettings.has(code) && unitPermMap.has(code)) {
        if (unitPermMap.get(code)) {
          result.push(menuItem);
        }
        continue;
      }

      // 5-3. 역할별 설정
      const roleAccessible = rolePermMap.get(code) ?? false;
      if (roleAccessible) {
        result.push(menuItem);
      }
    }

    // 6. USER_LEVEL → Admin Module 메뉴 강제 필터 (이중 검증)
    const adminModuleCodes: readonly string[] = ADMIN_MODULE_CODES;
    const filteredResult = result.filter((item) => !adminModuleCodes.includes(item.menuCode));

    // 7. 그룹별 권한 필터 (Cell 미소속 사용자는 Cell 필터 건너뜀)
    const userGroups = await this.userGroupRepository.find({ where: { usrId: userId } });
    const userCellIds = userGroups.map((ug) => ug.celId);

    if (userCellIds.length === 0) {
      return filteredResult.sort((a, b) => a.sortOrder - b.sortOrder);
    }

    const menuCodesWithGroupSettings = userEntity?.usrCompanyId
      ? await this.menuGroupPermissionService.getMenuCodesWithGroupSettingsForEntity(userEntity.usrCompanyId)
      : await this.menuGroupPermissionService.getMenuCodesWithGroupSettings();

    if (menuCodesWithGroupSettings.size > 0) {
      const groupAccessMap = await this.menuGroupPermissionService.getAccessMapForGroups(userCellIds);

      // 사용자의 Cell에 대한 설정이 하나도 없으면 Cell 필터 건너뜀
      if (groupAccessMap.size === 0) {
        return filteredResult.sort((a, b) => a.sortOrder - b.sortOrder);
      }

      return filteredResult
        .filter((item) => {
        if (!menuCodesWithGroupSettings.has(item.menuCode)) return true;
        // 사용자 Cell에 해당 메뉴 설정이 없으면 통과 (설정 없음 = 기본 허용)
        if (!groupAccessMap.has(item.menuCode)) return true;
        return groupAccessMap.get(item.menuCode) === true;
      })
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }

    return filteredResult.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private async initDefaults(): Promise<void> {
    this.logger.log('Checking default menu permissions...');

    let insertedCount = 0;
    for (const role of ROLES) {
      for (const menuCode of ALL_MENU_CODES) {
        const existing = await this.permissionRepository.findOne({
          where: { mpmMenuCode: menuCode, mpmRole: role },
        });
        if (!existing) {
          const accessible = DEFAULT_PERMISSIONS[role]?.[menuCode] ?? false;
          const entity = this.permissionRepository.create({
            mpmMenuCode: menuCode,
            mpmRole: role,
            mpmAccessible: accessible,
          });
          await this.permissionRepository.save(entity);
          insertedCount++;
        }
      }
    }

    if (insertedCount > 0) {
      this.logger.log(`Inserted ${insertedCount} new default menu permissions.`);
    }
  }
}
