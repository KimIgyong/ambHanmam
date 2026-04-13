import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuCellPermissionEntity } from '../entity/menu-group-permission.entity';
import { UpdateMenuGroupPermissionsRequest } from '../dto/request/update-menu-group-permissions.request';

export interface MenuGroupPermissionResponse {
  id: string;
  menuCode: string;
  celId: string;
  accessible: boolean;
}

@Injectable()
export class MenuGroupPermissionService {
  constructor(
    @InjectRepository(MenuCellPermissionEntity)
    private readonly repository: Repository<MenuCellPermissionEntity>,
  ) {}

  async findAll(): Promise<MenuGroupPermissionResponse[]> {
    const entities = await this.repository.find({
      order: { mcpMenuCode: 'ASC', celId: 'ASC' },
    });
    return entities.map((e) => ({
      id: e.mcpId,
      menuCode: e.mcpMenuCode,
      celId: e.celId,
      accessible: e.mcpAccessible,
    }));
  }

  async bulkUpdate(dto: UpdateMenuGroupPermissionsRequest): Promise<MenuGroupPermissionResponse[]> {
    for (const perm of dto.permissions) {
      const existing = await this.repository.findOne({
        where: {
          mcpMenuCode: perm.menu_code,
          celId: perm.cel_id,
        },
      });

      if (existing) {
        existing.mcpAccessible = perm.accessible;
        await this.repository.save(existing);
      } else {
        const entity = this.repository.create({
          mcpMenuCode: perm.menu_code,
          celId: perm.cel_id,
          mcpAccessible: perm.accessible,
        });
        await this.repository.save(entity);
      }
    }

    return this.findAll();
  }

  /**
   * 특정 사용자의 셀 ID 목록을 받아, 해당 셀들의 메뉴 접근 권한을 반환합니다.
   * key: menuCode, value: accessible (하나라도 true면 true)
   */
  async getAccessMapForGroups(cellIds: string[]): Promise<Map<string, boolean>> {
    if (cellIds.length === 0) return new Map();

    const entities = await this.repository
      .createQueryBuilder('mcp')
      .where('mcp.celId IN (:...cellIds)', { cellIds })
      .getMany();

    const map = new Map<string, boolean>();
    for (const e of entities) {
      const current = map.get(e.mcpMenuCode);
      // OR 논리: 하나라도 accessible이면 true
      if (current === undefined) {
        map.set(e.mcpMenuCode, e.mcpAccessible);
      } else if (e.mcpAccessible) {
        map.set(e.mcpMenuCode, true);
      }
    }
    return map;
  }

  /**
   * 특정 법인의 셀에 대해 메뉴 권한 설정이 존재하는 메뉴 코드 목록을 반환합니다.
   * 법인 범위로 제한하여 다른 법인의 Cell 설정이 영향을 미치지 않도록 합니다.
   */
  async getMenuCodesWithGroupSettingsForEntity(entityId: string): Promise<Set<string>> {
    if (!entityId) return new Set();

    const entities = await this.repository
      .createQueryBuilder('mcp')
      .innerJoin('amb_cells', 'c', 'c.cel_id = mcp.celId')
      .select('DISTINCT mcp.mcpMenuCode', 'menuCode')
      .where('c.ent_id = :entityId', { entityId })
      .getRawMany();
    return new Set(entities.map((e) => e.menuCode));
  }

  /**
   * @deprecated Use getMenuCodesWithGroupSettingsForEntity instead
   */
  async getMenuCodesWithGroupSettings(): Promise<Set<string>> {
    const entities = await this.repository
      .createQueryBuilder('mcp')
      .select('DISTINCT mcp.mcpMenuCode', 'menuCode')
      .getRawMany();
    return new Set(entities.map((e) => e.menuCode));
  }
}
