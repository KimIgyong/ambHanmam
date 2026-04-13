import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsSiteConfigEntity } from '../entity/cms-site-config.entity';

@Injectable()
export class CmsSiteConfigService {
  private readonly logger = new Logger(CmsSiteConfigService.name);

  constructor(
    @InjectRepository(CmsSiteConfigEntity)
    private readonly repo: Repository<CmsSiteConfigEntity>,
  ) {}

  /** Admin: 법인의 모든 설정 조회 */
  async findAll(entityId: string): Promise<CmsSiteConfigEntity[]> {
    return this.repo.find({
      where: { entId: entityId },
      order: { cscKey: 'ASC' },
    });
  }

  /** Admin: 특정 키 조회 */
  async findByKey(entityId: string, key: string): Promise<CmsSiteConfigEntity> {
    const config = await this.repo.findOne({
      where: { entId: entityId, cscKey: key.toUpperCase() },
    });
    if (!config) {
      throw new NotFoundException(`Site config not found: ${key}`);
    }
    return config;
  }

  /** Admin: 설정 저장 (upsert, DRAFT) — version 증가 */
  async upsert(
    entityId: string,
    key: string,
    value: Record<string, any>,
    userId: string,
  ): Promise<CmsSiteConfigEntity> {
    const normalizedKey = key.toUpperCase();
    let config = await this.repo.findOne({
      where: { entId: entityId, cscKey: normalizedKey },
    });

    if (config) {
      config.cscValue = value;
      config.cscVersion += 1;
      config.cscUpdatedBy = userId;
      return this.repo.save(config);
    }

    // 신규 생성
    const newConfig = this.repo.create({
      entId: entityId,
      cscKey: normalizedKey,
      cscValue: value,
      cscVersion: 1,
      cscUpdatedBy: userId,
    });
    return this.repo.save(newConfig);
  }

  /** Admin: 현재 DRAFT를 발행 */
  async publish(
    entityId: string,
    key: string,
    userId: string,
  ): Promise<CmsSiteConfigEntity> {
    const config = await this.findByKey(entityId, key);
    config.cscPublishedAt = new Date();
    config.cscPublishedBy = userId;
    this.logger.log(`Publishing site config: ${key} (v${config.cscVersion}) for entity ${entityId}`);
    return this.repo.save(config);
  }

  /** Public: 발행된 모든 설정 (HEADER + FOOTER + SITE_META) */
  async getPublicConfig(entityId: string): Promise<Record<string, any>> {
    const configs = await this.repo.find({
      where: { entId: entityId },
    });

    const result: Record<string, any> = {};
    for (const c of configs) {
      if (c.cscPublishedAt) {
        result[c.cscKey.toLowerCase()] = c.cscValue;
      }
    }
    return result;
  }

  /** Public: 특정 키의 발행된 설정 */
  async getPublicConfigByKey(
    entityId: string,
    key: string,
  ): Promise<Record<string, any> | null> {
    const config = await this.repo.findOne({
      where: { entId: entityId, cscKey: key.toUpperCase() },
    });
    if (!config || !config.cscPublishedAt) return null;
    return config.cscValue;
  }

  /** 시드: 기본 설정 삽입 (존재하지 않을 때만) */
  async seedIfNotExists(
    entityId: string,
    key: string,
    value: Record<string, any>,
  ): Promise<void> {
    const exists = await this.repo.findOne({
      where: { entId: entityId, cscKey: key.toUpperCase() },
    });
    if (exists) return;

    const config = this.repo.create({
      entId: entityId,
      cscKey: key.toUpperCase(),
      cscValue: value,
      cscVersion: 1,
      cscPublishedAt: new Date(),
    });
    await this.repo.save(config);
    this.logger.log(`Seeded site config: ${key} for entity ${entityId}`);
  }
}
