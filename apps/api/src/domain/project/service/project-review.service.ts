import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { ProjectReviewEntity } from '../entity/project-review.entity';
import { ProjectEntity } from '../entity/project.entity';
import { ReviewProjectRequest } from '../dto/request/review-project.request';
import { ProjectMapper } from '../mapper/project.mapper';
import { ProjectAiService } from './project-ai.service';
import { ProjectReviewResponse } from '@amb/types';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class ProjectReviewService {
  constructor(
    @InjectRepository(ProjectReviewEntity)
    private readonly reviewRepo: Repository<ProjectReviewEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    private readonly projectAiService: ProjectAiService,
  ) {}

  async getHistory(projectId: string, entityId: string): Promise<ProjectReviewResponse[]> {
    const project = await this.projectRepo.findOne({ where: { pjtId: projectId, entId: entityId } });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    const reviews = await this.reviewRepo.find({
      where: { pjtId: projectId },
      relations: ['reviewer'],
      order: { prvCreatedAt: 'DESC' },
    });

    return reviews.map(ProjectMapper.toReviewResponse);
  }

  async generatePreAnalysis(projectId: string, entityId: string) {
    const project = await this.projectRepo.findOne({ where: { pjtId: projectId, entId: entityId } });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    try {
      const analysis = await this.projectAiService.generatePreAnalysis(
        project.pjtName,
        project.pjtPurpose || '',
        project.pjtGoal || '',
        project.pjtSummary || '',
        project.pjtBudget ? Number(project.pjtBudget) : undefined,
      );

      project.pjtAiAnalysisJson = JSON.stringify(analysis);
      await this.projectRepo.save(project);

      return analysis;
    } catch (error) {
      throw new BadRequestException(ERROR_CODE.PROJECT_AI_ANALYSIS_FAILED.message);
    }
  }

  async getRecommendation(projectId: string, entityId: string) {
    const project = await this.projectRepo.findOne({ where: { pjtId: projectId, entId: entityId } });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    const preAnalysis = project.pjtAiAnalysisJson ? JSON.parse(project.pjtAiAnalysisJson) : null;
    if (!preAnalysis) {
      throw new BadRequestException('Pre-analysis must be generated first.');
    }

    const reviews = await this.reviewRepo.find({
      where: { pjtId: projectId },
      order: { prvCreatedAt: 'ASC' },
    });

    const reviewHistory = reviews.map((r) => ({
      action: r.prvAction,
      comment: r.prvComment || '',
      step: r.prvStep,
    }));

    return this.projectAiService.generateRecommendation(
      project.pjtName,
      project.pjtSummary || '',
      preAnalysis,
      reviewHistory,
    );
  }

  async performAction(
    projectId: string,
    dto: ReviewProjectRequest,
    reviewerId: string,
    entityId: string,
  ): Promise<ProjectReviewResponse> {
    const project = await this.projectRepo.findOne({ where: { pjtId: projectId, entId: entityId } });
    if (!project) {
      throw new NotFoundException(ERROR_CODE.PROJECT_NOT_FOUND.message);
    }

    const step = dto.step || 1;
    const previousStatus = project.pjtStatus;
    let newStatus = previousStatus;

    if (dto.action === 'COMMENT') {
      // COMMENT does not change status
      newStatus = previousStatus;
    } else if (dto.action === 'APPROVE') {
      if (previousStatus === 'SUBMITTED') {
        newStatus = 'REVIEW'; // Step 1: move to REVIEW
      } else if (previousStatus === 'REVIEW') {
        if (step >= 2) {
          newStatus = 'APPROVED'; // Step 2 approval → APPROVED
          project.pjtApprovedAt = new Date();
        }
        // Step 1 in REVIEW → stays in REVIEW
      } else {
        throw new BadRequestException(ERROR_CODE.PROJECT_REVIEW_NOT_ALLOWED.message);
      }
    } else if (dto.action === 'REJECT') {
      if (previousStatus !== 'SUBMITTED' && previousStatus !== 'REVIEW') {
        throw new BadRequestException(ERROR_CODE.PROJECT_REVIEW_NOT_ALLOWED.message);
      }
      newStatus = 'REJECTED';
      project.pjtRejectedAt = new Date();
    } else if (dto.action === 'HOLD') {
      if (previousStatus !== 'REVIEW') {
        throw new BadRequestException(ERROR_CODE.PROJECT_REVIEW_NOT_ALLOWED.message);
      }
      newStatus = 'SUBMITTED'; // Hold → back to SUBMITTED for revision
    }

    project.pjtStatus = newStatus;
    await this.projectRepo.save(project);

    const review = this.reviewRepo.create({
      pjtId: projectId,
      prvReviewerId: reviewerId,
      prvStep: step,
      prvAction: dto.action,
      prvComment: dto.comment || undefined,
      prvPreviousStatus: previousStatus,
      prvNewStatus: newStatus,
      prvAiAnalysisJson: project.pjtAiAnalysisJson || undefined,
    } as DeepPartial<ProjectReviewEntity>);

    const saved: ProjectReviewEntity = await this.reviewRepo.save(review as ProjectReviewEntity);
    const loaded = await this.reviewRepo.findOne({
      where: { prvId: saved.prvId },
      relations: ['reviewer'],
    });

    return ProjectMapper.toReviewResponse(loaded!);
  }
}
