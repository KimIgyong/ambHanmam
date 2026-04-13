import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DddFrameworkEntity } from '../../entity/ddd-framework.entity';
import { DddMetricEntity } from '../../entity/ddd-metric.entity';

@Injectable()
export class DddFrameworkService {
  private readonly logger = new Logger(DddFrameworkService.name);

  constructor(
    @InjectRepository(DddFrameworkEntity)
    private readonly frameworkRepository: Repository<DddFrameworkEntity>,
    @InjectRepository(DddMetricEntity)
    private readonly metricRepository: Repository<DddMetricEntity>,
  ) {}

  async findAll(entityId: string): Promise<DddFrameworkEntity[]> {
    return this.frameworkRepository.find({
      where: { entId: entityId, fwkIsActive: true },
      order: { fwkCreatedAt: 'ASC' },
    });
  }

  async findOne(entityId: string, fwkId: string): Promise<DddFrameworkEntity> {
    const framework = await this.frameworkRepository.findOne({
      where: { fwkId, entId: entityId, fwkIsActive: true },
    });
    if (!framework) {
      throw new NotFoundException(`Framework ${fwkId} not found`);
    }
    return framework;
  }

  async findOneWithMetrics(entityId: string, fwkId: string): Promise<DddFrameworkEntity> {
    const framework = await this.frameworkRepository.findOne({
      where: { fwkId, entId: entityId, fwkIsActive: true },
      relations: ['metrics'],
    });
    if (!framework) {
      throw new NotFoundException(`Framework ${fwkId} not found`);
    }
    // Sort metrics by stage then order
    framework.metrics?.sort((a, b) => {
      if (a.metStage !== b.metStage) return a.metStage.localeCompare(b.metStage);
      return a.metOrder - b.metOrder;
    });
    return framework;
  }

  async getMetrics(fwkId: string, stage?: string): Promise<DddMetricEntity[]> {
    const where: any = { fwkId };
    if (stage) where.metStage = stage;
    return this.metricRepository.find({
      where,
      order: { metStage: 'ASC', metOrder: 'ASC' },
    });
  }

  async getPrimaryMetrics(fwkId: string): Promise<DddMetricEntity[]> {
    return this.metricRepository.find({
      where: { fwkId, metIsPrimary: true },
      order: { metStage: 'ASC', metOrder: 'ASC' },
    });
  }
}
