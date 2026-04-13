import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuUnitPermissionEntity } from '../entity/menu-unit-permission.entity';

export interface MenuUnitPermissionResponse {
  id: string;
  menuCode: string;
  unitName: string;
  entityId: string;
  accessible: boolean;
}

@Injectable()
export class MenuUnitPermissionService {
  constructor(
    @InjectRepository(MenuUnitPermissionEntity)
    private readonly repository: Repository<MenuUnitPermissionEntity>,
  ) {}

  async findByEntityId(entityId: string): Promise<MenuUnitPermissionResponse[]> {
    const entities = await this.repository.find({
      where: { entId: entityId },
      order: { mupUnitName: 'ASC', mupMenuCode: 'ASC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async findByUnitName(
    unitName: string,
    entityId: string,
  ): Promise<MenuUnitPermissionResponse[]> {
    const entities = await this.repository.find({
      where: { mupUnitName: unitName, entId: entityId },
      order: { mupMenuCode: 'ASC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async setPermissions(
    unitName: string,
    entityId: string,
    permissions: { menu_code: string; accessible: boolean }[],
  ): Promise<MenuUnitPermissionResponse[]> {
    for (const perm of permissions) {
      const existing = await this.repository.findOne({
        where: {
          mupMenuCode: perm.menu_code,
          mupUnitName: unitName,
          entId: entityId,
        },
      });

      if (existing) {
        existing.mupAccessible = perm.accessible;
        await this.repository.save(existing);
      } else {
        const entity = this.repository.create({
          mupMenuCode: perm.menu_code,
          mupUnitName: unitName,
          entId: entityId,
          mupAccessible: perm.accessible,
        });
        await this.repository.save(entity);
      }
    }

    return this.findByUnitName(unitName, entityId);
  }

  /**
   * 특정 Unit의 메뉴 접근 맵을 반환합니다.
   * key: menuCode, value: accessible
   */
  async getAccessMapForUnit(
    unitName: string,
    entityId: string,
  ): Promise<Map<string, boolean>> {
    const entities = await this.repository.find({
      where: { mupUnitName: unitName, entId: entityId },
    });

    const map = new Map<string, boolean>();
    for (const e of entities) {
      map.set(e.mupMenuCode, e.mupAccessible);
    }
    return map;
  }

  /**
   * Unit 권한 설정이 존재하는 메뉴 코드 Set을 반환합니다.
   */
  async getMenuCodesWithUnitSettings(entityId: string): Promise<Set<string>> {
    const entities = await this.repository
      .createQueryBuilder('mup')
      .select('DISTINCT mup.mupMenuCode', 'menuCode')
      .where('mup.entId = :entityId', { entityId })
      .getRawMany();
    return new Set(entities.map((e) => e.menuCode));
  }

  private toResponse(e: MenuUnitPermissionEntity): MenuUnitPermissionResponse {
    return {
      id: e.mupId,
      menuCode: e.mupMenuCode,
      unitName: e.mupUnitName,
      entityId: e.entId,
      accessible: e.mupAccessible,
    };
  }
}
