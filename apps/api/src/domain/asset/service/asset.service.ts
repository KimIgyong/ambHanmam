import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { AssetEntity } from '../entity/asset.entity';
import { AssetChangeLogEntity } from '../entity/asset-change-log.entity';
import { AssetRequestEntity } from '../entity/asset-request.entity';
import { AssetRequestLogEntity } from '../entity/asset-request-log.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { CreateAssetRequest } from '../dto/request/create-asset.request';
import { UpdateAssetRequest } from '../dto/request/update-asset.request';
import { UpdateAssetStatusRequest } from '../dto/request/update-asset-status.request';
import { AssetMapper } from '../mapper/asset.mapper';
import { AssetResponse } from '../dto/response/asset.response';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { AssetDashboardResponse, AssetRiskReportResponse } from '../dto/response/asset-dashboard.response';
import { MeetingRoomCalendarResponse } from '../dto/response/meeting-room-calendar.response';
import {
	AssetIntegrationReadinessResponse,
	AssetOpsMetricsResponse,
	AssetRetentionStatusResponse,
} from '../dto/response/asset-ops.response';

@Injectable()
export class AssetService {
	constructor(
		@InjectRepository(AssetEntity)
		private readonly assetRepository: Repository<AssetEntity>,
		@InjectRepository(AssetChangeLogEntity)
		private readonly assetChangeLogRepository: Repository<AssetChangeLogEntity>,
		@InjectRepository(AssetRequestEntity)
		private readonly requestRepository: Repository<AssetRequestEntity>,
		@InjectRepository(AssetRequestLogEntity)
		private readonly requestLogRepository: Repository<AssetRequestLogEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
	) {}

	private isAdminRole(role: string): boolean {
		return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SYSTEM_ADMIN' || role === 'MASTER';
	}

	private isManagerRole(role: string): boolean {
		return role === 'MANAGER';
	}

	private async getUserUnit(userId: string): Promise<string | null> {
		const me = await this.userRepository.findOne({ where: { usrId: userId } });
		return me?.usrUnit || null;
	}

	private applyAssetScope(
		qb: SelectQueryBuilder<AssetEntity>,
		role: string,
		userId: string,
		unit: string | null,
	): void {
		if (this.isAdminRole(role)) {
			return;
		}

		if (this.isManagerRole(role)) {
			if (!unit) {
				qb.andWhere('1 = 0');
				return;
			}
			qb.andWhere('asset.astUnit = :unit', { unit });
			return;
		}

		qb.andWhere(
			new Brackets((scope) => {
				scope.where('asset.astManagerId = :userId', { userId });
				if (unit) {
					scope.orWhere('asset.astUnit = :unit', { unit });
				}
			}),
		);
	}

	private canAccessAsset(role: string, userId: string, unit: string | null, asset: AssetEntity): boolean {
		if (this.isAdminRole(role)) return true;
		if (this.isManagerRole(role)) return !!unit && asset.astUnit === unit;
		if (asset.astManagerId === userId) return true;
		return !!unit && asset.astUnit === unit;
	}

	private ensureManagerOrAdmin(role: string): void {
		if (!this.isAdminRole(role) && !this.isManagerRole(role)) {
			throw new ForbiddenException('Only MANAGER or ADMIN can access logs.');
		}
	}

	private async buildAssetChangeLogRows(
		entityId: string,
		userId: string,
		role: string,
		query?: {
			asset_id?: string;
			field?: string;
			changed_by?: string;
			date_from?: string;
			date_to?: string;
			page?: number;
			size?: number;
		},
	): Promise<{ rows: any[]; page: number; size: number; totalCount: number; totalPages: number }> {
		this.ensureManagerOrAdmin(role);
		const unit = this.isManagerRole(role) ? await this.getUserUnit(userId) : null;

		const page = Math.max(1, Number(query?.page) || 1);
		const size = Math.min(200, Math.max(1, Number(query?.size) || 50));

		const qb = this.assetChangeLogRepository
			.createQueryBuilder('log')
			.leftJoinAndSelect('log.asset', 'asset')
			.leftJoinAndSelect('log.changedBy', 'changedBy')
			.where('asset.entId = :entityId', { entityId })
			.andWhere('asset.astDeletedAt IS NULL')
			.orderBy('log.aclCreatedAt', 'DESC');

		if (this.isManagerRole(role)) {
			if (!unit) {
				return { rows: [], page, size, totalCount: 0, totalPages: 0 };
			}
			qb.andWhere('asset.astUnit = :unit', { unit });
		}

		if (query?.asset_id) qb.andWhere('log.astId = :assetId', { assetId: query.asset_id });
		if (query?.field) qb.andWhere('log.aclField = :field', { field: query.field });
		if (query?.changed_by) qb.andWhere('log.aclChangedBy = :changedBy', { changedBy: query.changed_by });
		if (query?.date_from) qb.andWhere('log.aclCreatedAt >= :dateFrom', { dateFrom: new Date(query.date_from) });
		if (query?.date_to) qb.andWhere('log.aclCreatedAt <= :dateTo', { dateTo: new Date(query.date_to) });

		qb.skip((page - 1) * size).take(size);
		const [entities, totalCount] = await qb.getManyAndCount();
		const totalPages = Math.ceil(totalCount / size);

		const rows = entities.map((log) => ({
			logId: log.aclId,
			assetId: log.astId,
			assetCode: log.asset?.astCode || null,
			assetName: log.asset?.astName || null,
			field: log.aclField,
			beforeValue: log.aclBeforeValue,
			afterValue: log.aclAfterValue,
			reason: log.aclReason,
			changedBy: log.changedBy?.usrName || null,
			changedById: log.aclChangedBy,
			changedAt: log.aclCreatedAt.toISOString(),
		}));

		return { rows, page, size, totalCount, totalPages };
	}

	private async buildAssetRequestLogRows(
		entityId: string,
		userId: string,
		role: string,
		query?: {
			request_id?: string;
			to_status?: string;
			changed_by?: string;
			date_from?: string;
			date_to?: string;
			page?: number;
			size?: number;
		},
	): Promise<{ rows: any[]; page: number; size: number; totalCount: number; totalPages: number }> {
		this.ensureManagerOrAdmin(role);
		const unit = this.isManagerRole(role) ? await this.getUserUnit(userId) : null;

		const page = Math.max(1, Number(query?.page) || 1);
		const size = Math.min(200, Math.max(1, Number(query?.size) || 50));

		const qb = this.requestLogRepository
			.createQueryBuilder('log')
			.leftJoinAndSelect('log.request', 'request')
			.leftJoinAndSelect('request.requester', 'requester')
			.leftJoinAndSelect('request.asset', 'asset')
			.leftJoinAndSelect('log.changedBy', 'changedBy')
			.where('request.entId = :entityId', { entityId })
			.andWhere('request.asrDeletedAt IS NULL')
			.orderBy('log.arlCreatedAt', 'DESC');

		if (this.isManagerRole(role)) {
			if (!unit) {
				return { rows: [], page, size, totalCount: 0, totalPages: 0 };
			}
			qb.andWhere('requester.usrUnit = :unit', { unit });
		}

		if (query?.request_id) qb.andWhere('log.asrId = :requestId', { requestId: query.request_id });
		if (query?.to_status) qb.andWhere('log.arlToStatus = :toStatus', { toStatus: query.to_status });
		if (query?.changed_by) qb.andWhere('log.arlChangedBy = :changedBy', { changedBy: query.changed_by });
		if (query?.date_from) qb.andWhere('log.arlCreatedAt >= :dateFrom', { dateFrom: new Date(query.date_from) });
		if (query?.date_to) qb.andWhere('log.arlCreatedAt <= :dateTo', { dateTo: new Date(query.date_to) });

		qb.skip((page - 1) * size).take(size);
		const [entities, totalCount] = await qb.getManyAndCount();
		const totalPages = Math.ceil(totalCount / size);

		const rows = entities.map((log) => ({
			logId: log.arlId,
			requestId: log.asrId,
			requestNo: log.request?.asrRequestNo || null,
			requestType: log.request?.asrRequestType || null,
			requesterName: log.request?.requester?.usrName || null,
			assetName: log.request?.asset?.astName || null,
			fromStatus: log.arlFromStatus,
			toStatus: log.arlToStatus,
			reason: log.arlReason,
			changedBy: log.changedBy?.usrName || null,
			changedById: log.arlChangedBy,
			changedAt: log.arlCreatedAt.toISOString(),
		}));

		return { rows, page, size, totalCount, totalPages };
	}

