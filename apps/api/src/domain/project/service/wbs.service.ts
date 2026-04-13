import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ProjectEpicEntity } from '../entity/project-epic.entity';
import { ProjectComponentEntity } from '../entity/project-component.entity';
import { ProjectEntity } from '../entity/project.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { EpicMapper } from '../mapper/epic.mapper';
import { ComponentMapper } from '../mapper/component.mapper';
import { IssueMapper } from '../../issues/mapper/issue.mapper';
import { WbsTreeResponse } from '@amb/types';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { UpdateIssueGroupRequest } from '../dto/request/update-issue-group.request';

@Injectable()
export class WbsService {
  constructor(
    @InjectRepository(ProjectEpicEntity)
    private readonly epicRepo: Repository<ProjectEpicEntity>,
    @InjectRepository(ProjectComponentEntity)
    private readonly componentRepo: Repository<ProjectComponentEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
  ) {}

  async getWbsTree(projectId: string, entityId: string, includeClosed = false): Promise<WbsTreeResponse> {
    const project = await this.projectRepo.findOne({ where: { pjtId: projectId, entId: entityId } });
    if (!project) {
      throw new BusinessException(ERROR_CODE.PROJECT_NOT_FOUND.code, ERROR_CODE.PROJECT_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    // Epic 목록 조회
    const epicQb = this.epicRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.createdByUser', 'u')
      .where('e.pjtId = :projectId', { projectId })
      .andWhere('e.entId = :entityId', { entityId });

    if (!includeClosed) {
      epicQb.andWhere('e.epcStatus NOT IN (:...closedStatuses)', { closedStatuses: ['DONE', 'CANCELLED'] });
    }
    epicQb.orderBy('e.epcCreatedAt', 'ASC');
    const epics = await epicQb.getMany();

    // Component 목록 조회
    const components = await this.componentRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.createdByUser', 'cu')
      .leftJoinAndSelect('c.owner', 'o')
      .where('c.pjtId = :projectId', { projectId })
      .andWhere('c.entId = :entityId', { entityId })
      .orderBy('c.cmpCreatedAt', 'ASC')
      .getMany();

    // 프로젝트 소속 이슈 전체 조회
    const issues = await this.issueRepo.createQueryBuilder('i')
      .leftJoinAndSelect('i.reporter', 'r')
      .leftJoinAndSelect('i.assignee', 'a')
      .leftJoinAndSelect('i.project', 'p')
      .leftJoinAndSelect('i.parentIssue', 'pi')
      .leftJoinAndSelect('i.epic', 'ep')
      .leftJoinAndSelect('i.component', 'cp')
      .where('i.pjtId = :projectId', { projectId })
      .orderBy('i.issPriority', 'ASC')
      .addOrderBy('i.issCreatedAt', 'DESC')
      .getMany();

    // Epic별 이슈 그룹핑
    const epicIssueMap = new Map<string, IssueEntity[]>();
    const componentIssueMap = new Map<string, IssueEntity[]>();
    const unassignedIssues: IssueEntity[] = [];

    for (const issue of issues) {
      if (issue.epcId) {
        const list = epicIssueMap.get(issue.epcId) || [];
        list.push(issue);
        epicIssueMap.set(issue.epcId, list);
      } else if (issue.cmpId) {
        const list = componentIssueMap.get(issue.cmpId) || [];
        list.push(issue);
        componentIssueMap.set(issue.cmpId, list);
      } else {
        unassignedIssues.push(issue);
      }
    }

    // Epic 응답 조립
    const epicResponses = epics.map(e => {
      const epicIssues = epicIssueMap.get(e.epcId) || [];
      const doneCount = epicIssues.filter(i => ['RESOLVED', 'CLOSED'].includes(i.issStatus)).length;
      return {
        ...EpicMapper.toResponse(e, epicIssues.length, doneCount),
        issues: epicIssues.map(i => IssueMapper.toResponse(i, 0)),
      };
    });

    // Component 응답 조립
    const componentResponses = components.map(c => {
      const cmpIssues = componentIssueMap.get(c.cmpId) || [];
      return {
        ...ComponentMapper.toResponse(c, cmpIssues.length),
        issues: cmpIssues.map(i => IssueMapper.toResponse(i, 0)),
      };
    });

    return {
      projectId: project.pjtId,
      projectTitle: project.pjtName,
      epics: epicResponses,
      components: componentResponses,
      unassigned: {
        issues: unassignedIssues.map(i => IssueMapper.toResponse(i, 0)),
      },
    };
  }

  async updateIssueGroup(
    projectId: string,
    issueId: string,
    dto: UpdateIssueGroupRequest,
    entityId: string,
  ): Promise<void> {
    const issue = await this.issueRepo.findOne({ where: { issId: issueId, pjtId: projectId } });
    if (!issue) {
      throw new BusinessException(ERROR_CODE.ISSUE_NOT_FOUND.code, ERROR_CODE.ISSUE_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    if (dto.group_type === 'epic') {
      if (!dto.group_id) {
        throw new BusinessException(ERROR_CODE.EPIC_NOT_FOUND.code, 'group_id is required for epic type', HttpStatus.BAD_REQUEST);
      }
      const epic = await this.epicRepo.findOne({ where: { epcId: dto.group_id, entId: entityId } });
      if (!epic) {
        throw new BusinessException(ERROR_CODE.EPIC_NOT_FOUND.code, ERROR_CODE.EPIC_NOT_FOUND.message, HttpStatus.NOT_FOUND);
      }
      if (['DONE', 'CANCELLED'].includes(epic.epcStatus)) {
        throw new BusinessException(ERROR_CODE.EPIC_CLOSED.code, ERROR_CODE.EPIC_CLOSED.message, HttpStatus.BAD_REQUEST);
      }
      issue.epcId = dto.group_id;
      issue.cmpId = null;
    } else if (dto.group_type === 'component') {
      if (!dto.group_id) {
        throw new BusinessException(ERROR_CODE.COMPONENT_NOT_FOUND.code, 'group_id is required for component type', HttpStatus.BAD_REQUEST);
      }
      const component = await this.componentRepo.findOne({ where: { cmpId: dto.group_id, entId: entityId } });
      if (!component) {
        throw new BusinessException(ERROR_CODE.COMPONENT_NOT_FOUND.code, ERROR_CODE.COMPONENT_NOT_FOUND.message, HttpStatus.NOT_FOUND);
      }
      issue.cmpId = dto.group_id;
      issue.epcId = null;
    } else {
      // unassigned
      issue.epcId = null;
      issue.cmpId = null;
    }

    await this.issueRepo.save(issue);
  }
}
