import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../../project/entity/project.entity';
import { ProjectClientEntity } from '../../project/entity/project-client.entity';
import { ProjectMemberEntity } from '../../project/entity/project-member.entity';

@Injectable()
export class ClientProjectService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(ProjectClientEntity)
    private readonly projectClientRepository: Repository<ProjectClientEntity>,
    @InjectRepository(ProjectMemberEntity)
    private readonly projectMemberRepository: Repository<ProjectMemberEntity>,
  ) {}

  /**
   * 고객사에 배정된 프로젝트 목록
   */
  async findClientProjects(cliId: string, query?: { status?: string; search?: string; page?: number; size?: number }) {
    const page = query?.page || 1;
    const size = query?.size || 20;

    const qb = this.projectRepository.createQueryBuilder('p')
      .innerJoin(ProjectClientEntity, 'pc', 'pc.pjt_id = p.pjt_id AND pc.cli_id = :cliId AND pc.pcl_status = :pclStatus', {
        cliId,
        pclStatus: 'ACTIVE',
      })
      .leftJoinAndSelect('p.manager', 'manager')
      .addSelect(sub =>
        sub.select('COUNT(*)', 'count')
          .from('amb_issues', 'i')
          .where('i.pjt_id = p.pjt_id AND i.iss_deleted_at IS NULL'),
        'issueCount',
      )
      .addSelect(sub =>
        sub.select('COUNT(*)', 'count')
          .from('amb_issues', 'i')
          .where("i.pjt_id = p.pjt_id AND i.iss_deleted_at IS NULL AND i.iss_status NOT IN ('CLOSED', 'REJECTED')"),
        'openIssueCount',
      );

    if (query?.status) {
      qb.andWhere('p.pjtStatus = :status', { status: query.status });
    }

    if (query?.search) {
      qb.andWhere('(p.pjtName ILIKE :search OR p.pjtCode ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('p.pjtCreatedAt', 'DESC');
    qb.skip((page - 1) * size).take(size);

    const { raw, entities } = await qb.getRawAndEntities();

    const data = entities.map((p, i) => ({
      projectId: p.pjtId,
      code: p.pjtCode,
      name: p.pjtName,
      status: p.pjtStatus,
      category: p.pjtCategory,
      startDate: p.pjtStartDate,
      endDate: p.pjtEndDate,
      managerName: p.manager?.usrName || null,
      issueCount: parseInt(raw[i]?.issueCount || '0', 10),
      openIssueCount: parseInt(raw[i]?.openIssueCount || '0', 10),
    }));

    const total = await qb.getCount();

    return {
      data,
      pagination: { page, size, total, totalPages: Math.ceil(total / size) },
    };
  }

  /**
   * 프로젝트 상세 (고객 뷰)
   */
  async findClientProjectById(projectId: string, cliId: string) {
    // 접근 권한 확인
    const link = await this.projectClientRepository.findOne({
      where: { pjtId: projectId, cliId, pclStatus: 'ACTIVE' },
    });
    if (!link) {
      throw new ForbiddenException('No access to this project');
    }

    const project = await this.projectRepository.findOne({
      where: { pjtId: projectId },
      relations: ['manager'],
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      projectId: project.pjtId,
      code: project.pjtCode,
      name: project.pjtName,
      description: project.pjtSummary || null,
      status: project.pjtStatus,
      category: project.pjtCategory,
      priority: project.pjtPriority,
      startDate: project.pjtStartDate,
      endDate: project.pjtEndDate,
      managerName: project.manager?.usrName || null,
    };
  }

  /**
   * 프로젝트 접근 권한 확인
   */
  async verifyClientAccess(projectId: string, cliId: string): Promise<boolean> {
    const link = await this.projectClientRepository.findOne({
      where: { pjtId: projectId, cliId, pclStatus: 'ACTIVE' },
    });
    return !!link;
  }

  /**
   * 프로젝트 멤버(내부 직원) 목록 조회
   */
  async findProjectMembers(projectId: string, cliId: string) {
    // 접근 권한 확인
    const link = await this.projectClientRepository.findOne({
      where: { pjtId: projectId, cliId, pclStatus: 'ACTIVE' },
    });
    if (!link) {
      throw new ForbiddenException('No access to this project');
    }

    const members = await this.projectMemberRepository.find({
      where: { pjtId: projectId, pmbIsActive: true },
      relations: ['user'],
      order: { pmbJoinedAt: 'ASC' },
    });

    return members.map(m => ({
      userId: m.usrId,
      name: m.user?.usrName || null,
      email: m.user?.usrEmail || null,
      role: m.pmbRole,
    }));
  }
}