	async getAssetChangeLogs(
		entityId: string,
		userId: string,
		role: string,
		query?: {
			asset_id?: string;
			field?: string;
			changed_by?: string;
			date_from?: string;
			date_to?: string;
			page?: number;
			size?: number;
		},
	) {
		const result = await this.buildAssetChangeLogRows(entityId, userId, role, query);
		return {
			data: result.rows,
			pagination: {
				page: result.page,
				size: result.size,
				totalCount: result.totalCount,
				totalPages: result.totalPages,
				hasNext: result.page < result.totalPages,
				hasPrev: result.page > 1,
			},
		};
	}

	async getAssetRequestLogs(
		entityId: string,
		userId: string,
		role: string,
		query?: {
			request_id?: string;
			to_status?: string;
			changed_by?: string;
			date_from?: string;
			date_to?: string;
			page?: number;
			size?: number;
		},
	) {
		const result = await this.buildAssetRequestLogRows(entityId, userId, role, query);
		return {
			data: result.rows,
			pagination: {
				page: result.page,
				size: result.size,
				totalCount: result.totalCount,
				totalPages: result.totalPages,
				hasNext: result.page < result.totalPages,
				hasPrev: result.page > 1,
			},
		};
	}

	async exportAssetChangeLogsExcel(
		entityId: string,
		userId: string,
		role: string,
		query?: {
			asset_id?: string;
			field?: string;
			changed_by?: string;
			date_from?: string;
			date_to?: string;
		},
	): Promise<Buffer> {
		const result = await this.buildAssetChangeLogRows(entityId, userId, role, { ...query, page: 1, size: 5000 });

		const wb = new ExcelJS.Workbook();
		const ws = wb.addWorksheet('Asset Change Logs');
		ws.columns = [
			{ header: 'Changed At', key: 'changedAt', width: 24 },
			{ header: 'Asset Code', key: 'assetCode', width: 18 },
			{ header: 'Asset Name', key: 'assetName', width: 24 },
			{ header: 'Field', key: 'field', width: 18 },
			{ header: 'Before', key: 'beforeValue', width: 28 },
			{ header: 'After', key: 'afterValue', width: 28 },
			{ header: 'Reason', key: 'reason', width: 30 },
			{ header: 'Changed By', key: 'changedBy', width: 20 },
		];

		for (const row of result.rows) {
			ws.addRow(row);
		}

		const buffer = await wb.xlsx.writeBuffer();
		return Buffer.from(buffer);
	}

	async exportAssetRequestLogsExcel(
		entityId: string,
		userId: string,
		role: string,
		query?: {
			request_id?: string;
			to_status?: string;
			changed_by?: string;
			date_from?: string;
			date_to?: string;
		},
	): Promise<Buffer> {
		const result = await this.buildAssetRequestLogRows(entityId, userId, role, { ...query, page: 1, size: 5000 });

		const wb = new ExcelJS.Workbook();
		const ws = wb.addWorksheet('Asset Request Logs');
		ws.columns = [
			{ header: 'Changed At', key: 'changedAt', width: 24 },
			{ header: 'Request No', key: 'requestNo', width: 20 },
			{ header: 'Request Type', key: 'requestType', width: 20 },
			{ header: 'Requester', key: 'requesterName', width: 20 },
			{ header: 'Asset', key: 'assetName', width: 24 },
			{ header: 'From Status', key: 'fromStatus', width: 16 },
			{ header: 'To Status', key: 'toStatus', width: 16 },
			{ header: 'Reason', key: 'reason', width: 30 },
			{ header: 'Changed By', key: 'changedBy', width: 20 },
		];

		for (const row of result.rows) {
			ws.addRow(row);
		}

		const buffer = await wb.xlsx.writeBuffer();
		return Buffer.from(buffer);
	}

	async getOperationalMetrics(
		entityId: string,
		userId: string,
		role: string,
	): Promise<AssetOpsMetricsResponse> {
		this.ensureManagerOrAdmin(role);

		const startedDashboard = Date.now();
		await this.getDashboard(entityId, userId, role);
		const dashboardQueryMs = Date.now() - startedDashboard;

		const startedRisk = Date.now();
		await this.getRiskReport(entityId, userId, role, 10);
		const riskQueryMs = Date.now() - startedRisk;

		const startedCalendar = Date.now();
		await this.getMeetingRoomCalendar(entityId, userId, role, 'day');
		const calendarQueryMs = Date.now() - startedCalendar;

		const [assets, requests, requestLogs, changeLogs] = await Promise.all([
			this.assetRepository.count({ where: { entId: entityId } }),
			this.requestRepository.count({ where: { entId: entityId } }),
			this.requestLogRepository
				.createQueryBuilder('log')
				.leftJoin('log.request', 'request')
				.where('request.entId = :entityId', { entityId })
				.getCount(),
			this.assetChangeLogRepository
				.createQueryBuilder('log')
				.leftJoin('log.asset', 'asset')
				.where('asset.entId = :entityId', { entityId })
				.getCount(),
		]);

		return {
			generatedAt: new Date().toISOString(),
			dataVolume: {
				assets,
				requests,
				requestLogs,
				changeLogs,
			},
			processing: {
				dashboardQueryMs,
				riskQueryMs,
				calendarQueryMs,
			},
		};
	}

	async getRetentionStatus(
		entityId: string,
		userId: string,
		role: string,
	): Promise<AssetRetentionStatusResponse> {
		this.ensureManagerOrAdmin(role);

		const oldestChangeLog = await this.assetChangeLogRepository
			.createQueryBuilder('log')
			.leftJoin('log.asset', 'asset')
			.where('asset.entId = :entityId', { entityId })
			.orderBy('log.aclCreatedAt', 'ASC')
			.getOne();

		const oldestRequestLog = await this.requestLogRepository
			.createQueryBuilder('log')
			.leftJoin('log.request', 'request')
			.where('request.entId = :entityId', { entityId })
			.orderBy('log.arlCreatedAt', 'ASC')
			.getOne();

		const oldestChangeAt = oldestChangeLog?.aclCreatedAt || null;
		const oldestRequestAt = oldestRequestLog?.arlCreatedAt || null;
		const oldestAt = [oldestChangeAt, oldestRequestAt]
			.filter((v): v is Date => !!v)
			.sort((a, b) => a.getTime() - b.getTime())[0] || null;

		const fiveYearsMs = 1000 * 60 * 60 * 24 * 365 * 5;
		const withinPolicy = !oldestAt || (Date.now() - oldestAt.getTime()) <= fiveYearsMs;

		return {
			generatedAt: new Date().toISOString(),
			policy: {
				minimumRetentionYears: 5,
				deleteProtection: true,
			},
			oldestRecords: {
				assetChangeLogAt: oldestChangeAt ? oldestChangeAt.toISOString() : null,
				requestStatusLogAt: oldestRequestAt ? oldestRequestAt.toISOString() : null,
			},
			compliance: {
				withinPolicy,
				note: withinPolicy
					? 'Current records are preserved within the configured 5-year policy window.'
					: 'Some records are older than 5 years; verify archival strategy and legal retention requirements.',
			},
		};
	}

