import {
  Controller, Get, Post,
  Param, Body, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectReviewService } from '../service/project-review.service';
import { ReviewProjectRequest } from '../dto/request/review-project.request';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Project Reviews')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('project/reviews')
export class ProjectReviewController {
  constructor(private readonly reviewService: ProjectReviewService) {}

  @Get(':projectId/history')
  @ApiOperation({ summary: '리뷰 이력' })
  async getHistory(@Param('projectId') projectId: string, @Req() req: any) {
    const data = await this.reviewService.getHistory(projectId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':projectId/pre-analysis')
  @ApiOperation({ summary: 'AI 사전분석 생성' })
  async generatePreAnalysis(@Param('projectId') projectId: string, @Req() req: any) {
    const data = await this.reviewService.generatePreAnalysis(projectId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':projectId/recommendation')
  @ApiOperation({ summary: 'AI 승인 권고' })
  async getRecommendation(@Param('projectId') projectId: string, @Req() req: any) {
    const data = await this.reviewService.getRecommendation(projectId, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':projectId/action')
  @ApiOperation({ summary: '리뷰 액션 (approve/reject/hold/comment)' })
  async performAction(
    @Param('projectId') projectId: string,
    @Body() dto: ReviewProjectRequest,
    @Req() req: any,
  ) {
    const data = await this.reviewService.performAction(
      projectId,
      dto,
      req.user.userId,
      req.entityId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
