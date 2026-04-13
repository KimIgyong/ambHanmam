import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMemberEntity } from '../entity/project-member.entity';
import { ProjectEntity } from '../entity/project.entity';
import { AddProjectMemberRequest } from '../dto/request/add-project-member.request';
import { ProjectMapper } from '../mapper/project.mapper';
import { ProjectMemberResponse } from '@amb/types';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class ProjectMemberService {
  constructor(
    @InjectRepository(ProjectMemberEntity)
    private readonly memberRepo: Repository<ProjectMemberEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  async findByProject(projectId: string, entityId?: string): Promise<ProjectMemberResponse[]> {
    const where: any = { pjtId: projectId };
    if (entityId) where.entId = entityId;
    const project = await this.projectRepo.findOne({ where });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    const members = await this.memberRepo.find({
      where: { pjtId: projectId },
      relations: ['user'],
      order: { pmbCreatedAt: 'ASC' },
    });

    return members.map(ProjectMapper.toMemberResponse);
  }

  async addMember(
    projectId: string,
    dto: AddProjectMemberRequest,
    entityId?: string,
  ): Promise<ProjectMemberResponse> {
    const where: any = { pjtId: projectId };
    if (entityId) where.entId = entityId;
    const project = await this.projectRepo.findOne({ where });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    const existing = await this.memberRepo.findOne({
      where: { pjtId: projectId, usrId: dto.user_id },
      relations: ['user'],
    });

    if (existing) {
      if (existing.pmbIsActive) {
        throw new BadRequestException(ERROR_CODE.PROJECT_MEMBER_DUPLICATE.message);
      }
      // 비활성 멤버 재활성화
      existing.pmbIsActive = true;
      existing.pmbRole = dto.role;
      existing.pmbJoinedAt = new Date();
      existing.pmbLeftAt = null as any;
      await this.memberRepo.save(existing);
      return ProjectMapper.toMemberResponse(existing);
    }

    const member = this.memberRepo.create({
      pjtId: projectId,
      usrId: dto.user_id,
      pmbRole: dto.role,
    });

    const saved = await this.memberRepo.save(member);
    const loaded = await this.memberRepo.findOne({
      where: { pmbId: saved.pmbId },
      relations: ['user'],
    });

    return ProjectMapper.toMemberResponse(loaded!);
  }

  async updateRole(
    projectId: string,
    memberId: string,
    role: string,
    entityId?: string,
  ): Promise<ProjectMemberResponse> {
    const where: any = { pjtId: projectId };
    if (entityId) where.entId = entityId;
    const project = await this.projectRepo.findOne({ where });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    const member = await this.memberRepo.findOne({
      where: { pmbId: memberId, pjtId: projectId },
      relations: ['user'],
    });
    if (!member) {
      throw new NotFoundException(ERROR_CODE.PROJECT_MEMBER_NOT_FOUND.message);
    }

    member.pmbRole = role;
    await this.memberRepo.save(member);

    return ProjectMapper.toMemberResponse(member);
  }

  async removeMember(
    projectId: string,
    memberId: string,
    entityId?: string,
  ): Promise<void> {
    const where: any = { pjtId: projectId };
    if (entityId) where.entId = entityId;
    const project = await this.projectRepo.findOne({ where });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    const member = await this.memberRepo.findOne({
      where: { pmbId: memberId, pjtId: projectId },
    });
    if (!member) {
      throw new NotFoundException(ERROR_CODE.PROJECT_MEMBER_NOT_FOUND.message);
    }

    member.pmbIsActive = false;
    member.pmbLeftAt = new Date();
    await this.memberRepo.save(member);
  }
}
