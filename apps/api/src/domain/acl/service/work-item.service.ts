import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { WorkItemEntity } from '../entity/work-item.entity';
import { AccessControlService } from './access-control.service';
import { CreateWorkItemRequest } from '../dto/request/create-work-item.request';
import { UpdateWorkItemRequest } from '../dto/request/update-work-item.request';
import { WorkItemMapper } from '../mapper/work-item.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { WorkItemResponse } from '@amb/types';

@Injectable()
export class WorkItemService {
  constructor(
    @InjectRepository(WorkItemEntity)
    private readonly workItemRepository: Repository<WorkItemEntity>,
    private readonly accessControlService: AccessControlService,
  ) {}

  async createWorkItem(
    dto: CreateWorkItemRequest,
    userId: string,
    entityId: string,
  ): Promise<WorkItemResponse> {
    const entity = this.workItemRepository.create({
      entId: entityId,
      witType: dto.type,
      witTitle: dto.title,
      witOwnerId: userId,
      witVisibility: dto.visibility || 'PRIVATE',
      witModule: dto.module || undefined,
      witRefId: dto.ref_id || undefined,
      witContent: dto.content || undefined,
    } as DeepPartial<WorkItemEntity>);

    const saved: WorkItemEntity = await this.workItemRepository.save(entity as WorkItemEntity);
    const loaded = await this.workItemRepository.findOne({
      where: { witId: saved.witId },
      relations: ['owner'],
    });
    return WorkItemMapper.toResponse(loaded!);
  }

  async getWorkItem(id: string, userId: string, userRole: string): Promise<WorkItemResponse> {
    const access = await this.accessControlService.canAccess(userId, id, userRole);
    if (!access.allowed) {
      throw new ForbiddenException(ERROR_CODE.WORK_ITEM_ACCESS_DENIED.message);
    }

    const entity = await this.workItemRepository.findOne({
      where: { witId: id },
      relations: ['owner'],
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.WORK_ITEM_NOT_FOUND.message);
    }

    return WorkItemMapper.toResponse(entity);
  }

  async updateWorkItem(
    id: string,
    dto: UpdateWorkItemRequest,
    userId: string,
    userRole: string,
  ): Promise<WorkItemResponse> {
    const access = await this.accessControlService.canAccess(userId, id, userRole);
    if (!access.allowed || (access.permission !== 'ADMIN' && access.permission !== 'EDIT')) {
      throw new ForbiddenException(ERROR_CODE.WORK_ITEM_ACCESS_DENIED.message);
    }

    const entity = await this.workItemRepository.findOne({
      where: { witId: id },
      relations: ['owner'],
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.WORK_ITEM_NOT_FOUND.message);
    }

    if (dto.title !== undefined) entity.witTitle = dto.title;
    if (dto.visibility !== undefined) entity.witVisibility = dto.visibility;
    if (dto.content !== undefined) entity.witContent = dto.content;

    const saved = await this.workItemRepository.save(entity);
    return WorkItemMapper.toResponse(saved);
  }

  async deleteWorkItem(id: string, userId: string, userRole: string): Promise<void> {
    const access = await this.accessControlService.canAccess(userId, id, userRole);
    if (!access.allowed || access.permission !== 'ADMIN') {
      throw new ForbiddenException(ERROR_CODE.WORK_ITEM_ACCESS_DENIED.message);
    }

    const entity = await this.workItemRepository.findOne({
      where: { witId: id },
    });

    if (!entity) {
      throw new NotFoundException(ERROR_CODE.WORK_ITEM_NOT_FOUND.message);
    }

    await this.workItemRepository.softRemove(entity);
  }

  async getMyWorkItems(
    userId: string,
    userRole: string,
    filters: {
      type?: string;
      visibility?: string;
      scope?: 'MY' | 'SHARED' | 'TEAM' | 'ALL';
      search?: string;
    },
    page = 1,
    limit = 20,
    entityId?: string,
  ): Promise<{ items: WorkItemResponse[]; total: number; page: number; limit: number }> {
    const { items, total } = await this.accessControlService.getVisibleItems(
      userId, userRole, filters, page, limit, entityId,
    );

    return {
      items: items.map(WorkItemMapper.toResponse),
      total,
      page,
      limit,
    };
  }

  /**
   * Create a work item internally (used by other modules like Todo, MeetingNotes)
   */
  async createInternalWorkItem(params: {
    entityId: string;
    type: string;
    title: string;
    ownerId: string;
    visibility: string;
    module: string;
    refId: string;
    content?: string;
  }): Promise<WorkItemEntity> {
    const entity = this.workItemRepository.create({
      entId: params.entityId,
      witType: params.type,
      witTitle: params.title,
      witOwnerId: params.ownerId,
      witVisibility: params.visibility,
      witModule: params.module,
      witRefId: params.refId,
      witContent: params.content || undefined,
    } as DeepPartial<WorkItemEntity>);

    return this.workItemRepository.save(entity as WorkItemEntity);
  }
}
