import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMenuPermissionEntity } from '../entity/user-menu-permission.entity';
import { SetUserPermissionsRequest } from '../dto/request/set-user-permission.request';
import { UserMenuPermissionResponse } from '@amb/types';

@Injectable()
export class UserMenuPermissionService {
  constructor(
    @InjectRepository(UserMenuPermissionEntity)
    private readonly umpRepository: Repository<UserMenuPermissionEntity>,
  ) {}

  async findAll(): Promise<UserMenuPermissionResponse[]> {
    const entities = await this.umpRepository.find({
      relations: ['user', 'grantedByUser'],
      order: { umpCreatedAt: 'DESC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async findByUserId(userId: string): Promise<UserMenuPermissionResponse[]> {
    const entities = await this.umpRepository.find({
      where: { usrId: userId },
      relations: ['user', 'grantedByUser'],
      order: { umpMenuCode: 'ASC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async findRawByUserId(userId: string): Promise<UserMenuPermissionEntity[]> {
    return this.umpRepository.find({
      where: { usrId: userId },
    });
  }

  async setPermissions(
    userId: string,
    dto: SetUserPermissionsRequest,
    grantedBy: string,
  ): Promise<UserMenuPermissionResponse[]> {
    for (const perm of dto.permissions) {
      const existing = await this.umpRepository.findOne({
        where: { umpMenuCode: perm.menu_code, usrId: userId },
      });

      if (existing) {
        existing.umpAccessible = perm.accessible;
        existing.umpGrantedBy = grantedBy;
        await this.umpRepository.save(existing);
      } else {
        const entity = this.umpRepository.create({
          umpMenuCode: perm.menu_code,
          usrId: userId,
          umpAccessible: perm.accessible,
          umpGrantedBy: grantedBy,
        });
        await this.umpRepository.save(entity);
      }
    }
    return this.findByUserId(userId);
  }

  async removePermission(userId: string, menuCode: string): Promise<void> {
    await this.umpRepository.delete({
      usrId: userId,
      umpMenuCode: menuCode,
    });
  }

  private toResponse(e: UserMenuPermissionEntity): UserMenuPermissionResponse {
    return {
      id: e.umpId,
      menuCode: e.umpMenuCode,
      userId: e.usrId,
      userName: e.user?.usrName || '',
      userRole: e.user?.usrRole || '',
      accessible: e.umpAccessible,
      grantedBy: e.grantedByUser?.usrName || null,
      createdAt: e.umpCreatedAt?.toISOString() || '',
    };
  }
}
