import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ProjectEpicEntity } from '../entity/project-epic.entity';
import { ProjectEntity } from '../entity/project.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { CreateEpicRequest } from '../dto/request/create-epic.request';
import { UpdateEpicRequest } from '../dto/request/update-epic.request';
import { EpicMapper } from '../mapper/epic.mapper';
import { ProjectEpicResponse } from '@amb/types';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class EpicService {
  constructor(
    @InjectRepository(ProjectEpicEntity)
    private readonly epicRepo: Repository<ProjectEpicEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
  ) {}

  async create(projectId: string, dto: CreateEpicRequest, userId: string, entityId: string): Promise<ProjectEpicResponse> {
    const project = await this.projectRepo.findOne({ where: { pjtId: projectId, entId: entityId } });
    if (!project) {
      throw new BusinessException(ERROR_CODE.PROJECT_NOT_FOUND.code, ERROR_CODE.PROJECT_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    const epic = this.epicRepo.create({
      entId: entityId,
      pjtId: projectId,
      epcTitle: dto.title,
      epcDescription: dto.description || null,
      epcStatus: dto.status || 'PLANNED',
      epcColor: dto.color || null,
      epcStartDate: dto.start_date || null,
      epcDueDate: dto.due_date || null,
      epcCreatedBy: userId,
    });

    const saved = await this.epicRepo.save(epic);
    const loaded = await this.epicRepo.findOne({
      where: { epcId: saved.epcId },
      relations: ['createdByUser'],
    });

    return EpicMapper.toResponse(loaded!);
  }

  async findAll(projectId: string, entityId: string, includeClosed = false): Promise<ProjectEpicResponse[]> {
    const qb = this.epicRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.createdByUser', 'u')
      .where('e.pjtId = :projectId', { projectId })
      .andWhere('e.entId = :entityId', { entityId });

    if (!includeClosed) {
      qb.andWhere('e.epcStatus NOT IN (:...closedStatuses)', { closedStatuses: ['DONE', 'CANCELLED'] });
    }

    qb.orderBy('e.epcCreatedAt', 'ASC');

    const epics = await qb.getMany();

    const epicIds = epics.map(e => e.epcId);
    if (epicIds.length === 0) return epics.map(e => EpicMapper.toResponse(e));

    const issueCounts = await this.issueRepo.createQueryBuilder('i')
      .select('i.epcId', 'epcId')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN i.issStatus IN (\'RESOLVED\', \'CLOSED\') THEN 1 ELSE 0 END)', 'done')
      .where('i.epcId IN (:...epicIds)', { epicIds })
      .andWhere('i.issDeletedAt IS NULL')
      .groupBy('i.epcId')
      .getRawMany();

    const countMap = new Map(issueCounts.map(r => [r.epcId, { total: Number(r.total), done: Number(r.done) }]));

    return epics.map(e => {
      const counts = countMap.get(e.epcId) || { total: 0, done: 0 };
      return EpicMapper.toResponse(e, counts.total, counts.done);
    });
  }

  async findById(epicId: string, entityId: string): Promise<ProjectEpicResponse> {
    const epic = await this.epicRepo.findOne({
      where: { epcId: epicId, entId: entityId },
      relations: ['createdByUser'],
    });
    if (!epic) {
      throw new BusinessException(ERROR_CODE.EPIC_NOT_FOUND.code, ERROR_CODE.EPIC_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    const counts = await this.issueRepo.createQueryBuilder('i')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN i.issStatus IN (\'RESOLVED\', \'CLOSED\') THEN 1 ELSE 0 END)', 'done')
      .where('i.epcId = :epicId', { epicId })
      .andWhere('i.issDeletedAt IS NULL')
      .getRawOne();

    return EpicMapper.toResponse(epic, Number(counts?.total || 0), Number(counts?.done || 0));
  }

  async update(epicId: string, dto: UpdateEpicRequest, entityId: string): Promise<ProjectEpicResponse> {
    const epic = await this.epicRepo.findOne({
      where: { epcId: epicId, entId: entityId },
      relations: ['createdByUser'],
    });
    if (!epic) {
      throw new BusinessException(ERROR_CODE.EPIC_NOT_FOUND.code, ERROR_CODE.EPIC_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    if (dto.title !== undefined) epic.epcTitle = dto.title;
    if (dto.description !== undefined) epic.epcDescription = dto.description;
    if (dto.status !== undefined) epic.epcStatus = dto.status;
    if (dto.color !== undefined) epic.epcColor = dto.color;
    if (dto.start_date !== undefined) epic.epcStartDate = dto.start_date;
    if (dto.due_date !== undefined) epic.epcDueDate = dto.due_date;

    await this.epicRepo.save(epic);

    return this.findById(epicId, entityId);
  }

  async remove(epicId: string, entityId: string): Promise<void> {
    const epic = await this.epicRepo.findOne({
      where: { epcId: epicId, entId: entityId },
    });
    if (!epic) {
      throw new BusinessException(ERROR_CODE.EPIC_NOT_FOUND.code, ERROR_CODE.EPIC_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    // 소속 이슈의 epc_id → NULL (미지정 그룹으로)
    await this.issueRepo.createQueryBuilder()
      .update(IssueEntity)
      .set({ epcId: null as any })
      .where('epcId = :epicId', { epicId })
      .execute();

    await this.epicRepo.softDelete(epicId);
  }
}
