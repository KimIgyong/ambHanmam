import { ProjectResponse, ProjectMemberResponse, ProjectReviewResponse, ProjectFileResponse } from '@amb/types';
import { ProjectEntity } from '../entity/project.entity';
import { ProjectMemberEntity } from '../entity/project-member.entity';
import { ProjectReviewEntity } from '../entity/project-review.entity';
import { ProjectFileEntity } from '../entity/project-file.entity';

export class ProjectMapper {
  static toResponse(entity: ProjectEntity): ProjectResponse {
    return {
      projectId: entity.pjtId,
      entityId: entity.entId,
      code: entity.pjtCode,
      name: entity.pjtName,
      title: entity.pjtTitle || null,
      purpose: entity.pjtPurpose || null,
      goal: entity.pjtGoal || null,
      summary: entity.pjtSummary || null,
      status: entity.pjtStatus,
      category: entity.pjtCategory || null,
      priority: entity.pjtPriority,
      proposerId: entity.pjtProposerId,
      proposerName: entity.proposer?.usrName || '',
      managerId: entity.pjtManagerId || null,
      managerName: entity.manager?.usrName || null,
      sponsorId: entity.pjtSponsorId || null,
      deptId: entity.pjtDeptId || null,
      startDate: entity.pjtStartDate || null,
      endDate: entity.pjtEndDate || null,
      budget: entity.pjtBudget ? Number(entity.pjtBudget) : null,
      currency: entity.pjtCurrency,
      contractId: entity.pjtContractId || null,
      gdriveFolderId: entity.pjtGdriveFolderId || null,
      aiDraftJson: entity.pjtAiDraftJson || null,
      aiAnalysisJson: entity.pjtAiAnalysisJson || null,
      similarProjectsJson: entity.pjtSimilarProjectsJson || null,
      submittedAt: entity.pjtSubmittedAt?.toISOString() || null,
      approvedAt: entity.pjtApprovedAt?.toISOString() || null,
      rejectedAt: entity.pjtRejectedAt?.toISOString() || null,
      note: entity.pjtNote || null,
      witId: entity.pjtWitId || null,
      entityName: (entity.hrEntity as any)?.entName || '',
      issueCount: (entity as any).issueCount ?? 0,
      openIssueCount: (entity as any).openIssueCount ?? 0,
      memberCount: (entity as any).memberCount ?? 0,
      parentId: entity.pjtParentId || null,
      redmineId: entity.pjtRedmineId || null,
      originalLang: entity.pjtOriginalLang || 'ko',
      members: entity.members?.map(ProjectMapper.toMemberResponse) || undefined,
      reviews: entity.reviews?.map(ProjectMapper.toReviewResponse) || undefined,
      files: entity.files?.map(ProjectMapper.toFileResponse) || undefined,
      createdAt: entity.pjtCreatedAt.toISOString(),
      updatedAt: entity.pjtUpdatedAt.toISOString(),
    };
  }

  static toMemberResponse(entity: ProjectMemberEntity): ProjectMemberResponse {
    return {
      memberId: entity.pmbId,
      projectId: entity.pjtId,
      userId: entity.usrId,
      userName: entity.user?.usrName || '',
      userEmail: entity.user?.usrEmail || '',
      role: entity.pmbRole,
      isActive: entity.pmbIsActive,
      joinedAt: entity.pmbJoinedAt.toISOString(),
      leftAt: entity.pmbLeftAt?.toISOString() || null,
    };
  }

  static toReviewResponse(entity: ProjectReviewEntity): ProjectReviewResponse {
    return {
      reviewId: entity.prvId,
      projectId: entity.pjtId,
      reviewerId: entity.prvReviewerId,
      reviewerName: entity.reviewer?.usrName || '',
      step: entity.prvStep,
      action: entity.prvAction,
      comment: entity.prvComment || null,
      previousStatus: entity.prvPreviousStatus,
      newStatus: entity.prvNewStatus,
      aiAnalysisJson: entity.prvAiAnalysisJson || null,
      createdAt: entity.prvCreatedAt.toISOString(),
    };
  }

  static toFileResponse(entity: ProjectFileEntity): ProjectFileResponse {
    return {
      fileId: entity.pflId,
      projectId: entity.pjtId,
      title: entity.pflTitle,
      phase: entity.pflPhase || null,
      filename: entity.pflFilename,
      mimeType: entity.pflMimeType || null,
      fileSize: entity.pflFileSize || null,
      gdriveFileId: entity.pflGdriveFileId || null,
      gdriveUrl: entity.pflGdriveUrl || null,
      uploadedBy: entity.pflUploadedBy || null,
      createdAt: entity.pflCreatedAt.toISOString(),
    };
  }
}
