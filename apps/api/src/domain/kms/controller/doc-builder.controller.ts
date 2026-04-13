import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { DocTypeService } from '../service/doc-builder/doc-type.service';
import { BaseDataService } from '../service/doc-builder/base-data.service';
import { DocGenerationService, GenerateDocumentDto } from '../service/doc-builder/doc-generation.service';
import { DocDiffService } from '../service/doc-builder/doc-diff.service';
import { DocLifecycleService } from '../service/doc-builder/doc-lifecycle.service';
import { DddDocBridgeService } from '../service/doc-builder/ddd-doc-bridge.service';
import { CrossModuleDataService } from '../service/doc-builder/cross-module-data.service';
import { StaleDetectionService } from '../service/doc-builder/stale-detection.service';
import { CreateBaseDataDto } from '../dto/request/create-base-data.dto';
import { UpdateBaseDataDto } from '../dto/request/update-base-data.dto';
import { DocExtractionService, ApplyExtractionDto } from '../service/doc-builder/doc-extraction.service';
import { ConflictDetectionService } from '../service/doc-builder/conflict-detection.service';
import { GapAnalysisService } from '../service/doc-builder/gap-analysis.service';
import { DocAssetService, CreateAssetDto } from '../service/doc-builder/doc-asset.service';
import { BrandConfigService } from '../service/doc-builder/brand-config.service';

@Controller('kms/doc-builder')
@UseGuards(EntityGuard, JwtAuthGuard)
export class DocBuilderController {
  constructor(
    private readonly docTypeService: DocTypeService,
    private readonly baseDataService: BaseDataService,
    private readonly docGenerationService: DocGenerationService,
    private readonly docDiffService: DocDiffService,
    private readonly docLifecycleService: DocLifecycleService,
    private readonly dddDocBridgeService: DddDocBridgeService,
    private readonly crossModuleDataService: CrossModuleDataService,
    private readonly staleDetectionService: StaleDetectionService,
    private readonly docExtractionService: DocExtractionService,
    private readonly conflictDetectionService: ConflictDetectionService,
    private readonly gapAnalysisService: GapAnalysisService,
    private readonly docAssetService: DocAssetService,
    private readonly brandConfigService: BrandConfigService,
  ) {}

  // ===== Document Types =====

