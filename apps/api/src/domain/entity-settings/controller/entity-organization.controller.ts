import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { UnitService } from '../../unit/service/unit.service';
import { CellService } from '../../members/service/cell.service';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { EntityAiConfigEntity } from '../entity/entity-ai-config.entity';
import { CreateUnitRequest } from '../../unit/dto/request/create-unit.request';
import { UpdateUnitRequest } from '../../unit/dto/request/update-unit.request';
import { CreateCellRequest } from '../../members/dto/request/create-cell.request';
import { UpdateCellRequest } from '../../members/dto/request/update-cell.request';
import { resolveEntityId } from '../util/resolve-entity-id';

/**
 * MASTER 계정이 자기 법인의 Unit/Cell을 관리하는 엔드포인트.
 * 기존 /units, /cells 엔드포인트는 ADMIN 전용이므로
 * entity-settings 경로에 OwnEntityGuard를 적용하여 MASTER 접근을 허용한다.
 */
@Controller('entity-settings/organization')
export class EntityOrganizationController {
  constructor(
    private readonly unitService: UnitService,
    private readonly cellService: CellService,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    @InjectRepository(EntityAiConfigEntity)
    private readonly aiConfigRepo: Repository<EntityAiConfigEntity>,
  ) {}

  /* ── Entity Basic Info ── */

  @Get('basic')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getEntityBasicInfo(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const entity = await this.entityRepo.findOneOrFail({ where: { entId: entityId } });
    return {
      success: true,
      data: {
        entId: entity.entId,
        entCode: entity.entCode,
        entName: entity.entName,
        entNameEn: entity.entNameEn,
        entCountry: entity.entCountry,
        entCurrency: entity.entCurrency,
        entRegNo: entity.entRegNo,
        entAddress: entity.entAddress,
        entRepresentative: entity.entRepresentative,
        entPhone: entity.entPhone,
        entEmail: entity.entEmail,
        entPayDay: entity.entPayDay,
        entStatus: entity.entStatus,
        entUpdatedAt: entity.entUpdatedAt,
      },
    };
  }

  @Patch('basic')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async updateEntityBasicInfo(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
    @Body() dto: Record<string, any>,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const allowedFields: Record<string, string> = {
      ent_name: 'entName',
      ent_name_en: 'entNameEn',
      ent_country: 'entCountry',
      ent_currency: 'entCurrency',
      ent_reg_no: 'entRegNo',
      ent_address: 'entAddress',
      ent_representative: 'entRepresentative',
      ent_phone: 'entPhone',
      ent_email: 'entEmail',
      ent_pay_day: 'entPayDay',
    };

    const updates: Partial<HrEntityEntity> = {};
    for (const [snakeKey, camelKey] of Object.entries(allowedFields)) {
      if (dto[snakeKey] !== undefined) {
        (updates as any)[camelKey] = dto[snakeKey];
      }
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, data: null };
    }

