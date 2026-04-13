import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { UnitEntity } from '../entity/unit.entity';
import { UserUnitRoleEntity } from '../entity/user-unit-role.entity';

@Injectable()
export class HierarchyService {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly udrRepository: Repository<UserUnitRoleEntity>,
  ) {}

  /**
   * Get all users visible to a given user based on unit hierarchy.
   * - A UNIT_HEAD can see all members in their unit and sub-units.
   * - A TEAM_LEAD can see all members in their team.
   * - A MEMBER can see themselves and other members in their unit.
   */
  async getVisibleUsers(userId: string): Promise<string[]> {
    const visibleUserIds = new Set<string>();
    visibleUserIds.add(userId);

    const userRoles = await this.udrRepository.find({
      where: { usrId: userId, uurEndedAt: IsNull() },
      relations: ['unit'],
    });

    if (userRoles.length === 0) {
      return [userId];
    }

    for (const role of userRoles) {
      if (role.uurRole === 'UNIT_HEAD') {
        // Get all units under this one (including sub-teams)
        const unitIds = await this.getSubUnitIds(role.untId);
        unitIds.push(role.untId);

        const members = await this.udrRepository.find({
          where: { untId: In(unitIds), uurEndedAt: IsNull() },
        });
        members.forEach((m) => visibleUserIds.add(m.usrId));
      } else if (role.uurRole === 'TEAM_LEAD') {
        // Get all members in the same team
        const members = await this.udrRepository.find({
          where: { untId: role.untId, uurEndedAt: IsNull() },
        });
        members.forEach((m) => visibleUserIds.add(m.usrId));
      } else {
        // MEMBER: see own unit members
        const members = await this.udrRepository.find({
          where: { untId: role.untId, uurEndedAt: IsNull() },
        });
        members.forEach((m) => visibleUserIds.add(m.usrId));
      }
    }

    return Array.from(visibleUserIds);
  }

  /**
   * Get subordinate user IDs (users managed by this user)
   */
  async getSubordinates(userId: string): Promise<string[]> {
    const subordinateIds = new Set<string>();

    const userRoles = await this.udrRepository.find({
      where: { usrId: userId, uurEndedAt: IsNull() },
    });

    for (const role of userRoles) {
      if (role.uurRole === 'UNIT_HEAD') {
        const unitIds = await this.getSubUnitIds(role.untId);
        unitIds.push(role.untId);

        const members = await this.udrRepository.find({
          where: { untId: In(unitIds), uurEndedAt: IsNull() },
        });
        members
          .filter((m) => m.usrId !== userId)
          .forEach((m) => subordinateIds.add(m.usrId));
      } else if (role.uurRole === 'TEAM_LEAD') {
        const members = await this.udrRepository.find({
          where: { untId: role.untId, uurEndedAt: IsNull() },
        });
        members
          .filter((m) => m.usrId !== userId && m.uurRole === 'MEMBER')
          .forEach((m) => subordinateIds.add(m.usrId));
      }
    }

    return Array.from(subordinateIds);
  }

  /**
   * Check if userId is a manager of the target unit
   */
  async isManagerOf(userId: string, targetUnitId: string): Promise<boolean> {
    // Check if user is UNIT_HEAD of the target or its parent unit
    const userRoles = await this.udrRepository.find({
      where: { usrId: userId, uurEndedAt: IsNull() },
    });

    for (const role of userRoles) {
      if (role.uurRole === 'UNIT_HEAD') {
        if (role.untId === targetUnitId) return true;

        // Check if target unit is a sub-unit
        const subUnitIds = await this.getSubUnitIds(role.untId);
        if (subUnitIds.includes(targetUnitId)) return true;
      }

      if (role.uurRole === 'TEAM_LEAD' && role.untId === targetUnitId) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a user is a manager of another user
   */
  async isManagerOfUser(managerId: string, targetUserId: string): Promise<boolean> {
    const targetRoles = await this.udrRepository.find({
      where: { usrId: targetUserId, uurEndedAt: IsNull() },
    });

    for (const targetRole of targetRoles) {
      if (await this.isManagerOf(managerId, targetRole.untId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all sub-unit IDs recursively
   */
  private async getSubUnitIds(parentId: string): Promise<string[]> {
    const children = await this.unitRepository.find({
      where: { untParentId: parentId, untIsActive: true },
    });

    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.untId);
      const subIds = await this.getSubUnitIds(child.untId);
      ids.push(...subIds);
    }

    return ids;
  }

  /**
   * Get the unit IDs a user belongs to (active only)
   */
  async getUserUnitIds(userId: string): Promise<string[]> {
    const roles = await this.udrRepository.find({
      where: { usrId: userId, uurEndedAt: IsNull() },
    });
    return roles.map((r) => r.untId);
  }

  /**
   * Get the entity ID for a user's primary unit
   */
  async getUserEntityId(userId: string): Promise<string | null> {
    const role = await this.udrRepository.findOne({
      where: { usrId: userId, uurIsPrimary: true, uurEndedAt: IsNull() },
      relations: ['unit'],
    });

    if (role?.unit) {
      return role.unit.entId;
    }

    // Fallback to first active
    const firstRole = await this.udrRepository.findOne({
      where: { usrId: userId, uurEndedAt: IsNull() },
      relations: ['unit'],
      order: { uurCreatedAt: 'ASC' },
    });

    return firstRole?.unit?.entId || null;
  }
}