	async getIntegrationReadiness(
		role: string,
	): Promise<AssetIntegrationReadinessResponse> {
		this.ensureManagerOrAdmin(role);

		return {
			generatedAt: new Date().toISOString(),
			integrations: {
				sso: {
					required: true,
					implemented: false,
					note: 'SSO integration is out of current asset domain scope and requires auth platform integration.',
				},
				accountLockPolicy: {
					required: true,
					implemented: false,
					note: 'Account lock policy is managed in auth domain and not yet integrated with centralized policy engine.',
				},
			},
		};
	}

	private getDateRange(from?: string, to?: string): { from: Date; to: Date } {
		const now = new Date();
		const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
		const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
		const parsedFrom = from ? new Date(from) : defaultFrom;
		const parsedTo = to ? new Date(to) : defaultTo;

		if (Number.isNaN(parsedFrom.getTime()) || Number.isNaN(parsedTo.getTime())) {
			throw new BadRequestException('Invalid date range.');
		}
		if (parsedFrom > parsedTo) {
			throw new BadRequestException('from must be earlier than to.');
		}
		return { from: parsedFrom, to: parsedTo };
	}

	private getWeekRange(baseDate: Date): { from: Date; to: Date } {
		const day = baseDate.getDay();
		const diffToMonday = day === 0 ? -6 : 1 - day;
		const from = new Date(baseDate);
		from.setDate(baseDate.getDate() + diffToMonday);
		from.setHours(0, 0, 0, 0);

		const to = new Date(from);
		to.setDate(from.getDate() + 6);
		to.setHours(23, 59, 59, 999);
		return { from, to };
	}

	private createDaySlots(baseDate: Date, availableFrom: string | null, availableTo: string | null): Array<{ startAt: Date; endAt: Date }> {
		if (!availableFrom || !availableTo) return [];

		const [fromHour, fromMinute] = availableFrom.split(':').map(Number);
		const [toHour, toMinute] = availableTo.split(':').map(Number);
		if ([fromHour, fromMinute, toHour, toMinute].some((v) => Number.isNaN(v))) return [];

		const rangeStart = new Date(baseDate);
		rangeStart.setHours(fromHour, fromMinute, 0, 0);

		const rangeEnd = new Date(baseDate);
		rangeEnd.setHours(toHour, toMinute, 0, 0);

		if (rangeStart >= rangeEnd) return [];

		const slots: Array<{ startAt: Date; endAt: Date }> = [];
		const cursor = new Date(rangeStart);
		while (cursor < rangeEnd) {
			const next = new Date(cursor);
			next.setHours(next.getHours() + 1);
			slots.push({
				startAt: new Date(cursor),
				endAt: next > rangeEnd ? new Date(rangeEnd) : next,
			});
			cursor.setHours(cursor.getHours() + 1);
		}
		return slots;
	}

	async getDashboard(
		entityId: string,
		userId: string,
		role: string,
		from?: string,
		to?: string,
	): Promise<AssetDashboardResponse> {
		if (!this.isAdminRole(role) && !this.isManagerRole(role)) {
			throw new ForbiddenException('Only MANAGER or ADMIN can access dashboard statistics.');
		}

		const unit = this.isManagerRole(role) ? await this.getUserUnit(userId) : null;
		const range = this.getDateRange(from, to);

		const assetBaseQb = this.assetRepository
			.createQueryBuilder('asset')
			.where('asset.entId = :entityId', { entityId })
			.andWhere('asset.astDeletedAt IS NULL');
		this.applyAssetScope(assetBaseQb, role, userId, unit);

		const totalAssets = await assetBaseQb.getCount();
		const inUseAssets = await assetBaseQb.clone().andWhere('asset.astStatus = :status', { status: 'IN_USE' }).getCount();
		const reservedAssets = await assetBaseQb.clone().andWhere('asset.astStatus = :status', { status: 'RESERVED' }).getCount();
		const storedAssets = await assetBaseQb.clone().andWhere('asset.astStatus = :status', { status: 'STORED' }).getCount();

		const totalRequests = await this.requestRepository
			.createQueryBuilder('req')
			.leftJoin('req.requester', 'requester')
			.leftJoin('req.asset', 'asset')
			.where('req.entId = :entityId', { entityId })
			.andWhere(this.isManagerRole(role) ? 'requester.usrUnit = :unit' : '1=1', { unit })
			.andWhere('req.asrCreatedAt >= :from', { from: range.from })
			.andWhere('req.asrCreatedAt <= :to', { to: range.to })
			.andWhere('req.asrDeletedAt IS NULL')
			.getCount();

		const approvedRequests = await this.requestRepository
			.createQueryBuilder('req')
			.leftJoin('req.requester', 'requester')
			.where('req.entId = :entityId', { entityId })
			.andWhere(this.isManagerRole(role) ? 'requester.usrUnit = :unit' : '1=1', { unit })
			.andWhere('req.asrCreatedAt >= :from', { from: range.from })
			.andWhere('req.asrCreatedAt <= :to', { to: range.to })
			.andWhere('req.asrStatus IN (:...statuses)', {
				statuses: ['FINAL_APPROVED', 'IN_USE', 'COMPLETED', 'RETURN_DELAYED'],
			})
			.andWhere('req.asrDeletedAt IS NULL')
			.getCount();

		const rejectedRequests = await this.requestRepository
			.createQueryBuilder('req')
			.leftJoin('req.requester', 'requester')
			.where('req.entId = :entityId', { entityId })
			.andWhere(this.isManagerRole(role) ? 'requester.usrUnit = :unit' : '1=1', { unit })
			.andWhere('req.asrCreatedAt >= :from', { from: range.from })
			.andWhere('req.asrCreatedAt <= :to', { to: range.to })
			.andWhere('req.asrStatus = :status', { status: 'REJECTED' })
			.andWhere('req.asrDeletedAt IS NULL')
			.getCount();

		const delayedReturns = await this.requestRepository
			.createQueryBuilder('req')
			.leftJoin('req.requester', 'requester')
			.where('req.entId = :entityId', { entityId })
			.andWhere(this.isManagerRole(role) ? 'requester.usrUnit = :unit' : '1=1', { unit })
			.andWhere('req.asrStatus = :status', { status: 'RETURN_DELAYED' })
			.andWhere('req.asrDeletedAt IS NULL')
			.getCount();

		const categoryRows = await this.requestRepository
			.createQueryBuilder('req')
			.leftJoin('req.requester', 'requester')
			.leftJoin('req.asset', 'asset')
			.select('COALESCE(asset.astCategory, req.asrAssetCategory)', 'category')
			.addSelect('COUNT(*)', 'usageCount')
			.where('req.entId = :entityId', { entityId })
			.andWhere(this.isManagerRole(role) ? 'requester.usrUnit = :unit' : '1=1', { unit })
			.andWhere('req.asrStartAt >= :from', { from: range.from })
			.andWhere('req.asrStartAt <= :to', { to: range.to })
			.andWhere('req.asrStatus IN (:...statuses)', {
				statuses: ['FINAL_APPROVED', 'IN_USE', 'COMPLETED', 'RETURN_DELAYED'],
			})
			.andWhere('req.asrDeletedAt IS NULL')
			.groupBy('COALESCE(asset.astCategory, req.asrAssetCategory)')
			.orderBy('usageCount', 'DESC')
			.getRawMany<{ category: string | null; usageCount: string }>();

		const usageRate = totalAssets > 0 ? Number((((inUseAssets / totalAssets) * 100)).toFixed(2)) : 0;
		const reservationRate = totalAssets > 0 ? Number((((reservedAssets / totalAssets) * 100)).toFixed(2)) : 0;

		return {
			period: {
				from: range.from.toISOString(),
				to: range.to.toISOString(),
			},
			assetSummary: {
				totalAssets,
				inUseAssets,
				reservedAssets,
				storedAssets,
				usageRate,
				reservationRate,
			},
			requestSummary: {
				totalRequests,
				approvedRequests,
				rejectedRequests,
				delayedReturns,
			},
			categoryUsage: categoryRows.map((row) => ({
				category: row.category || 'UNKNOWN',
				usageCount: Number(row.usageCount),
			})),
		};
	}