    await this.entityRepo.update(entityId, updates);
    const updated = await this.entityRepo.findOneOrFail({ where: { entId: entityId } });
    return {
      success: true,
      data: {
        entId: updated.entId,
        entCode: updated.entCode,
        entName: updated.entName,
        entNameEn: updated.entNameEn,
        entCountry: updated.entCountry,
        entCurrency: updated.entCurrency,
        entRegNo: updated.entRegNo,
        entAddress: updated.entAddress,
        entRepresentative: updated.entRepresentative,
        entPhone: updated.entPhone,
        entEmail: updated.entEmail,
        entPayDay: updated.entPayDay,
        entStatus: updated.entStatus,
        entUpdatedAt: updated.entUpdatedAt,
      },
    };
  }

  /* ── Units ── */

  @Get('units')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getUnits(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    return { success: true, data: await this.unitService.getAllUnits(entityId) };
  }

  @Post('units')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async createUnit(
    @Body() dto: CreateUnitRequest,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    return { success: true, data: await this.unitService.createUnit(dto, entityId) };
  }

  @Put('units/:id')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async updateUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitRequest,
  ) {
    return { success: true, data: await this.unitService.updateUnit(id, dto) };
  }

  @Delete('units/:id')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async deleteUnit(@Param('id', ParseUUIDPipe) id: string) {
    await this.unitService.deleteUnit(id);
    return { success: true };
  }

  /* ── Cells ── */

  @Get('cells')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getCells(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    return { success: true, data: await this.cellService.findAll(entityId) };
  }

  @Post('cells')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async createCell(@Body() dto: CreateCellRequest) {
    return { success: true, data: await this.cellService.create(dto) };
  }

  @Patch('cells/:id')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async updateCell(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCellRequest,
  ) {
    return { success: true, data: await this.cellService.update(id, dto) };
  }

  @Delete('cells/:id')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async deleteCell(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.cellService.remove(id) };
  }

  /* ── Work & Payroll Defaults ── */

  @Get('work-payroll')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getWorkPayroll(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const entity = await this.entityRepo.findOneOrFail({ where: { entId: entityId } });
    return {
      success: true,
      data: {
        entPayDay: entity.entPayDay,
        entPayPeriodType: entity.entPayPeriodType,
        entPayPeriodStart: entity.entPayPeriodStart,
        entPayPeriodEnd: entity.entPayPeriodEnd,
        entWorkHoursPerDay: entity.entWorkHoursPerDay,
        entWorkDaysPerWeek: entity.entWorkDaysPerWeek,
        entLeaveBaseDays: entity.entLeaveBaseDays,
      },
    };
  }

  @Patch('work-payroll')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async updateWorkPayroll(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
    @Body() dto: Record<string, any>,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const allowedFields: Record<string, string> = {
      ent_pay_day: 'entPayDay',
      ent_pay_period_type: 'entPayPeriodType',
      ent_pay_period_start: 'entPayPeriodStart',
      ent_pay_period_end: 'entPayPeriodEnd',
      ent_work_hours_per_day: 'entWorkHoursPerDay',
      ent_work_days_per_week: 'entWorkDaysPerWeek',
      ent_leave_base_days: 'entLeaveBaseDays',
    };

    const updates: Partial<HrEntityEntity> = {};
    for (const [snakeKey, camelKey] of Object.entries(allowedFields)) {
      if (dto[snakeKey] !== undefined) {
        (updates as any)[camelKey] = dto[snakeKey];
      }
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, data: null };
    }

    await this.entityRepo.update(entityId, updates);
    const updated = await this.entityRepo.findOneOrFail({ where: { entId: entityId } });
    return {
      success: true,
      data: {
        entPayDay: updated.entPayDay,
        entPayPeriodType: updated.entPayPeriodType,
        entPayPeriodStart: updated.entPayPeriodStart,
        entPayPeriodEnd: updated.entPayPeriodEnd,
        entWorkHoursPerDay: updated.entWorkHoursPerDay,
        entWorkDaysPerWeek: updated.entWorkDaysPerWeek,
        entLeaveBaseDays: updated.entLeaveBaseDays,
      },
    };
  }

  /* ── AI Agent Config ── */

  @Get('ai-config')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getAiConfig(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    let config = await this.aiConfigRepo.findOne({
      where: { entId: entityId, eacDeletedAt: null as any },
    });

    if (!config) {
      // Return default values if no config exists
      return {
        success: true,
        data: {
          eacUseSharedKey: true,
          eacDailyTokenLimit: 0,
          eacMonthlyTokenLimit: 0,
          eacIsActive: true,
          hasApiKey: false,
        },
      };
    }

    return {
      success: true,
      data: {
        eacId: config.eacId,
        eacUseSharedKey: config.eacUseSharedKey,
        eacDailyTokenLimit: Number(config.eacDailyTokenLimit),
        eacMonthlyTokenLimit: Number(config.eacMonthlyTokenLimit),
        eacIsActive: config.eacIsActive,
        hasApiKey: !!config.eacApiKey,
      },
    };
  }

  @Put('ai-config')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async saveAiConfig(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
    @Body() dto: Record<string, any>,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    let config = await this.aiConfigRepo.findOne({
      where: { entId: entityId, eacDeletedAt: null as any },
    });

    if (!config) {
      config = this.aiConfigRepo.create({ entId: entityId });
    }

    if (dto.use_shared_key !== undefined) config.eacUseSharedKey = dto.use_shared_key;
    if (dto.api_key !== undefined) config.eacApiKey = dto.api_key || null;
    if (dto.daily_token_limit !== undefined) config.eacDailyTokenLimit = dto.daily_token_limit;
    if (dto.monthly_token_limit !== undefined) config.eacMonthlyTokenLimit = dto.monthly_token_limit;
    if (dto.is_active !== undefined) config.eacIsActive = dto.is_active;

    const saved = await this.aiConfigRepo.save(config);
    return {
      success: true,
      data: {
        eacId: saved.eacId,
        eacUseSharedKey: saved.eacUseSharedKey,
        eacDailyTokenLimit: Number(saved.eacDailyTokenLimit),
        eacMonthlyTokenLimit: Number(saved.eacMonthlyTokenLimit),
        eacIsActive: saved.eacIsActive,
        hasApiKey: !!saved.eacApiKey,
      },
    };
  }
}
