import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { TagCloudService } from '../service/tag-cloud.service';
import { TagDrillDownService } from '../service/tag-drill-down.service';
import { KnowledgeGraphService } from '../service/knowledge-graph.service';
import { TagBatchService } from '../service/tag-batch.service';
import { TagCloudScope } from '@amb/types';

@Controller('kms')
@UseGuards(EntityGuard, JwtAuthGuard)
export class TagCloudController {
  constructor(
    private readonly tagCloudService: TagCloudService,
    private readonly tagDrillDownService: TagDrillDownService,
    private readonly knowledgeGraphService: KnowledgeGraphService,
    private readonly tagBatchService: TagBatchService,
  ) {}

  @Get('tag-cloud')
  async getTagCloud(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Query('scope') scope: string = 'MY',
    @Query('level') level?: string,
    @Query('period') period?: string,
    @Query('max_tags') maxTags?: string,
  ) {
    const data = await this.tagCloudService.getTagCloud({
      userId: user.userId,
      entityId: req.entityId,
      scope: (['MY', 'TEAM', 'COMPANY'].includes(scope) ? scope : 'MY') as TagCloudScope,
      level: level ? parseInt(level, 10) : undefined,
      period: period ? parseInt(period.replace('d', ''), 10) : 30,
      maxTags: maxTags ? parseInt(maxTags, 10) : 50,
      departmentId: user.departmentId,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('tag-cloud/:tagId/detail')
  async getTagDetail(
    @CurrentUser() user: UserPayload,
    @Param('tagId') tagId: string,
    @Query('include_comparison') includeComparison?: string,
  ) {
    const data = await this.tagDrillDownService.getTagDetail({
      tagId,
      userId: user.userId,
      departmentId: user.departmentId,
      includeComparison: includeComparison === 'true',
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('analyze-relations')
  async analyzeRelations(@CurrentUser() user: UserPayload) {
    // 1. 사용량 재계산
    await this.tagBatchService.runDailyBatch();
    // 2. 동시출현 분석 (모든 엔티티)
    return { success: true, data: { message: 'Tag relations analyzed successfully' }, timestamp: new Date().toISOString() };
  }

  @Get('knowledge-graph')
  async getKnowledgeGraph(
    @Req() req: any,
    @Query('min_usage') minUsage?: string,
    @Query('max_nodes') maxNodes?: string,
  ) {
    const data = await this.knowledgeGraphService.getKnowledgeGraph({
      entityId: req.entityId,
      minUsage: minUsage ? parseInt(minUsage, 10) : 1,
      maxNodes: maxNodes ? parseInt(maxNodes, 10) : 100,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