	async getRiskReport(entityId: string, userId: string, role: string, limit = 20): Promise<AssetRiskReportResponse> {
		if (!this.isAdminRole(role) && !this.isManagerRole(role)) {
			throw new ForbiddenException('Only MANAGER or ADMIN can access risk report.');
		}

		const unit = this.isManagerRole(role) ? await this.getUserUnit(userId) : null;
		const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20;
		const now = new Date();

		const overdueEntities = await this.requestRepository
			.createQueryBuilder('req')
			.leftJoinAndSelect('req.requester', 'requester')
			.leftJoinAndSelect('req.asset', 'asset')
			.where('req.entId = :entityId', { entityId })
			.andWhere(this.isManagerRole(role) ? 'requester.usrUnit = :unit' : '1=1', { unit })
			.andWhere('req.asrStatus = :status', { status: 'RETURN_DELAYED' })
			.andWhere('req.asrReturnedAt IS NULL')
			.andWhere('req.asrDeletedAt IS NULL')
			.orderBy('req.asrEndAt', 'ASC')
			.take(safeLimit)
			.getMany();

		const overuseEntities = await this.requestRepository
			.createQueryBuilder('req')
			.leftJoinAndSelect('req.requester', 'requester')
			.leftJoinAndSelect('req.asset', 'asset')
			.where('req.entId = :entityId', { entityId })
			.andWhere(this.isManagerRole(role) ? 'requester.usrUnit = :unit' : '1=1', { unit })
			.andWhere('req.asrEndAt < :now', { now })
			.andWhere('req.asrReturnedAt IS NULL')
			.andWhere('req.asrStatus IN (:...statuses)', { statuses: ['IN_USE', 'FINAL_APPROVED', 'RETURN_DELAYED'] })
			.andWhere('req.asrDeletedAt IS NULL')
			.orderBy('req.asrEndAt', 'ASC')
			.take(safeLimit)
			.getMany();

		const extensionRows = await this.requestRepository
			.createQueryBuilder('req')
			.leftJoin('req.requester', 'requester')
			.select('req.asrRequesterId', 'requesterId')
			.addSelect('requester.usrName', 'requesterName')
			.addSelect('COUNT(*)', 'extensionCount')
			.where('req.entId = :entityId', { entityId })
			.andWhere(this.isManagerRole(role) ? 'requester.usrUnit = :unit' : '1=1', { unit })
			.andWhere('req.asrRequestType = :requestType', { requestType: 'EXTENSION' })
			.andWhere('req.asrDeletedAt IS NULL')
			.groupBy('req.asrRequesterId')
			.addGroupBy('requester.usrName')
			.orderBy('extensionCount', 'DESC')
			.take(10)
			.getRawMany<{ requesterId: string; requesterName: string | null; extensionCount: string }>();

		return {
			generatedAt: new Date().toISOString(),
			overdueReturns: overdueEntities.map((req) => ({
				requestId: req.asrId,
				requestNo: req.asrRequestNo,
				requesterName: req.requester?.usrName || null,
				assetName: req.asset?.astName || null,
				endAt: req.asrEndAt.toISOString(),
				delayedDays: Math.max(1, Math.floor((now.getTime() - req.asrEndAt.getTime()) / (1000 * 60 * 60 * 24))),
			})),
			overuseRequests: overuseEntities.map((req) => ({
				requestId: req.asrId,
				requestNo: req.asrRequestNo,
				requesterName: req.requester?.usrName || null,
				assetName: req.asset?.astName || null,
				status: req.asrStatus,
				endAt: req.asrEndAt.toISOString(),
			})),
			frequentExtensionUsers: extensionRows.map((row) => ({
				requesterId: row.requesterId,
				requesterName: row.requesterName,
				extensionCount: Number(row.extensionCount),
			})),
		};
	}

	async getMeetingRoomCalendar(
		entityId: string,
		userId: string,
		role: string,
		view: 'day' | 'week',
		date?: string,
	): Promise<MeetingRoomCalendarResponse> {
		const unit = !this.isAdminRole(role) ? await this.getUserUnit(userId) : null;

		const baseDate = date ? new Date(date) : new Date();
		if (Number.isNaN(baseDate.getTime())) {
			throw new BadRequestException('Invalid date.');
		}

		const dayStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
		const dayEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);
		const weekRange = this.getWeekRange(baseDate);
		const range = view === 'week' ? weekRange : { from: dayStart, to: dayEnd };

		const rooms = await this.assetRepository.find({
			where: {
				entId: entityId,
				astCategory: 'MEETING_ROOM',
				...(this.isManagerRole(role) && unit ? { astUnit: unit } : {}),
			},
			order: { astName: 'ASC' },
		});

		if (rooms.length === 0) {
			return {
				view,
				range: { from: range.from.toISOString(), to: range.to.toISOString() },
				rooms: [],
			};
		}

		const roomIds = rooms.map((room) => room.astId);
		const requestQb = this.requestRepository
			.createQueryBuilder('req')
			.leftJoinAndSelect('req.requester', 'requester')
			.leftJoinAndSelect('req.asset', 'asset')
			.where('req.entId = :entityId', { entityId })
			.andWhere('req.astId IN (:...roomIds)', { roomIds })
			.andWhere('req.asrRequestType = :requestType', { requestType: 'MEETING_ROOM_RESERVATION' })
			.andWhere('req.asrStartAt < :rangeEnd', { rangeEnd: range.to })
			.andWhere('req.asrEndAt > :rangeStart', { rangeStart: range.from })
			.andWhere('req.asrStatus IN (:...statuses)', {
				statuses: ['SUBMITTED', 'L1_APPROVED', 'FINAL_APPROVED', 'IN_USE', 'COMPLETED', 'RETURN_DELAYED'],
			})
			.andWhere('req.asrDeletedAt IS NULL')
			.orderBy('req.asrStartAt', 'ASC');

		if (!this.isAdminRole(role) && unit) {
			requestQb.andWhere('requester.usrUnit = :unit', { unit });
		}

