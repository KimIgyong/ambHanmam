import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, UseGuards,
  BadRequestException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectService } from '../service/project.service';
import { ProjectMemberService } from '../service/project-member.service';
import { ProjectAiService } from '../service/project-ai.service';
import { CreateProjectRequest } from '../dto/request/create-project.request';
import { UpdateProjectRequest } from '../dto/request/update-project.request';
import { SubmitProposalRequest } from '../dto/request/submit-proposal.request';
import { AiDraftProposalRequest } from '../dto/request/ai-draft-proposal.request';
import { AddProjectMemberRequest } from '../dto/request/add-project-member.request';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { Roles } from '../../../global/decorator/roles.decorator';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { IssueService } from '../../issues/service/issue.service';
import { ProjectClientEntity } from '../entity/project-client.entity';
import { ProjectCommentEntity } from '../entity/project-comment.entity';
import { MeetingNoteProjectEntity } from '../../meeting-notes/entity/meeting-note-project.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@ApiTags('Project Management')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('project/projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly memberService: ProjectMemberService,
    private readonly projectAiService: ProjectAiService,
    private readonly issueService: IssueService,
    @InjectRepository(ProjectClientEntity)
    private readonly projectClientRepository: Repository<ProjectClientEntity>,
    @InjectRepository(MeetingNoteProjectEntity)
    private readonly meetingNoteProjectRepo: Repository<MeetingNoteProjectEntity>,
    @InjectRepository(ProjectCommentEntity)
    private readonly projectCommentRepo: Repository<ProjectCommentEntity>,
  ) {}

  @Get()
  @ApiOperation({ summary: '프로젝트 목록 조회' })
  async findAll(@Req() req: any, @Query() query: any) {
    const result = await this.projectService.findAll(req.entityId, query, req.user?.userId);
    return { success: true, data: result.data, pagination: result.pagination, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: '프로젝트 상세 조회' })
  async findById(@Param('id') id: string, @Req() req: any) {
    const data = await this.projectService.findById(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '프로젝트 생성 (DRAFT)' })
  async create(@Body() dto: CreateProjectRequest, @Req() req: any) {
    const data = await this.projectService.create(dto, req.user.userId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: '프로젝트 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectRequest, @Req() req: any) {
    const data = await this.projectService.update(id, dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: '프로젝트 삭제 (Soft Delete)' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.projectService.delete(id, req.entityId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Post('ai/draft')
  @ApiOperation({ summary: 'AI 제안서 초안 생성' })
  async generateAiDraft(@Body() dto: AiDraftProposalRequest, @Req() req: any) {
    try {
      const data = await this.projectAiService.generateProposalDraft(
        dto.title,
        dto.brief_description,
        dto.category,
        dto.language || req.headers['accept-language'],
      );
      return { success: true, data, timestamp: new Date().toISOString() };
    } catch {
      return {
        success: false,
        error: ERROR_CODE.PROJECT_AI_DRAFT_FAILED,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get(':id/similar')
  @ApiOperation({ summary: '유사 프로젝트 탐지' })
  async findSimilar(@Param('id') id: string, @Req() req: any) {
    const data = await this.projectService.findSimilar(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '제안서 제출 (DRAFT→SUBMITTED)' })
  async submitProposal(@Param('id') id: string, @Body() dto: SubmitProposalRequest, @Req() req: any) {
    const data = await this.projectService.submitProposal(id, req.entityId, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: '제안 승인 (MANAGER 이상)' })
  async approveProject(@Param('id') id: string, @Body() body: { comment?: string }, @Req() req: any) {
    const data = await this.projectService.approveProject(id, req.entityId, req.user.userId, body?.comment);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: '제안 반려 (MANAGER 이상)' })
  async rejectProject(@Param('id') id: string, @Body() body: { comment?: string; reason?: string }, @Req() req: any) {
    const data = await this.projectService.rejectProject(id, req.entityId, req.user.userId, body?.comment || body?.reason);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/notes')
  @ApiOperation({ summary: '프로젝트에 연결된 회의록/메모 목록' })
  async getProjectNotes(@Param('id') id: string) {
    const links = await this.meetingNoteProjectRepo.find({
      where: { pjtId: id },
      relations: ['meetingNote', 'meetingNote.user'],
      order: { meetingNote: { mtnMeetingDate: 'DESC' } },
    });
    const data = links
      .filter((l) => l.meetingNote && !l.meetingNote.mtnDeletedAt)
      .map((l) => ({
        noteId: l.meetingNote.mtnId,
        title: l.meetingNote.mtnTitle,
        type: l.meetingNote.mtnType,
        visibility: l.meetingNote.mtnVisibility,
        meetingDate: l.meetingNote.mtnMeetingDate,
        authorName: l.meetingNote.user?.usrName || '',
        createdAt: l.meetingNote.mtnCreatedAt,
      }));
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/issues')
  @ApiOperation({ summary: '프로젝트 관련 이슈 목록 조회' })
  async getProjectIssues(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    const data = await this.issueService.getIssues(
      { project_id: id, status, type },
      Number(page) || 1,
      Number(size) || 20,
    );
    return { success: true, data: data.data, totalCount: data.totalCount, timestamp: new Date().toISOString() };
  }

  @Get(':id/members')
  @ApiOperation({ summary: '멤버 목록' })
  async getMembers(@Param('id') id: string, @Req() req: any) {
    const data = await this.memberService.findByProject(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/members')
  @ApiOperation({ summary: '멤버 추가' })
  async addMember(@Param('id') id: string, @Body() dto: AddProjectMemberRequest, @Req() req: any) {
    const data = await this.memberService.addMember(id, dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: '멤버 역할 변경' })
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body('role') role: string,
    @Req() req: any,
  ) {
    const data = await this.memberService.updateRole(id, memberId, role, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: '멤버 제거' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: any,
  ) {
    await this.memberService.removeMember(id, memberId, req.entityId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  // ── 프로젝트 코멘트 ──

  @Get(':id/comments')
  @ApiOperation({ summary: '프로젝트 코멘트 목록' })
  async getComments(@Param('id') id: string) {
    const data = await this.projectCommentRepo.find({
      where: { pjtId: id },
      relations: ['user'],
      order: { pjcCreatedAt: 'ASC' },
    });
    return {
      success: true,
      data: data.map((c) => ({
        commentId: c.pjcId,
        projectId: c.pjtId,
        userId: c.usrId,
        userName: c.user?.usrName || '',
        content: c.pjcContent,
        createdAt: c.pjcCreatedAt,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '프로젝트 코멘트 추가' })
  async addComment(
    @Param('id') id: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    if (!content || !content.trim()) {
      throw new BadRequestException('Content is required');
    }
    const comment = this.projectCommentRepo.create({
      pjtId: id,
      usrId: req.user.userId,
      pjcContent: content,
    });
    const saved = await this.projectCommentRepo.save(comment);
    const loaded = await this.projectCommentRepo.findOne({
      where: { pjcId: saved.pjcId },
      relations: ['user'],
    });
    return {
      success: true,
      data: {
        commentId: loaded!.pjcId,
        projectId: loaded!.pjtId,
        userId: loaded!.usrId,
        userName: loaded!.user?.usrName || '',
        content: loaded!.pjcContent,
        createdAt: loaded!.pjcCreatedAt,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: '프로젝트 코멘트 삭제' })
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    const comment = await this.projectCommentRepo.findOne({
      where: { pjcId: commentId, pjtId: id },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.usrId !== req.user.userId) {
      throw new ForbiddenException('Cannot delete other user\'s comment');
    }
    await this.projectCommentRepo.softRemove(comment);
    return { success: true, timestamp: new Date().toISOString() };
  }

  // ── 고객사 배정 관리 ──

  @Get(':id/clients')
  @ApiOperation({ summary: '프로젝트에 배정된 고객사 목록' })
  async getClients(@Param('id') id: string) {
    const data = await this.projectClientRepository.find({
      where: { pjtId: id, pclStatus: 'ACTIVE' },
      relations: ['client'],
      order: { pclCreatedAt: 'DESC' },
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/clients')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: '프로젝트에 고객사 배정' })
  async addClient(@Param('id') id: string, @Body('cli_id') cliId: string) {
    const existing = await this.projectClientRepository.findOne({
      where: { pjtId: id, cliId },
    });
    if (existing) {
      if (existing.pclStatus === 'ACTIVE') {
        return { success: true, data: existing, timestamp: new Date().toISOString() };
      }
      existing.pclStatus = 'ACTIVE';
      const data = await this.projectClientRepository.save(existing);
      return { success: true, data, timestamp: new Date().toISOString() };
    }
    const entity = this.projectClientRepository.create({ pjtId: id, cliId });
    const data = await this.projectClientRepository.save(entity);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id/clients/:clientId')
  @UseGuards(RolesGuard)
  @Roles('MANAGER')
  @ApiOperation({ summary: '프로젝트에서 고객사 제거' })
  async removeClient(@Param('id') id: string, @Param('clientId') clientId: string) {
    await this.projectClientRepository.update(
      { pjtId: id, cliId: clientId },
      { pclStatus: 'INACTIVE' },
    );
    return { success: true, timestamp: new Date().toISOString() };
  }
}