  @Get('types')
  async getDocTypes(@Req() req: any) {
    const data = await this.docTypeService.findAll(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('types/:dtpId')
  async getDocType(@Req() req: any, @Param('dtpId') dtpId: string) {
    const data = await this.docTypeService.findOne(req.entityId, dtpId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('types/:dtpId/base-data-refs')
  async getDocTypeBaseDataRefs(@Req() req: any, @Param('dtpId') dtpId: string) {
    const data = await this.docTypeService.getInheritedBaseDataRefs(req.entityId, dtpId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Base Data Categories =====

  @Get('categories')
  async getCategories(@Req() req: any) {
    const data = await this.baseDataService.findAllCategories(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('categories/:dbcId')
  async getCategory(@Req() req: any, @Param('dbcId') dbcId: string) {
    const data = await this.baseDataService.findCategoryById(req.entityId, dbcId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Base Data CRUD =====

  @Get('data')
  async getData(
    @Req() req: any,
    @Query('category') categoryCode?: string,
    @Query('language') language?: string,
  ) {
    const data = await this.baseDataService.findAllData(req.entityId, {
      categoryCode,
      language,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('data/:dbdId')
  async getDataById(@Req() req: any, @Param('dbdId') dbdId: string) {
    const data = await this.baseDataService.findOneData(req.entityId, dbdId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('data')
  async createData(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Body() dto: CreateBaseDataDto,
  ) {
    const data = await this.baseDataService.createData(req.entityId, user.userId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put('data/:dbdId')
  async updateData(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Param('dbdId') dbdId: string,
    @Body() dto: UpdateBaseDataDto,
  ) {
    const data = await this.baseDataService.updateData(req.entityId, user.userId, dbdId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Version History =====

  @Get('data/:dbdId/history')
  async getDataHistory(@Req() req: any, @Param('dbdId') dbdId: string) {
    const data = await this.baseDataService.getHistory(req.entityId, dbdId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('data/:dbdId/rollback/:version')
  async rollbackData(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Param('dbdId') dbdId: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    const data = await this.baseDataService.rollback(req.entityId, user.userId, dbdId, version);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Completeness =====

  @Get('completeness')
  async getCompleteness(
    @Req() req: any,
    @Query('language') language?: string,
  ) {
    const data = await this.baseDataService.getCategoryCompleteness(
      req.entityId,
      language || 'en',
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Document Generation =====

  @Post('generate')
  async generateDocument(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Body() dto: GenerateDocumentDto,
  ) {
    const data = await this.docGenerationService.generate(req.entityId, user.userId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('documents')
  async getDocuments(@Req() req: any) {
    const data = await this.docGenerationService.findAll(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('documents/:dgnId')
  async getDocument(@Req() req: any, @Param('dgnId') dgnId: string) {
    const data = await this.docGenerationService.findOne(req.entityId, dgnId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('documents/:dgnId/download')
  async downloadDocument(
    @Req() req: any,
    @Res() res: Response,
    @Param('dgnId') dgnId: string,
  ) {
    const { buffer, filename, format } = await this.docGenerationService.getFileBuffer(req.entityId, dgnId);
    const contentTypeMap: Record<string, string> = {
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      pdf: 'application/pdf',
    };
    const contentType = contentTypeMap[format] || 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Put('documents/:dgnId/status')
  async updateDocumentStatus(
    @Req() req: any,
    @Param('dgnId') dgnId: string,
    @Body('status') status: string,
  ) {
    const data = await this.docGenerationService.updateStatus(req.entityId, dgnId, status);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Re-upload + Diff Analysis =====

  @Post('documents/:dgnId/re-upload')
  @UseInterceptors(FileInterceptor('file'))
  async reUploadDocument(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Param('dgnId') dgnId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const format = file.originalname.endsWith('.docx') ? 'docx' : 'pptx';
    const data = await this.docDiffService.reUploadAndAnalyze(
      req.entityId,
      dgnId,
      user.userId,
      file.buffer,
      format,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('documents/:dgnId/diff/:dehId')
  async getDiffResult(
    @Req() req: any,
    @Param('dgnId') dgnId: string,
    @Param('dehId') dehId: string,
  ) {
    const data = await this.docDiffService.getDiffResult(req.entityId, dgnId, dehId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('documents/:dgnId/edit-history')
  async getEditHistory(@Req() req: any, @Param('dgnId') dgnId: string) {
    const data = await this.docDiffService.getEditHistory(req.entityId, dgnId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Lifecycle =====

  @Post('documents/:dgnId/transition')
  async transitionDocument(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Param('dgnId') dgnId: string,
    @Body() body: { status: string; notes?: string },
  ) {
    const data = await this.docLifecycleService.transition(
      req.entityId,
      dgnId,
      user.userId,
      body.status,
      body.notes,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('documents/:dgnId/timeline')
  async getDocumentTimeline(@Req() req: any, @Param('dgnId') dgnId: string) {
    const data = await this.docLifecycleService.getLifecycleTimeline(req.entityId, dgnId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('documents/:dgnId/valid-transitions')
  async getValidTransitions(@Req() req: any, @Param('dgnId') dgnId: string) {
    const doc = await this.docGenerationService.findOne(req.entityId, dgnId);
    const data = this.docLifecycleService.getValidTransitions(doc.dgnStatus);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('stale-check')
  async checkStalenessLegacy(@Req() req: any) {
    const data = await this.docLifecycleService.checkStaleness(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Cross-Module Sync =====

  @Post('sync/ddd')
  async syncDdd(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.dddDocBridgeService.syncAll(req.entityId, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('sync/billing')
  async syncBilling(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.crossModuleDataService.syncBilling(req.entityId, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('sync/hr')
  async syncHr(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.crossModuleDataService.syncHr(req.entityId, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('sync/status')
  async getSyncStatus(@Req() req: any) {
    const data = await this.crossModuleDataService.getSyncStatus(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Preview =====

  @Post('preview')
  async previewDocument(
    @Req() req: any,
    @Body() dto: { doc_type_id: string; audience: string; language: string; sections?: string[] },
  ) {
    // Generate content sections without creating a file
    const docType = await this.docTypeService.findOne(req.entityId, dto.doc_type_id);
    const sections = docType.dtpSectionTemplate || [];
    const activeSections = dto.sections
      ? sections.filter((s: any) => dto.sections!.includes(s.code))
      : sections;

    const preview = activeSections.map((s: any) => ({
      code: s.code,
      name: s.name,
      content: s.description || `[Preview content for "${s.name}" will be generated]`,
    }));

    return { success: true, data: preview, timestamp: new Date().toISOString() };
  }

  // ===== AI Extraction =====

  @Post('extract/batch')
  async batchExtract(
    @Req() req: any,
    @Res() res: Response,
    @Body() body: { file_ids: string[] },
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const stream$ = this.docExtractionService.streamBatchExtract(req.entityId, body.file_ids);
    stream$.subscribe({
      next: (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      },
      error: (err) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
        res.end();
      },
      complete: () => {
        res.end();
      },
    });
  }

  @Post('extract/apply')
  async applyExtraction(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
    @Body() dto: ApplyExtractionDto,
  ) {
    await this.docExtractionService.applyExtraction(req.entityId, user.userId, dto);
    return { success: true, data: { applied: true }, timestamp: new Date().toISOString() };
  }

  @Post('extract/:fileId')
  async extractFromFile(
    @Req() req: any,
    @Param('fileId') fileId: string,
  ) {
    const data = await this.docExtractionService.extractFromDriveFile(req.entityId, fileId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Conflict Detection =====

  @Post('conflicts/detect')
  async detectConflicts(
    @Req() req: any,
    @Body() body: { extractions: any[] },
  ) {
    const data = await this.conflictDetectionService.detectConflicts(body.extractions);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('conflicts/compare')
  async compareWithExisting(
    @Req() req: any,
    @Body() body: { extracted: any[]; language?: string },
  ) {
    const data = await this.conflictDetectionService.compareWithExisting(
      req.entityId,
      body.extracted,
      body.language,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Gap Analysis =====

  @Get('gaps')
  async getGapAnalysis(
    @Req() req: any,
    @Query('language') language?: string,
  ) {
    const data = await this.gapAnalysisService.analyze(req.entityId, language || 'en');
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('stale-report')
  async getStaleReport(
    @Req() req: any,
    @Query('threshold') threshold?: string,
  ) {
    const data = await this.staleDetectionService.checkStaleness(
      req.entityId,
      threshold ? parseInt(threshold, 10) : undefined,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ===== Assets =====

  @Get('assets')
  async getAssets(
    @Req() req: any,
    @Query('type') type?: string,
  ) {
    const data = await this.docAssetService.findAll(req.entityId, type);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('assets')
  async createAsset(
    @Req() req: any,
    @Body() dto: CreateAssetDto,
  ) {
    const data = await this.docAssetService.create(req.entityId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('assets/:dasId')
  async deleteAsset(
    @Req() req: any,
    @Param('dasId') dasId: string,
  ) {
    await this.docAssetService.delete(req.entityId, dasId);
    return { success: true, data: { deleted: true }, timestamp: new Date().toISOString() };
  }

  // ===== Brand Config =====

  @Get('brand-config')
  async getBrandConfig(@Req() req: any) {
    const data = await this.brandConfigService.getConfig(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