		const requestEntities = await requestQb.getMany();

		const requestByRoom = new Map<string, AssetRequestEntity[]>();
		for (const request of requestEntities) {
			if (!request.astId) continue;
			const arr = requestByRoom.get(request.astId) || [];
			arr.push(request);
			requestByRoom.set(request.astId, arr);
		}

		const now = new Date();
		const roomsPayload = rooms.map((room) => {
			const reservations = requestByRoom.get(room.astId) || [];
			const hasInUse = reservations.some((r) => r.asrStartAt <= now && r.asrEndAt >= now);
			const hasReserved = reservations.some((r) => r.asrStartAt > now);
			const status: 'AVAILABLE' | 'RESERVED' | 'IN_USE' = hasInUse
				? 'IN_USE'
				: hasReserved
					? 'RESERVED'
					: 'AVAILABLE';

			const roomData: MeetingRoomCalendarResponse['rooms'][number] = {
				roomId: room.astId,
				roomCode: room.astCode,
				roomName: room.astName,
				location: room.astLocation,
				capacity: room.astRoomCapacity,
				status,
				reservations: reservations.map((r) => ({
					requestId: r.asrId,
					requestNo: r.asrRequestNo,
					title: `${r.asrRequestType}`,
					requesterName: r.requester?.usrName || null,
					startAt: r.asrStartAt.toISOString(),
					endAt: r.asrEndAt.toISOString(),
					requestStatus: r.asrStatus,
				})),
			};

			if (view === 'day') {
				const slots = this.createDaySlots(baseDate, room.astRoomAvailableFrom, room.astRoomAvailableTo);
				const freeSlots = slots.filter((slot) =>
					!reservations.some((reservation) => reservation.asrStartAt < slot.endAt && reservation.asrEndAt > slot.startAt),
				);
				roomData.availableSlots = freeSlots.map((slot) => ({
					startAt: slot.startAt.toISOString(),
					endAt: slot.endAt.toISOString(),
				}));
			}

			return roomData;
		});

