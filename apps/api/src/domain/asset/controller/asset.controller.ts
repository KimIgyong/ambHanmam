import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	Req,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { AssetService } from '../service/asset.service';
import { CreateAssetRequest } from '../dto/request/create-asset.request';
import { UpdateAssetStatusRequest } from '../dto/request/update-asset-status.request';
import { UpdateAssetRequest } from '../dto/request/update-asset.request';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('assets')
export class AssetController {
	constructor(private readonly assetService: AssetService) {}

	@Get()
	@ApiOperation({ summary: 'Get asset list' })
	async getAssets(
		@CurrentUser() user: UserPayload,
		@Req() req: any,
		@Query('category') category?: string,
		@Query('status') status?: string,
		@Query('q') q?: string,
	) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.findAll(req.entityId, user.userId, role, {
			category,
			status,
			q,
		});
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Get('stats/dashboard')
	@ApiOperation({ summary: 'Get asset dashboard stats' })
	async getDashboard(
		@CurrentUser() user: UserPayload,
		@Req() req: any,
		@Query('from') from?: string,
		@Query('to') to?: string,
	) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.getDashboard(req.entityId, user.userId, role, from, to);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Get('stats/risk')
	@ApiOperation({ summary: 'Get asset risk report' })
	async getRiskReport(
		@CurrentUser() user: UserPayload,
		@Req() req: any,
		@Query('limit') limit?: string,
	) {
		const role = req.entityRole || user.role;
		const parsedLimit = limit ? Number(limit) : undefined;
		const data = await this.assetService.getRiskReport(req.entityId, user.userId, role, parsedLimit);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Get('meeting-rooms/calendar')
	@ApiOperation({ summary: 'Get meeting room calendar (day/week)' })
	async getMeetingRoomCalendar(
		@CurrentUser() user: UserPayload,
		@Req() req: any,
		@Query('view') view?: string,
		@Query('date') date?: string,
	) {
		const role = req.entityRole || user.role;
		const normalizedView = view === 'week' ? 'week' : 'day';
		const data = await this.assetService.getMeetingRoomCalendar(
			req.entityId,
			user.userId,
			role,
			normalizedView,
			date,
		);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Get('logs/asset-changes')
	@ApiOperation({ summary: 'Get asset change logs' })
	async getAssetChangeLogs(
		@CurrentUser() user: UserPayload,
		@Req() req: any,
		@Query() query: any,
	) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.getAssetChangeLogs(req.entityId, user.userId, role, query);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Get('logs/request-status')
	@ApiOperation({ summary: 'Get asset request status logs' })
	async getAssetRequestLogs(
		@CurrentUser() user: UserPayload,
		@Req() req: any,
		@Query() query: any,
	) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.getAssetRequestLogs(req.entityId, user.userId, role, query);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Get('logs/export/asset-changes')
	@ApiOperation({ summary: 'Export asset change logs to Excel' })
	async exportAssetChangeLogs(
		@CurrentUser() user: UserPayload,
		@Req() req: any,
		@Query() query: any,
		@Res() res: Response,
	) {
		const role = req.entityRole || user.role;
		const buffer = await this.assetService.exportAssetChangeLogsExcel(req.entityId, user.userId, role, query);
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename="asset-change-logs.xlsx"');
		res.send(buffer);
	}

	@Get('logs/export/request-status')
	@ApiOperation({ summary: 'Export asset request status logs to Excel' })
	async exportAssetRequestLogs(
		@CurrentUser() user: UserPayload,
		@Req() req: any,
		@Query() query: any,
		@Res() res: Response,
	) {
		const role = req.entityRole || user.role;
		const buffer = await this.assetService.exportAssetRequestLogsExcel(req.entityId, user.userId, role, query);
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename="asset-request-status-logs.xlsx"');
		res.send(buffer);
	}

	@Get('ops/metrics')
	@ApiOperation({ summary: 'Get asset operational performance metrics' })
	async getOpsMetrics(
		@CurrentUser() user: UserPayload,
		@Req() req: any,
	) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.getOperationalMetrics(req.entityId, user.userId, role);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Get('ops/retention')
	@ApiOperation({ summary: 'Get asset log retention policy status' })
	async getRetentionStatus(
		@CurrentUser() user: UserPayload,
		@Req() req: any,
	) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.getRetentionStatus(req.entityId, user.userId, role);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Get('ops/integration-readiness')
	@ApiOperation({ summary: 'Get SSO/Account-lock integration readiness' })
	async getIntegrationReadiness(
		@CurrentUser() user: UserPayload,
	) {
		const data = await this.assetService.getIntegrationReadiness(user.role);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Get('import/template')
	@ApiOperation({ summary: 'Download asset import Excel template' })
	async downloadImportTemplate(@Res() res: Response) {
		const buffer = await this.assetService.generateImportTemplate();
		res.set({
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename=asset_import_template.xlsx',
		});
		res.send(buffer);
	}

	@Post('import/excel')
	@ApiOperation({ summary: 'Bulk import assets from Excel file' })
	@ApiConsumes('multipart/form-data')
	@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
	async importExcel(
		@UploadedFile() file: Express.Multer.File,
		@CurrentUser() user: UserPayload,
		@Req() req: any,
	) {
		if (!file) throw new BadRequestException('File is required.');
		const role = req.entityRole || user.role;
		const data = await this.assetService.importFromExcel(file.buffer, user.userId, role, req.entityId);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get asset detail' })
	async getAsset(@Param('id') id: string, @CurrentUser() user: UserPayload, @Req() req: any) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.findById(id, req.entityId, user.userId, role);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Post()
	@ApiOperation({ summary: 'Create asset' })
	async createAsset(
		@Body() request: CreateAssetRequest,
		@CurrentUser() user: UserPayload,
		@Req() req: any,
	) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.create(request, user.userId, role, req.entityId);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Patch(':id/status')
	@ApiOperation({ summary: 'Update asset status' })
	async updateAssetStatus(
		@Param('id') id: string,
		@Body() request: UpdateAssetStatusRequest,
		@CurrentUser() user: UserPayload,
		@Req() req: any,
	) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.updateStatus(id, request, user.userId, role, req.entityId);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update asset' })
	async updateAsset(
		@Param('id') id: string,
		@Body() request: UpdateAssetRequest,
		@CurrentUser() user: UserPayload,
		@Req() req: any,
	) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.updateAsset(id, request, user.userId, role, req.entityId);
		return { success: true, data, timestamp: new Date().toISOString() };
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete asset' })
	async deleteAsset(
		@Param('id') id: string,
		@CurrentUser() user: UserPayload,
		@Req() req: any,
	) {
		const role = req.entityRole || user.role;
		const data = await this.assetService.deleteAsset(id, user.userId, role, req.entityId);
		return { success: true, data, timestamp: new Date().toISOString() };
	}
}
