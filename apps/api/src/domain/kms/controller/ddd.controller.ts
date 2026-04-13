import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { DddFrameworkService } from '../service/ddd/ddd-framework.service';
import { DddDashboardService } from '../service/ddd/ddd-dashboard.service';
import { DddSnapshotService } from '../service/ddd/ddd-snapshot.service';
import { DddGaugeService } from '../service/ddd/ddd-gauge.service';
import { DddDataCollectorService } from '../service/ddd/ddd-data-collector.service';
import { DddAiAnalysisService } from '../service/ddd/ddd-ai-analysis.service';
import { CreateDashboardDto } from '../dto/request/create-dashboard.dto';
import { CreateSnapshotDto, BulkCreateSnapshotDto } from '../dto/request/create-snapshot.dto';
import { CreateGaugeScoreDto, BulkCreateGaugeScoreDto } from '../dto/request/create-gauge-score.dto';

@Controller('kms/ddd')
@UseGuards(EntityGuard, JwtAuthGuard)
export class DddController {
  constructor(
    private readonly frameworkService: DddFrameworkService,
    private readonly dashboardService: DddDashboardService,
    private readonly snapshotService: DddSnapshotService,
    private readonly gaugeService: DddGaugeService,
    private readonly dataCollectorService: DddDataCollectorService,
    private readonly aiAnalysisService: DddAiAnalysisService,
  ) {}

  // ===== Frameworks =====

  @Get('frameworks')
  async getFrameworks(@Req() req: any) {
    const data = await this.frameworkService.findAll(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('frameworks/:fwkId')
  async getFramework(@Req() req: any, @Param('fwkId') fwkId: string) {
    const data = await this.frameworkService.findOneWithMetrics(req.entityId, fwkId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('frameworks/:fwkId/metrics')
  async getFrameworkMetrics(
    @Param('fwkId') fwkId: string,
    @Query('stage') stage?: string,
  ) {
    const data = await this.frameworkService.getMetrics(fwkId, stage);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('frameworks/:fwkId/metrics/primary')
  async getPrimaryMetrics(@Param('fwkId') fwkId: string) {
    const data = await this.frameworkService.getPrimaryMetrics(fwkId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Dashboards =====

  @Get('dashboards')
  async getDashboards(@Req() req: any) {
    const data = await this.dashboardService.findAll(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('dashboards/:ddbId')
  async getDashboard(@Req() req: any, @Param('ddbId') ddbId: string) {
    const data = await this.dashboardService.findOne(req.entityId, ddbId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('dashboards')
  async createDashboard(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Body() dto: CreateDashboardDto,
  ) {
    const data = await this.dashboardService.create(req.entityId, user.userId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put('dashboards/:ddbId')
  async updateDashboard(
    @Req() req: any,
    @Param('ddbId') ddbId: string,
    @Body() dto: Partial<CreateDashboardDto>,
  ) {
    const data = await this.dashboardService.update(req.entityId, ddbId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('dashboards/:ddbId')
  async deleteDashboard(@Req() req: any, @Param('ddbId') ddbId: string) {
    await this.dashboardService.softDelete(req.entityId, ddbId);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }

  // ===== Snapshots =====

  @Get('dashboards/:ddbId/snapshots')
  async getSnapshots(
    @Param('ddbId') ddbId: string,
    @Query('period') period?: string,
    @Query('stage') stage?: string,
  ) {
    const data = await this.snapshotService.findByDashboard(ddbId, { period, stage });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('dashboards/:ddbId/overview')
  async getStageOverview(
    @Param('ddbId') ddbId: string,
    @Query('period') period: string,
  ) {
    const data = await this.snapshotService.getStageOverview(ddbId, period);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('dashboards/:ddbId/metrics/:metId/timeseries')
  async getTimeSeries(
    @Param('ddbId') ddbId: string,
    @Param('metId') metId: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.snapshotService.getTimeSeries(
      ddbId,
      metId,
      limit ? parseInt(limit, 10) : 8,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('dashboards/:ddbId/snapshots')
  async createSnapshot(
    @CurrentUser() user: UserPayload,
    @Param('ddbId') ddbId: string,
    @Body() dto: CreateSnapshotDto,
  ) {
    const data = await this.snapshotService.create(ddbId, user.userId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('dashboards/:ddbId/snapshots/bulk')
  async bulkCreateSnapshots(
    @CurrentUser() user: UserPayload,
    @Param('ddbId') ddbId: string,
    @Body() dto: BulkCreateSnapshotDto,
  ) {
    const data = await this.snapshotService.bulkCreate(ddbId, user.userId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Gauge Scores =====

  @Get('dashboards/:ddbId/gauges')
  async getGaugeScores(
    @Param('ddbId') ddbId: string,
    @Query('period') period?: string,
  ) {
    const data = await this.gaugeService.findByDashboard(ddbId, period);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('dashboards/:ddbId/gauges/latest')
  async getLatestGaugeScores(@Param('ddbId') ddbId: string) {
    const data = await this.gaugeService.getLatestScores(ddbId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('dashboards/:ddbId/gauges/:dimension/timeseries')
  async getGaugeTimeSeries(
    @Param('ddbId') ddbId: string,
    @Param('dimension') dimension: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.gaugeService.getTimeSeries(
      ddbId,
      dimension,
      limit ? parseInt(limit, 10) : 8,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('dashboards/:ddbId/gauges')
  async createGaugeScore(
    @Param('ddbId') ddbId: string,
    @Body() dto: CreateGaugeScoreDto,
  ) {
    const data = await this.gaugeService.createOrUpdate(ddbId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('dashboards/:ddbId/gauges/bulk')
  async bulkCreateGaugeScores(
    @Param('ddbId') ddbId: string,
    @Body() dto: BulkCreateGaugeScoreDto,
  ) {
    const data = await this.gaugeService.bulkCreateOrUpdate(ddbId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Auto Data Collection =====

  @Post('dashboards/:ddbId/collect')
  async collectData(
    @CurrentUser() user: UserPayload,
    @Param('ddbId') ddbId: string,
    @Body('period') period: string,
  ) {
    const data = await this.dataCollectorService.collectForDashboard(ddbId, period, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== AI Analysis + Insights =====

  @Post('dashboards/:ddbId/analyze')
  async analyzeDashboard(
    @Param('ddbId') ddbId: string,
    @Body() body: { period: string; types?: string[] },
  ) {
    const data = await this.aiAnalysisService.analyze({
      dashboardId: ddbId,
      period: body.period,
      types: body.types,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('dashboards/:ddbId/insights')
  async getInsights(
    @Param('ddbId') ddbId: string,
    @Query('period') period?: string,
  ) {
    const data = await this.aiAnalysisService.getInsights(ddbId, period);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put('insights/:aisId/action')
  async markInsightActioned(@Param('aisId') aisId: string) {
    const data = await this.aiAnalysisService.markInsightActioned(aisId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put('insights/:aisId/read')
  async markInsightRead(@Param('aisId') aisId: string) {
    const data = await this.aiAnalysisService.markInsightRead(aisId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
