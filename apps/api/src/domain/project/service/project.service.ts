import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { ProjectEntity } from '../entity/project.entity';
import { CreateProjectRequest } from '../dto/request/create-project.request';
import { UpdateProjectRequest } from '../dto/request/update-project.request';
import { ProjectMapper } from '../mapper/project.mapper';
import { ProjectAiService } from './project-ai.service';
import { WorkItemService } from '../../acl/service/work-item.service';
import { TagExtractionService } from '../../kms/service/tag-extraction.service';
import { ProjectResponse } from '@amb/types';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['REVIEW', 'CANCELLED'],
  REVIEW: ['APPROVED', 'REJECTED', 'SUBMITTED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  REJECTED: ['DRAFT', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    private readonly projectAiService: ProjectAiService,
    private readonly workItemService: WorkItemService,
    private readonly tagExtractionService: TagExtractionService,
  ) {}

  async findAll(
    entityId: string,
    query?: { status?: string; category?: string; priority?: string; search?: string; entity_id?: string; sort?: string; scope?: string; page?: number; size?: number },
    userId?: string,
  ) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query?.size) || 50));

    const qb = this.projectRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.proposer', 'proposer')
      .leftJoinAndSelect('p.manager', 'manager')
      .leftJoinAndSelect('p.hrEntity', 'entity')
      .addSelect(
        (subQuery) => subQuery
          .select('COUNT(*)')
          .from('amb_issues', 'ic')
          .where('ic.pjt_id = p.pjt_id')
          .andWhere('ic.iss_deleted_at IS NULL'),
        'issueCount'
      )
      .addSelect(
        (subQuery) => subQuery
          .select('COUNT(*)')
          .from('amb_issues', 'io')
          .where('io.pjt_id = p.pjt_id')
          .andWhere('io.iss_deleted_at IS NULL')
          .andWhere("io.iss_status NOT IN ('CLOSED', 'REJECTED')"),
        'openIssueCount'
      )
      .addSelect(
        (subQuery) => subQuery
          .select('COUNT(*)')
          .from('kms_project_members', 'mc')
          .where('mc.pjt_id = p.pjt_id')
          .andWhere('mc.pmb_is_active = true'),
        'memberCount'
      );

    // 정렬 기준
    const sort = query?.sort;
    if (sort === 'most_issues') {
      // 이슈 많은 프로젝트
      qb.orderBy('p.pjtCreatedAt', 'DESC');
    } else if (sort === 'latest_issue') {
      // 최근 이슈가 등록된 프로젝트
      qb.addSelect(
        (subQuery) => subQuery
          .select('MAX(il.iss_created_at)')
          .from('amb_issues', 'il')
          .where('il.pjt_id = p.pjt_id')
          .andWhere('il.iss_deleted_at IS NULL'),
        'latestIssueAt'
      );
      qb.orderBy('p.pjtCreatedAt', 'DESC');
    } else {
      // 기본: 최근 등록된 프로젝트
      qb.orderBy('p.pjtCreatedAt', 'DESC');
    }

    // 법인 필터: 필수 적용
    qb.andWhere('p.entId = :entityId', { entityId });

    // scope=mine: 내가 멤버인 프로젝트만
    if (query?.scope === 'mine' && userId) {
      qb.andWhere(
        `p.pjt_id IN (SELECT pm.pjt_id FROM kms_project_members pm WHERE pm.usr_id = :userId AND pm.pmb_is_active = true)`,
        { userId },
      );
    }

    if (query?.status) qb.andWhere('p.pjtStatus = :status', { status: query.status });
    if (query?.category) qb.andWhere('p.pjtCategory = :category', { category: query.category });
    if (query?.priority) qb.andWhere('p.pjtPriority = :priority', { priority: query.priority });
    if (query?.search) {
      qb.andWhere('(p.pjtName ILIKE :search OR p.pjtCode ILIKE :search OR p.pjtTitle ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.skip((page - 1) * size).take(size);
    const { entities: projects, raw } = await qb.getRawAndEntities();
    const totalCount = await qb.getCount();
    const totalPages = Math.ceil(totalCount / size);

    // 서브쿼리 결과를 엔티티에 매핑
    const data = projects.map((project, idx) => {
      (project as any).issueCount = Number(raw[idx]?.issueCount) || 0;
      (project as any).openIssueCount = Number(raw[idx]?.openIssueCount) || 0;
      (project as any).memberCount = Number(raw[idx]?.memberCount) || 0;
      return ProjectMapper.toResponse(project);
    });

    // 정렬 후처리 (TypeORM orderBy가 서브쿼리 alias 정렬 미지원)
    if (sort === 'most_issues') {
      data.sort((a, b) => b.issueCount - a.issueCount);
    } else if (sort === 'latest_issue') {
      const latestMap = new Map<string, string | null>();
      projects.forEach((p, idx) => {
        latestMap.set(p.pjtId, raw[idx]?.latestIssueAt || null);
      });
      data.sort((a, b) => {
        const aTime = latestMap.get(a.projectId);
        const bTime = latestMap.get(b.projectId);
        if (!aTime && !bTime) return 0;
        if (!aTime) return 1;
        if (!bTime) return -1;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    }
    return {
      data,
      pagination: { page, size, totalCount, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    };
  }

  async findById(id: string, entityId?: string): Promise<ProjectResponse> {
    const where: any = { pjtId: id };
    if (entityId) where.entId = entityId;
    const project = await this.projectRepo.findOne({
      where,
      relations: ['proposer', 'manager', 'sponsor', 'members', 'members.user', 'reviews', 'reviews.reviewer', 'files', 'hrEntity'],
      order: { reviews: { prvCreatedAt: 'DESC' } },
    });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }
    return ProjectMapper.toResponse(project);
  }

  async create(dto: CreateProjectRequest, userId: string, entityId: string): Promise<ProjectResponse> {
    const code = await this.generateProjectCode(entityId);

    const project = this.projectRepo.create({
      entId: entityId,
      pjtCode: code,
      pjtName: dto.name,
      pjtTitle: dto.title || undefined,
      pjtPurpose: dto.purpose || undefined,
      pjtGoal: dto.goal || undefined,
      pjtSummary: dto.summary || undefined,
      pjtCategory: dto.category || undefined,
      pjtPriority: dto.priority || 'MEDIUM',
      pjtProposerId: userId,
      pjtManagerId: dto.manager_id || undefined,
      pjtSponsorId: dto.sponsor_id || undefined,
      pjtDeptId: dto.dept_id || undefined,
      pjtStartDate: dto.start_date || undefined,
      pjtEndDate: dto.end_date || undefined,
      pjtBudget: dto.budget || undefined,
      pjtCurrency: dto.currency || 'USD',
      pjtContractId: dto.contract_id || undefined,
      pjtNote: dto.note || undefined,
      pjtAiDraftJson: dto.ai_draft_json || undefined,
      pjtAiAnalysisJson: dto.ai_analysis_json || undefined,
    } as DeepPartial<ProjectEntity>);

    const saved: ProjectEntity = await this.projectRepo.save(project as ProjectEntity);

    // Create WorkItem for ACL
    try {
      const workItem = await this.workItemService.createInternalWorkItem({
        entityId,
        type: 'DOC',
        title: `Project: ${dto.name}`,
        ownerId: userId,
        visibility: 'ENTITY',
        module: 'project',
        refId: saved.pjtId,
        content: dto.summary || dto.name,
      });
      saved.pjtWitId = workItem.witId;
      await this.projectRepo.save(saved);

      // Auto-tag via KMS
      if (dto.summary || dto.purpose) {
        this.tagExtractionService.extractAndAssign({
          entityId,
          workItemId: workItem.witId,
          content: [dto.purpose, dto.goal, dto.summary].filter(Boolean).join('\n'),
          title: dto.name,
        }).catch(() => {});
      }
    } catch {
      // WorkItem creation is non-critical
    }

    return this.findById(saved.pjtId);
  }

  async update(id: string, dto: UpdateProjectRequest, entityId: string): Promise<ProjectResponse> {
    const project = await this.projectRepo.findOne({
      where: { pjtId: id, entId: entityId },
    });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    if (dto.status && dto.status !== project.pjtStatus) {
      const allowed = VALID_TRANSITIONS[project.pjtStatus] || [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(ERROR_CODE.PROJECT_INVALID_TRANSITION.message);
      }
      project.pjtStatus = dto.status;

      if (dto.status === 'APPROVED') project.pjtApprovedAt = new Date();
      if (dto.status === 'REJECTED') project.pjtRejectedAt = new Date();
    }

    if (dto.name !== undefined) project.pjtName = dto.name;
    if (dto.title !== undefined) project.pjtTitle = dto.title;
    if (dto.purpose !== undefined) project.pjtPurpose = dto.purpose;
    if (dto.goal !== undefined) project.pjtGoal = dto.goal;
    if (dto.summary !== undefined) project.pjtSummary = dto.summary;
    if (dto.category !== undefined) project.pjtCategory = dto.category;
    if (dto.priority !== undefined) project.pjtPriority = dto.priority;
    if (dto.proposer_id !== undefined) project.pjtProposerId = dto.proposer_id;
    if (dto.manager_id !== undefined) project.pjtManagerId = dto.manager_id;
    if (dto.sponsor_id !== undefined) project.pjtSponsorId = dto.sponsor_id;
    if (dto.dept_id !== undefined) project.pjtDeptId = dto.dept_id;
    if (dto.start_date !== undefined) project.pjtStartDate = dto.start_date;
    if (dto.end_date !== undefined) project.pjtEndDate = dto.end_date;
    if (dto.budget !== undefined) project.pjtBudget = dto.budget;
    if (dto.currency !== undefined) project.pjtCurrency = dto.currency;
    if (dto.contract_id !== undefined) project.pjtContractId = dto.contract_id;
    if (dto.note !== undefined) project.pjtNote = dto.note;

    await this.projectRepo.save(project);
    return this.findById(id);
  }

  async delete(id: string, entityId: string): Promise<void> {
    const project = await this.projectRepo.findOne({ where: { pjtId: id, entId: entityId } });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }
    await this.projectRepo.softRemove(project);
  }

  async submitProposal(id: string, entityId: string, userId: string): Promise<ProjectResponse> {
    const project = await this.projectRepo.findOne({ where: { pjtId: id, entId: entityId } });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }
    if (project.pjtStatus !== 'DRAFT' && project.pjtStatus !== 'REJECTED') {
      throw new BadRequestException(ERROR_CODE.PROJECT_NOT_DRAFT.message);
    }

    project.pjtStatus = 'SUBMITTED';
    project.pjtSubmittedAt = new Date();
    await this.projectRepo.save(project);

    return this.findById(id);
  }

  async approveProject(id: string, entityId: string, reviewerId: string, comment?: string): Promise<ProjectResponse> {
    const project = await this.projectRepo.findOne({ where: { pjtId: id, entId: entityId } });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    const allowed = VALID_TRANSITIONS[project.pjtStatus] || [];
    if (!allowed.includes('APPROVED')) {
      // SUBMITTED → REVIEW → APPROVED 자동 전환
      if (project.pjtStatus === 'SUBMITTED' && VALID_TRANSITIONS['SUBMITTED'].includes('REVIEW')) {
        project.pjtStatus = 'APPROVED';
      } else {
        throw new BadRequestException(ERROR_CODE.PROJECT_INVALID_TRANSITION.message);
      }
    } else {
      project.pjtStatus = 'APPROVED';
    }

    project.pjtApprovedAt = new Date();
    await this.projectRepo.save(project);

    return this.findById(id);
  }

  async rejectProject(id: string, entityId: string, reviewerId: string, reason?: string): Promise<ProjectResponse> {
    const project = await this.projectRepo.findOne({ where: { pjtId: id, entId: entityId } });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    const allowed = VALID_TRANSITIONS[project.pjtStatus] || [];
    if (!allowed.includes('REJECTED')) {
      throw new BadRequestException(ERROR_CODE.PROJECT_INVALID_TRANSITION.message);
    }

    project.pjtStatus = 'REJECTED';
    project.pjtRejectedAt = new Date();
    await this.projectRepo.save(project);

    return this.findById(id);
  }

  async findSimilar(id: string, entityId: string) {
    const project = await this.projectRepo.findOne({ where: { pjtId: id, entId: entityId } });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    const existingProjects = await this.projectRepo.find({
      where: { entId: entityId },
      select: ['pjtId', 'pjtName', 'pjtSummary', 'pjtCategory'],
    });

    const others = existingProjects
      .filter((p) => p.pjtId !== id)
      .map((p) => ({
        id: p.pjtId,
        name: p.pjtName,
        summary: p.pjtSummary || '',
        category: p.pjtCategory || '',
      }));

    const similar = await this.projectAiService.findSimilarProjects(
      project.pjtName,
      project.pjtSummary || project.pjtName,
      others,
    );

    project.pjtSimilarProjectsJson = JSON.stringify(similar);
    await this.projectRepo.save(project);

    return similar;
  }

  private async generateProjectCode(entityId: string): Promise<string> {
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `PJ-${yyyymm}-`;

    const latest = await this.projectRepo
      .createQueryBuilder('p')
      .where('p.entId = :entityId', { entityId })
      .andWhere('p.pjtCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('p.pjtCode', 'DESC')
      .getOne();

    let seq = 1;
    if (latest) {
      const lastSeq = parseInt(latest.pjtCode.replace(prefix, ''), 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(3, '0')}`;
  }
}