		return {
			view,
			range: {
				from: range.from.toISOString(),
				to: range.to.toISOString(),
			},
			rooms: roomsPayload,
		};
	}

	private generateAssetCode(): string {
		const d = new Date();
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const rnd = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
		return `AST-${y}${m}${day}-${rnd}`;
	}

	async findAll(
		entityId: string,
		userId: string,
		role: string,
		query?: { category?: string; status?: string; q?: string },
	): Promise<AssetResponse[]> {
		const unit = await this.getUserUnit(userId);

		const qb = this.assetRepository
			.createQueryBuilder('asset')
			.leftJoinAndSelect('asset.manager', 'manager')
			.where('asset.entId = :entityId', { entityId })
			.andWhere('asset.astDeletedAt IS NULL')
			.orderBy('asset.astCreatedAt', 'DESC');

		this.applyAssetScope(qb, role, userId, unit);

		if (query?.category) {
			qb.andWhere('asset.astCategory = :category', { category: query.category });
		}
		if (query?.status) {
			qb.andWhere('asset.astStatus = :status', { status: query.status });
		}
		if (query?.q) {
			qb.andWhere('(asset.astCode ILIKE :q OR asset.astName ILIKE :q OR asset.astModelName ILIKE :q)', {
				q: `%${query.q}%`,
			});
		}

		const entities = await qb.getMany();
		return entities.map(AssetMapper.toResponse);
	}

	async findById(assetId: string, entityId: string, userId: string, role: string): Promise<AssetResponse> {
		const unit = await this.getUserUnit(userId);

		const entity = await this.assetRepository.findOne({
			where: { astId: assetId, entId: entityId },
			relations: ['manager'],
		});

		if (!entity) {
			throw new NotFoundException(ERROR_CODE.ASSET_NOT_FOUND.message);
		}

		if (!this.canAccessAsset(role, userId, unit, entity)) {
			throw new ForbiddenException('Access denied for this asset.');
		}

		return AssetMapper.toResponse(entity);
	}

	// ──────────────────────────────────────────────
	// Excel Import (Template + Bulk Upload)
	// ──────────────────────────────────────────────

	async generateImportTemplate(): Promise<Buffer> {
		const wb = new ExcelJS.Workbook();

		// Sheet 1: Data
		const ws = wb.addWorksheet('Asset Data');
		const columns = [
			{ header: 'asset_name *', key: 'asset_name', width: 30 },
			{ header: 'asset_category *', key: 'asset_category', width: 18 },
			{ header: 'ownership_type *', key: 'ownership_type', width: 16 },
			{ header: 'status', key: 'status', width: 14 },
			{ header: 'quantity', key: 'quantity', width: 10 },
			{ header: 'unit', key: 'unit', width: 20 },
			{ header: 'location', key: 'location', width: 25 },
			{ header: 'manufacturer', key: 'manufacturer', width: 20 },
			{ header: 'model_name', key: 'model_name', width: 20 },
			{ header: 'serial_no', key: 'serial_no', width: 20 },
			{ header: 'barcode', key: 'barcode', width: 20 },
			{ header: 'purchase_date', key: 'purchase_date', width: 14 },
			{ header: 'vendor', key: 'vendor', width: 20 },
			{ header: 'currency', key: 'currency', width: 10 },
			{ header: 'purchase_amount', key: 'purchase_amount', width: 16 },
			{ header: 'depreciation_years', key: 'depreciation_years', width: 18 },
			{ header: 'residual_value', key: 'residual_value', width: 16 },
		];
		ws.columns = columns;

		// Header style
		const headerRow = ws.getRow(1);
		headerRow.eachCell((cell, colNumber) => {
			cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
			cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colNumber <= 3 ? 'FF4472C4' : 'FF70AD47' } };
			cell.alignment = { horizontal: 'center', vertical: 'middle' };
			cell.border = {
				top: { style: 'thin' }, bottom: { style: 'thin' },
				left: { style: 'thin' }, right: { style: 'thin' },
			};
		});

		// Data validation dropdowns
		const categoryList = '"IT_EQUIPMENT,SUPPLY,FACILITY,MEETING_ROOM"';
		const ownershipList = '"PURCHASE,LEASE,OTHER"';
		const statusList = '"STORED,IN_USE,RESERVED"';
		const currencyList = '"USD,KRW,VND"';

		for (let row = 2; row <= 501; row++) {
			ws.getCell(`B${row}`).dataValidation = { type: 'list', formulae: [categoryList], showErrorMessage: true, errorTitle: 'Invalid', error: 'Select from list' };
			ws.getCell(`C${row}`).dataValidation = { type: 'list', formulae: [ownershipList], showErrorMessage: true, errorTitle: 'Invalid', error: 'Select from list' };
			ws.getCell(`D${row}`).dataValidation = { type: 'list', formulae: [statusList], showErrorMessage: true, errorTitle: 'Invalid', error: 'Select from list' };
			ws.getCell(`N${row}`).dataValidation = { type: 'list', formulae: [currencyList], showErrorMessage: true, errorTitle: 'Invalid', error: 'Select from list' };
		}

		// Sample data rows
		const sampleData = [
			{
				asset_name: '사무용 책상 (Standing Desk)',
				asset_category: 'FACILITY',
				ownership_type: 'PURCHASE',
				status: 'IN_USE',
				quantity: 10,
				unit: 'Admin',
				location: 'HQ 2F Office',
				manufacturer: 'IKEA',
				model_name: 'BEKANT',
				serial_no: '',
				barcode: '',
				purchase_date: '2025-06-01',
				vendor: 'IKEA Vietnam',
				currency: 'VND',
				purchase_amount: '5500000',
				depreciation_years: 10,
				residual_value: '500000',
			},
			{
				asset_name: '사무용 의자 (Ergonomic Chair)',
				asset_category: 'FACILITY',
				ownership_type: 'PURCHASE',
				status: 'IN_USE',
				quantity: 10,
				unit: 'Admin',
				location: 'HQ 2F Office',
				manufacturer: 'Herman Miller',
				model_name: 'Aeron',
				serial_no: '',
				barcode: '',
				purchase_date: '2025-06-01',
				vendor: 'Office Depot',
				currency: 'USD',
				purchase_amount: '1395.00',
				depreciation_years: 7,
				residual_value: '200.00',
			},
			{
				asset_name: '업무용 PC (Desktop)',
				asset_category: 'IT_EQUIPMENT',
				ownership_type: 'PURCHASE',
				status: 'STORED',
				quantity: 5,
				unit: 'Dev Team',
				location: 'HQ 3F Server Room',
				manufacturer: 'Dell',
				model_name: 'OptiPlex 7020',
				serial_no: 'SN-DELL-7020-001',
				barcode: 'BC-PC-001',
				purchase_date: '2026-01-10',
				vendor: 'Dell Korea',
				currency: 'KRW',
				purchase_amount: '1850000',
				depreciation_years: 5,
				residual_value: '200000',
			},
			{
				asset_name: '화상회의 카메라',
				asset_category: 'IT_EQUIPMENT',
				ownership_type: 'PURCHASE',
				status: 'IN_USE',
				quantity: 3,
				unit: 'Admin',
				location: 'HQ 5F Meeting Room',
				manufacturer: 'Logitech',
				model_name: 'Rally Bar',
				serial_no: 'SN-LOGI-RALLY-001',
				barcode: '',
				purchase_date: '2025-11-20',
				vendor: 'Amazon',
				currency: 'USD',
				purchase_amount: '2999.00',
				depreciation_years: 5,
				residual_value: '300.00',
			},
			{
				asset_name: '업무용 차량 (Sedan)',
				asset_category: 'FACILITY',
				ownership_type: 'LEASE',
				status: 'IN_USE',
				quantity: 1,
				unit: 'Sales',
				location: 'HQ B1 Parking',
				manufacturer: 'Hyundai',
				model_name: 'Sonata DN8',
				serial_no: 'VIN-KMHL-12345',
				barcode: '',
				purchase_date: '2025-03-01',
				vendor: 'Hyundai Leasing',
				currency: 'KRW',
				purchase_amount: '35000000',
				depreciation_years: 5,
				residual_value: '10000000',
			},
			{
				asset_name: '대회의실 A (Conference Room A)',
				asset_category: 'MEETING_ROOM',
				ownership_type: 'PURCHASE',
				status: 'IN_USE',
				quantity: 1,
				unit: 'Admin',
				location: 'HQ 5F',
				manufacturer: '',
				model_name: '',
				serial_no: '',
				barcode: '',
				purchase_date: '',
				vendor: '',
				currency: 'USD',
				purchase_amount: '',
				depreciation_years: '',
				residual_value: '',
			},
		];

		sampleData.forEach((row) => ws.addRow(row));

		// Style sample rows as italic gray
		for (let r = 2; r <= sampleData.length + 1; r++) {
			ws.getRow(r).font = { italic: true, color: { argb: 'FF808080' } };
		}

		// Sheet 2: Guide
		const guide = wb.addWorksheet('Guide');
		guide.columns = [
			{ header: 'Column', key: 'col', width: 22 },
			{ header: 'Required', key: 'req', width: 10 },
			{ header: 'Description', key: 'desc', width: 50 },
			{ header: 'Allowed Values', key: 'values', width: 40 },
		];
		const guideHeaderRow = guide.getRow(1);
		guideHeaderRow.eachCell((cell) => {
			cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
			cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
		});

		const guideData = [
			['asset_name', 'YES', 'Name of the asset (max 200 chars)', ''],
			['asset_category', 'YES', 'Category of the asset', 'IT_EQUIPMENT, SUPPLY, FACILITY, MEETING_ROOM, VEHICLE'],
			['ownership_type', 'YES', 'How the asset is owned', 'PURCHASE, LEASE, OTHER'],
			['status', 'NO', 'Initial status (default: STORED)', 'STORED, IN_USE, RESERVED'],
			['quantity', 'NO', 'Number of units (default: 1)', 'Integer'],
			['unit', 'NO', 'Department or unit name', ''],
			['location', 'NO', 'Physical location', ''],
			['manufacturer', 'NO', 'Manufacturer name', ''],
			['model_name', 'NO', 'Model name or number', ''],
			['serial_no', 'NO', 'Serial number', ''],
			['barcode', 'NO', 'Barcode value', ''],
			['purchase_date', 'NO', 'Date of purchase', 'YYYY-MM-DD'],
			['vendor', 'NO', 'Vendor / supplier name', ''],
			['currency', 'NO', 'Currency code (default: USD)', 'USD, KRW, VND'],
			['purchase_amount', 'NO', 'Purchase price', 'Number (e.g., 1500.00)'],
			['depreciation_years', 'NO', 'Depreciation period in years', 'Integer'],
			['residual_value', 'NO', 'Residual value after depreciation', 'Number (e.g., 200.00)'],
		];
		guideData.forEach((row) => guide.addRow({ col: row[0], req: row[1], desc: row[2], values: row[3] }));

		const buffer = await wb.xlsx.writeBuffer();
		return Buffer.from(buffer);
	}

	async importFromExcel(
		buffer: Buffer,
		userId: string,
		role: string,
		entityId: string,
	): Promise<{
		totalRows: number;
		successCount: number;
		failCount: number;
		errors: { row: number; field: string; message: string }[];
	}> {
		if (!this.isAdminRole(role) && !this.isManagerRole(role)) {
			throw new ForbiddenException('Only MANAGER or ADMIN can import assets.');
		}

		const wb = new ExcelJS.Workbook();
		await wb.xlsx.load(buffer as any);
		const ws = wb.getWorksheet(1);
		if (!ws) throw new BadRequestException('No worksheet found in uploaded file.');

		// Parse header row
		const headerRow = ws.getRow(1);
		const colMap: Record<string, number> = {};
		headerRow.eachCell((cell, colNumber) => {
			const val = String(cell.value || '').replace(/\s*\*\s*/g, '').trim().toLowerCase();
			colMap[val] = colNumber;
		});

		// Validate required columns exist
		const requiredCols = ['asset_name', 'asset_category', 'ownership_type'];
		for (const col of requiredCols) {
			if (!colMap[col]) {
				throw new BadRequestException(`Missing required column: ${col}. Please use the template.`);
			}
		}

		const VALID_CATEGORIES = ['IT_EQUIPMENT', 'SUPPLY', 'FACILITY', 'MEETING_ROOM'];
		const VALID_OWNERSHIPS = ['PURCHASE', 'LEASE', 'OTHER'];
		const VALID_STATUSES = ['STORED', 'IN_USE', 'RESERVED'];
		const VALID_CURRENCIES = ['USD', 'KRW', 'VND'];

		const errors: { row: number; field: string; message: string }[] = [];
		const validRows: {
			rowNum: number;
			data: {
				asset_name: string; asset_category: string; ownership_type: string;
				status: string; quantity: number; unit: string | null; location: string | null;
				manufacturer: string | null; model_name: string | null; serial_no: string | null;
				barcode: string | null; purchase_date: string | null; vendor: string | null;
				currency: string; purchase_amount: string | null;
				depreciation_years: number | null; residual_value: string | null;
			};
		}[] = [];

		const getCellStr = (row: ExcelJS.Row, col: string): string => {
			const idx = colMap[col];
			if (!idx) return '';
			const v = row.getCell(idx).value;
			if (v === null || v === undefined) return '';
			if (typeof v === 'object' && 'text' in v) return String((v as any).text || '');
			return String(v).trim();
		};

		let totalRows = 0;
		ws.eachRow((row, rowNumber) => {
			if (rowNumber <= 1) return; // skip header
			const name = getCellStr(row, 'asset_name');
			if (!name) return; // skip empty rows
			totalRows++;

			if (totalRows > 500) {
				errors.push({ row: rowNumber, field: 'general', message: 'Exceeded maximum 500 rows' });
				return;
			}

			const category = getCellStr(row, 'asset_category').toUpperCase();
			const ownership = getCellStr(row, 'ownership_type').toUpperCase();
			const status = getCellStr(row, 'status').toUpperCase() || 'STORED';
			const quantityStr = getCellStr(row, 'quantity');
			const currency = getCellStr(row, 'currency').toUpperCase() || 'USD';
			const purchaseAmount = getCellStr(row, 'purchase_amount');
			const depYearsStr = getCellStr(row, 'depreciation_years');
			const residualStr = getCellStr(row, 'residual_value');
			const purchaseDate = getCellStr(row, 'purchase_date');

			// Validate required fields
			if (!category) { errors.push({ row: rowNumber, field: 'asset_category', message: 'Required' }); return; }
			if (!ownership) { errors.push({ row: rowNumber, field: 'ownership_type', message: 'Required' }); return; }

			// Validate enum values
			if (!VALID_CATEGORIES.includes(category)) {
				errors.push({ row: rowNumber, field: 'asset_category', message: `Invalid: "${category}". Use: ${VALID_CATEGORIES.join(', ')}` }); return;
			}
			if (!VALID_OWNERSHIPS.includes(ownership)) {
				errors.push({ row: rowNumber, field: 'ownership_type', message: `Invalid: "${ownership}". Use: ${VALID_OWNERSHIPS.join(', ')}` }); return;
			}
			if (!VALID_STATUSES.includes(status)) {
				errors.push({ row: rowNumber, field: 'status', message: `Invalid: "${status}". Use: ${VALID_STATUSES.join(', ')}` }); return;
			}
			if (!VALID_CURRENCIES.includes(currency)) {
				errors.push({ row: rowNumber, field: 'currency', message: `Invalid: "${currency}". Use: ${VALID_CURRENCIES.join(', ')}` }); return;
			}

			// Validate numbers
			const quantity = quantityStr ? parseInt(quantityStr, 10) : 1;
			if (isNaN(quantity) || quantity < 1) {
				errors.push({ row: rowNumber, field: 'quantity', message: 'Must be a positive integer' }); return;
			}
			const depYears = depYearsStr ? parseInt(depYearsStr, 10) : null;
			if (depYearsStr && (isNaN(depYears!) || depYears! < 0)) {
				errors.push({ row: rowNumber, field: 'depreciation_years', message: 'Must be a non-negative integer' }); return;
			}
			if (purchaseAmount && isNaN(parseFloat(purchaseAmount))) {
				errors.push({ row: rowNumber, field: 'purchase_amount', message: 'Must be a number' }); return;
			}
			if (residualStr && isNaN(parseFloat(residualStr))) {
				errors.push({ row: rowNumber, field: 'residual_value', message: 'Must be a number' }); return;
			}

			// Validate date
			if (purchaseDate && !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
				errors.push({ row: rowNumber, field: 'purchase_date', message: 'Format: YYYY-MM-DD' }); return;
			}

			validRows.push({
				rowNum: rowNumber,
				data: {
					asset_name: name,
					asset_category: category,
					ownership_type: ownership,
					status,
					quantity,
					unit: getCellStr(row, 'unit') || null,
					location: getCellStr(row, 'location') || null,
					manufacturer: getCellStr(row, 'manufacturer') || null,
					model_name: getCellStr(row, 'model_name') || null,
					serial_no: getCellStr(row, 'serial_no') || null,
					barcode: getCellStr(row, 'barcode') || null,
					purchase_date: purchaseDate || null,
					vendor: getCellStr(row, 'vendor') || null,
					currency,
					purchase_amount: purchaseAmount || null,
					depreciation_years: depYears,
					residual_value: residualStr || null,
				},
			});
		});

		// Batch insert (50 rows at a time)
		let successCount = 0;
		const BATCH_SIZE = 50;

		for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
			const batch = validRows.slice(i, i + BATCH_SIZE);
			const entities = batch.map((r) =>
				this.assetRepository.create({
					entId: entityId,
					astCode: this.generateAssetCode(),
					astName: r.data.asset_name,
					astCategory: r.data.asset_category,
					astOwnershipType: r.data.ownership_type,
					astStatus: r.data.status,
					astQuantity: r.data.quantity,
					astUnit: r.data.unit,
					astLocation: r.data.location,
					astManufacturer: r.data.manufacturer,
					astModelName: r.data.model_name,
					astSerialNo: r.data.serial_no,
					astBarcode: r.data.barcode,
					astPurchaseDate: r.data.purchase_date ? new Date(r.data.purchase_date) : null,
					astVendor: r.data.vendor,
					astCurrency: r.data.currency,
					astPurchaseAmount: r.data.purchase_amount,
					astDepreciationYears: r.data.depreciation_years,
					astResidualValue: r.data.residual_value,
				}),
			);

			try {
				const saved = await this.assetRepository.save(entities);

				// Change logs
				const logs = saved.map((s) =>
					this.assetChangeLogRepository.create({
						astId: s.astId,
						aclChangedBy: userId,
						aclField: 'CREATE',
						aclBeforeValue: null,
						aclAfterValue: s.astStatus,
						aclReason: 'Excel bulk import',
					}),
				);
				await this.assetChangeLogRepository.save(logs);

				successCount += saved.length;
			} catch (err) {
				batch.forEach((r) => {
					errors.push({ row: r.rowNum, field: 'general', message: `DB save failed: ${(err as Error).message}` });
				});
			}
		}

		return {
			totalRows,
			successCount,
			failCount: totalRows - successCount,
			errors,
		};
	}

	// ──────────────────────────────────────────────
	// CRUD
	// ──────────────────────────────────────────────

	async create(
		dto: CreateAssetRequest,
		userId: string,
		role: string,
		entityId: string,
	): Promise<AssetResponse> {
		if (!this.isAdminRole(role) && !this.isManagerRole(role)) {
			throw new ForbiddenException('Only MANAGER or ADMIN can create asset.');
		}

		const entity = this.assetRepository.create({
			entId: entityId,
			astCode: this.generateAssetCode(),
			astName: dto.asset_name,
			astCategory: dto.asset_category,
			astOwnershipType: dto.ownership_type,
			astUnit: dto.department || dto.unit || null,
			astManagerId: dto.manager_id || null,
			astLocation: dto.location || null,
			astStatus: dto.status || 'STORED',
			astManufacturer: dto.manufacturer || null,
			astModelName: dto.model_name || null,
			astSerialNo: dto.serial_no || null,
			astPurchaseDate: dto.purchase_date ? new Date(dto.purchase_date) : null,
			astVendor: dto.vendor || null,
			astCurrency: dto.currency || 'USD',
			astPurchaseAmount: dto.purchase_amount || null,
			astDepreciationYears: dto.depreciation_years || null,
			astResidualValue: dto.residual_value || null,
			astQuantity: dto.quantity ?? 1,
			astBarcode: dto.barcode || null,
			astRfidCode: dto.rfid_code || null,
			astRoomCapacity: dto.room_capacity || null,
			astRoomEquipments: dto.room_equipments || null,
			astRoomAvailableFrom: dto.room_available_from || null,
			astRoomAvailableTo: dto.room_available_to || null,
		});

		const saved = await this.assetRepository.save(entity);

		await this.assetChangeLogRepository.save(
			this.assetChangeLogRepository.create({
				astId: saved.astId,
				aclChangedBy: userId,
				aclField: 'CREATE',
				aclBeforeValue: null,
				aclAfterValue: saved.astStatus,
				aclReason: 'Asset created',
			}),
		);

		const loaded = await this.assetRepository.findOne({
			where: { astId: saved.astId },
			relations: ['manager'],
		});

		return AssetMapper.toResponse(loaded!);
	}

	async updateAsset(
		assetId: string,
		dto: UpdateAssetRequest,
		userId: string,
		role: string,
		entityId: string,
	): Promise<AssetResponse> {
		if (!this.isAdminRole(role) && !this.isManagerRole(role)) {
			throw new ForbiddenException('Only MANAGER or ADMIN can update asset.');
		}

		const unit = await this.getUserUnit(userId);
		const entity = await this.assetRepository.findOne({
			where: { astId: assetId, entId: entityId },
			relations: ['manager'],
		});
		if (!entity) {
			throw new NotFoundException(ERROR_CODE.ASSET_NOT_FOUND.message);
		}
		if (this.isManagerRole(role) && (!unit || entity.astUnit !== unit)) {
			throw new ForbiddenException('Access denied for this asset.');
		}

		if ('asset_name' in dto) entity.astName = dto.asset_name || entity.astName;
		if ('asset_category' in dto) entity.astCategory = dto.asset_category || entity.astCategory;
		if ('ownership_type' in dto) entity.astOwnershipType = dto.ownership_type || entity.astOwnershipType;
		if ('department' in dto || 'unit' in dto) entity.astUnit = dto.department || dto.unit || null;
		if ('manager_id' in dto) entity.astManagerId = dto.manager_id || null;
		if ('location' in dto) entity.astLocation = dto.location || null;
		if ('status' in dto) entity.astStatus = dto.status || entity.astStatus;
		if ('manufacturer' in dto) entity.astManufacturer = dto.manufacturer || null;
		if ('model_name' in dto) entity.astModelName = dto.model_name || null;
		if ('serial_no' in dto) entity.astSerialNo = dto.serial_no || null;
		if ('purchase_date' in dto) entity.astPurchaseDate = dto.purchase_date ? new Date(dto.purchase_date) : null;
		if ('vendor' in dto) entity.astVendor = dto.vendor || null;
		if ('currency' in dto) entity.astCurrency = dto.currency || 'USD';
		if ('purchase_amount' in dto) entity.astPurchaseAmount = dto.purchase_amount || null;
		if ('depreciation_years' in dto) entity.astDepreciationYears = dto.depreciation_years ?? null;
		if ('residual_value' in dto) entity.astResidualValue = dto.residual_value || null;
		if ('quantity' in dto) entity.astQuantity = dto.quantity ?? null;
		if ('barcode' in dto) entity.astBarcode = dto.barcode || null;
		if ('rfid_code' in dto) entity.astRfidCode = dto.rfid_code || null;
		if ('room_capacity' in dto) entity.astRoomCapacity = dto.room_capacity ?? null;
		if ('room_equipments' in dto) entity.astRoomEquipments = dto.room_equipments ?? null;
		if ('room_available_from' in dto) entity.astRoomAvailableFrom = dto.room_available_from || null;
		if ('room_available_to' in dto) entity.astRoomAvailableTo = dto.room_available_to || null;

		if ((dto.asset_category ?? entity.astCategory) !== 'MEETING_ROOM') {
			entity.astRoomCapacity = null;
			entity.astRoomEquipments = null;
			entity.astRoomAvailableFrom = null;
			entity.astRoomAvailableTo = null;
		}

		const saved = await this.assetRepository.save(entity);
		await this.assetChangeLogRepository.save(
			this.assetChangeLogRepository.create({
				astId: saved.astId,
				aclChangedBy: userId,
				aclField: 'UPDATE',
				aclBeforeValue: null,
				aclAfterValue: null,
				aclReason: 'Asset updated',
			}),
		);

		const loaded = await this.assetRepository.findOne({
			where: { astId: saved.astId },
			relations: ['manager'],
		});
		return AssetMapper.toResponse(loaded!);
	}

	async updateStatus(
		assetId: string,
		dto: UpdateAssetStatusRequest,
		userId: string,
		role: string,
		entityId: string,
	): Promise<AssetResponse> {
		if (!this.isAdminRole(role) && !this.isManagerRole(role)) {
			throw new ForbiddenException('Only MANAGER or ADMIN can update asset status.');
		}

		const unit = await this.getUserUnit(userId);

		const entity = await this.assetRepository.findOne({
			where: { astId: assetId, entId: entityId },
			relations: ['manager'],
		});

		if (!entity) {
			throw new NotFoundException(ERROR_CODE.ASSET_NOT_FOUND.message);
		}

		if (this.isManagerRole(role) && (!unit || entity.astUnit !== unit)) {
			throw new ForbiddenException('Access denied for this asset.');
		}

		const previousStatus = entity.astStatus;
		entity.astStatus = dto.status;
		const saved = await this.assetRepository.save(entity);

		await this.assetChangeLogRepository.save(
			this.assetChangeLogRepository.create({
				astId: saved.astId,
				aclChangedBy: userId,
				aclField: 'STATUS',
				aclBeforeValue: previousStatus,
				aclAfterValue: saved.astStatus,
				aclReason: dto.reason,
			}),
		);

		return AssetMapper.toResponse(saved);
	}

	async deleteAsset(
		assetId: string,
		userId: string,
		role: string,
		entityId: string,
	): Promise<boolean> {
		if (!this.isAdminRole(role) && !this.isManagerRole(role)) {
			throw new ForbiddenException('Only MANAGER or ADMIN can delete asset.');
		}

		const unit = await this.getUserUnit(userId);
		const entity = await this.assetRepository.findOne({
			where: { astId: assetId, entId: entityId },
		});
		if (!entity) {
			throw new NotFoundException(ERROR_CODE.ASSET_NOT_FOUND.message);
		}
		if (this.isManagerRole(role) && (!unit || entity.astUnit !== unit)) {
			throw new ForbiddenException('Access denied for this asset.');
		}

		await this.assetRepository.softDelete({ astId: assetId, entId: entityId });
		await this.assetChangeLogRepository.save(
			this.assetChangeLogRepository.create({
				astId: assetId,
				aclChangedBy: userId,
				aclField: 'DELETE',
				aclBeforeValue: entity.astStatus,
				aclAfterValue: null,
				aclReason: 'Asset deleted',
			}),
		);

		return true;
	}
}
