import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DddDashboardEntity } from '../../entity/ddd-dashboard.entity';
import { DddFrameworkEntity } from '../../entity/ddd-framework.entity';
import { CreateDashboardDto } from '../../dto/request/create-dashboard.dto';

@Injectable()
export class DddDashboardService {
  private readonly logger = new Logger(DddDashboardService.name);

  constructor(
    @InjectRepository(DddDashboardEntity)
    private readonly dashboardRepository: Repository<DddDashboardEntity>,
    @InjectRepository(DddFrameworkEntity)
    private readonly frameworkRepository: Repository<DddFrameworkEntity>,
  ) {}

  async findAll(entityId: string): Promise<DddDashboardEntity[]> {
    return this.dashboardRepository.find({
      where: { entId: entityId, ddbIsActive: true },
      relations: ['framework'],
      order: { ddbCreatedAt: 'ASC' },
    });
  }

  async findOne(entityId: string, ddbId: string): Promise<DddDashboardEntity> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { ddbId, entId: entityId, ddbIsActive: true },
      relations: ['framework'],
    });
    if (!dashboard) {
      throw new NotFoundException(`Dashboard ${ddbId} not found`);
    }
    return dashboard;
  }

  async create(
    entityId: string,
    userId: string,
    dto: CreateDashboardDto,
  ): Promise<DddDashboardEntity> {
    // Validate framework exists
    const framework = await this.frameworkRepository.findOne({
      where: { fwkId: dto.framework_id, entId: entityId, fwkIsActive: true },
    });
    if (!framework) {
      throw new BadRequestException(`Framework ${dto.framework_id} not found`);
    }

    const entity = this.dashboardRepository.create({
      entId: entityId,
      fwkId: dto.framework_id,
      ddbName: dto.name,
      ddbScope: dto.scope || 'ENTITY',
      ddbScopeId: dto.scope_id || undefined,
      ddbPeriodType: dto.period_type || 'QUARTER',
      ddbConfig: dto.config || undefined,
      ddbStrategyStep: dto.strategy_step || 1,
      ddbCreatedBy: userId,
    } as Partial<DddDashboardEntity>);
    return this.dashboardRepository.save(entity);
  }

  async update(
    entityId: string,
    ddbId: string,
    dto: Partial<CreateDashboardDto>,
  ): Promise<DddDashboardEntity> {
    const dashboard = await this.findOne(entityId, ddbId);

    if (dto.name !== undefined) dashboard.ddbName = dto.name;
    if (dto.period_type !== undefined) dashboard.ddbPeriodType = dto.period_type;
    if (dto.config !== undefined) dashboard.ddbConfig = dto.config;
    if (dto.strategy_step !== undefined) dashboard.ddbStrategyStep = dto.strategy_step;

    return this.dashboardRepository.save(dashboard);
  }

  async softDelete(entityId: string, ddbId: string): Promise<void> {
    const dashboard = await this.findOne(entityId, ddbId);
    dashboard.ddbIsActive = false;
    await this.dashboardRepository.save(dashboard);
  }
}
