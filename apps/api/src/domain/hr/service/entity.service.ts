import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { HrEntityEntity } from '../entity/hr-entity.entity';
import { EntityUserRoleEntity } from '../entity/entity-user-role.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { InvitationEntity } from '../../invitation/entity/invitation.entity';
import { CreateEntityRequest } from '../dto/request/create-entity.request';
import { UpdateEntityRequest } from '../dto/request/update-entity.request';
import { AssignEntityRoleRequest } from '../dto/request/assign-entity-role.request';
import { EntityMapper } from '../mapper/entity.mapper';
import { HrEntityResponse, HrEntityUserRoleResponse } from '@amb/types';

@Injectable()
export class EntityService {
  private readonly logger = new Logger(EntityService.name);

  constructor(
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly roleRepo: Repository<EntityUserRoleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(InvitationEntity)
    private readonly invitationRepo: Repository<InvitationEntity>,
  ) {}

  async getEntitiesForUser(userId: string): Promise<HrEntityResponse[]> {
    const roles = await this.roleRepo.find({
      where: { usrId: userId, eurStatus: 'ACTIVE' },
      relations: ['hrEntity'],
    });

    const entities = roles
      .map((r) => r.hrEntity)
      .filter((e) => e && e.entStatus === 'ACTIVE');

    // Deduplicate by entId
    const unique = [...new Map(entities.map((e) => [e.entId, e])).values()];
    return unique.map(EntityMapper.toResponse);
  }

  async getAllEntities(): Promise<HrEntityResponse[]> {
    const entities = await this.entityRepo.find({ order: { entCode: 'ASC' } });
    return entities.map(EntityMapper.toResponse);
  }

  async getEntityById(id: string): Promise<HrEntityResponse> {
    const entity = await this.entityRepo.findOne({ where: { entId: id } });
    if (!entity) {
      throw new NotFoundException('Entity not found.');
    }
    return EntityMapper.toResponse(entity);
  }

  async createEntity(dto: CreateEntityRequest): Promise<HrEntityResponse> {
    const existing = await this.entityRepo.findOne({ where: { entCode: dto.code } });
    if (existing) {
      throw new ConflictException('Entity code already exists.');
    }

    const entity = this.entityRepo.create({
      entCode: dto.code,
      entName: dto.name,
      entNameEn: dto.name_en || undefined,
      entCountry: dto.country,
      entCurrency: dto.currency,
      entRegNo: dto.registration_no || undefined,
      entAddress: dto.address || undefined,
      entRepresentative: dto.representative || undefined,
      entPhone: dto.phone || undefined,
      entEmail: dto.email || undefined,
      entPayDay: dto.pay_day || 25,
    } as DeepPartial<HrEntityEntity>);

    const saved: HrEntityEntity = await this.entityRepo.save(entity as HrEntityEntity);
    return EntityMapper.toResponse(saved);
  }

  async updateEntity(id: string, dto: UpdateEntityRequest): Promise<HrEntityResponse> {
    const entity = await this.entityRepo.findOne({ where: { entId: id } });
    if (!entity) {
      throw new NotFoundException('Entity not found.');
    }

    if (dto.name !== undefined) entity.entName = dto.name;
    if (dto.name_en !== undefined) entity.entNameEn = dto.name_en;
    if (dto.country !== undefined) entity.entCountry = dto.country;
    if (dto.currency !== undefined) entity.entCurrency = dto.currency;
    if (dto.registration_no !== undefined) entity.entRegNo = dto.registration_no;
    if (dto.address !== undefined) entity.entAddress = dto.address;
    if (dto.representative !== undefined) entity.entRepresentative = dto.representative;
    if (dto.phone !== undefined) entity.entPhone = dto.phone;
    if (dto.email !== undefined) entity.entEmail = dto.email;
    if (dto.pay_day !== undefined) entity.entPayDay = dto.pay_day;
    if (dto.status !== undefined) entity.entStatus = dto.status;
    if (dto.email_display_name !== undefined) entity.entEmailDisplayName = dto.email_display_name || null;
    if (dto.email_brand_color !== undefined) entity.entEmailBrandColor = dto.email_brand_color || null;
    if (dto.email_logo_url !== undefined) entity.entEmailLogoUrl = dto.email_logo_url || null;

    const saved = await this.entityRepo.save(entity);
    return EntityMapper.toResponse(saved);
  }

  async assignUserRole(entityId: string, dto: AssignEntityRoleRequest): Promise<HrEntityUserRoleResponse> {
    const entity = await this.entityRepo.findOne({ where: { entId: entityId } });
    if (!entity) {
      throw new NotFoundException('Entity not found.');
    }

    // Upsert: update existing role or create new
    let role = await this.roleRepo.findOne({
      where: { entId: entityId, usrId: dto.user_id },
    });

    if (role) {
      role.eurRole = dto.role;
      role.eurStatus = 'ACTIVE';
    } else {
      role = this.roleRepo.create({
        entId: entityId,
        usrId: dto.user_id,
        eurRole: dto.role,
      });
    }

    const saved = await this.roleRepo.save(role);

    // 사용자의 usrCompanyId가 비어있으면 설정
    try {
      const user = await this.userRepo.findOne({ where: { usrId: dto.user_id } });
      if (user && !user.usrCompanyId) {
        user.usrCompanyId = entityId;
        await this.userRepo.save(user);
        this.logger.log(`Set usrCompanyId=${entityId} for user ${dto.user_id}`);
      }

      // 해당 사용자의 PENDING 초대가 있으면 자동 ACCEPTED 처리
      if (user) {
        const pendingInvitations = await this.invitationRepo.find({
          where: { invEmail: user.usrEmail, invCompanyId: entityId, invStatus: 'PENDING' },
        });
        for (const inv of pendingInvitations) {
          inv.invStatus = 'ACCEPTED';
          inv.invAcceptedAt = new Date();
          await this.invitationRepo.save(inv);
          this.logger.log(`Auto-accepted invitation ${inv.invId} for ${user.usrEmail}`);
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to sync user/invitation on role assignment: ${err.message}`);
    }

    return EntityMapper.toUserRoleResponse(saved);
  }

  async getEntityRoles(entityId: string): Promise<HrEntityUserRoleResponse[]> {
    const roles = await this.roleRepo.find({
      where: { entId: entityId },
      order: { eurCreatedAt: 'ASC' },
    });
    return roles.map(EntityMapper.toUserRoleResponse);
  }

  async getUserEntityRole(userId: string, entityId: string): Promise<EntityUserRoleEntity | null> {
    return this.roleRepo.findOne({
      where: { usrId: userId, entId: entityId, eurStatus: 'ACTIVE' },
    });
  }

  async getEntityByIdRaw(id: string): Promise<HrEntityEntity | null> {
    return this.entityRepo.findOne({ where: { entId: id } });
  }

  async updateStampImage(id: string, image: Buffer | null): Promise<void> {
    const entity = await this.entityRepo.findOne({ where: { entId: id } });
    if (!entity) throw new NotFoundException('Entity not found');
    entity.entStampImage = image as any;
    await this.entityRepo.save(entity);
  }

  async getStampImage(id: string): Promise<Buffer | null> {
    const entity = await this.entityRepo.findOne({ where: { entId: id } });
    if (!entity) throw new NotFoundException('Entity not found');
    return entity.entStampImage || null;
  }
}
