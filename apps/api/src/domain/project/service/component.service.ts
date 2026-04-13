import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectComponentEntity } from '../entity/project-component.entity';
import { ProjectEntity } from '../entity/project.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { CreateComponentRequest } from '../dto/request/create-component.request';
import { UpdateComponentRequest } from '../dto/request/update-component.request';
import { ComponentMapper } from '../mapper/component.mapper';
import { ProjectComponentResponse } from '@amb/types';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class ComponentService {
  constructor(
    @InjectRepository(ProjectComponentEntity)
    private readonly componentRepo: Repository<ProjectComponentEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
  ) {}

  async create(projectId: string, dto: CreateComponentRequest, userId: string, entityId: string): Promise<ProjectComponentResponse> {
    const project = await this.projectRepo.findOne({ where: { pjtId: projectId, entId: entityId } });
    if (!project) {
      throw new BusinessException(ERROR_CODE.PROJECT_NOT_FOUND.code, ERROR_CODE.PROJECT_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    const component = this.componentRepo.create({
      entId: entityId,
      pjtId: projectId,
      cmpTitle: dto.title,
      cmpDescription: dto.description || null,
      cmpColor: dto.color || null,
      cmpOwnerId: dto.owner_id || null,
      cmpCreatedBy: userId,
    });

    const saved = await this.componentRepo.save(component);
    const loaded = await this.componentRepo.findOne({
      where: { cmpId: saved.cmpId },
      relations: ['createdByUser', 'owner'],
    });

    return ComponentMapper.toResponse(loaded!);
  }

  async findAll(projectId: string, entityId: string): Promise<ProjectComponentResponse[]> {
    const components = await this.componentRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.createdByUser', 'u')
      .leftJoinAndSelect('c.owner', 'o')
      .where('c.pjtId = :projectId', { projectId })
      .andWhere('c.entId = :entityId', { entityId })
      .orderBy('c.cmpCreatedAt', 'ASC')
      .getMany();

    const cmpIds = components.map(c => c.cmpId);
    if (cmpIds.length === 0) return components.map(c => ComponentMapper.toResponse(c));

    const issueCounts = await this.issueRepo.createQueryBuilder('i')
      .select('i.cmpId', 'cmpId')
      .addSelect('COUNT(*)', 'total')
      .where('i.cmpId IN (:...cmpIds)', { cmpIds })
      .andWhere('i.issDeletedAt IS NULL')
      .groupBy('i.cmpId')
      .getRawMany();

    const countMap = new Map(issueCounts.map(r => [r.cmpId, Number(r.total)]));

    return components.map(c => ComponentMapper.toResponse(c, countMap.get(c.cmpId) || 0));
  }

  async findById(componentId: string, entityId: string): Promise<ProjectComponentResponse> {
    const component = await this.componentRepo.findOne({
      where: { cmpId: componentId, entId: entityId },
      relations: ['createdByUser', 'owner'],
    });
    if (!component) {
      throw new BusinessException(ERROR_CODE.COMPONENT_NOT_FOUND.code, ERROR_CODE.COMPONENT_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    const count = await this.issueRepo.count({ where: { cmpId: componentId, issDeletedAt: undefined as any } });

    return ComponentMapper.toResponse(component, count);
  }

  async update(componentId: string, dto: UpdateComponentRequest, entityId: string): Promise<ProjectComponentResponse> {
    const component = await this.componentRepo.findOne({
      where: { cmpId: componentId, entId: entityId },
      relations: ['createdByUser', 'owner'],
    });
    if (!component) {
      throw new BusinessException(ERROR_CODE.COMPONENT_NOT_FOUND.code, ERROR_CODE.COMPONENT_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    if (dto.title !== undefined) component.cmpTitle = dto.title;
    if (dto.description !== undefined) component.cmpDescription = dto.description;
    if (dto.color !== undefined) component.cmpColor = dto.color;
    if (dto.owner_id !== undefined) component.cmpOwnerId = dto.owner_id;

    await this.componentRepo.save(component);

    return this.findById(componentId, entityId);
  }

  async remove(componentId: string, entityId: string): Promise<void> {
    const component = await this.componentRepo.findOne({
      where: { cmpId: componentId, entId: entityId },
    });
    if (!component) {
      throw new BusinessException(ERROR_CODE.COMPONENT_NOT_FOUND.code, ERROR_CODE.COMPONENT_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    // 소속 이슈의 cmp_id → NULL (미지정 그룹으로)
    await this.issueRepo.createQueryBuilder()
      .update(IssueEntity)
      .set({ cmpId: null as any })
      .where('cmpId = :componentId', { componentId })
      .execute();

    await this.componentRepo.softDelete(componentId);
  }
}
