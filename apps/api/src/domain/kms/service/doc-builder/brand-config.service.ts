import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocAssetEntity } from '../../entity/doc-asset.entity';

export interface BrandConfig {
  primary: string;
  secondary: string;
  accent: string;
  fontTitle: string;
  fontBody: string;
  logoUrl?: string;
  logoFileId?: string;
}

// Default brand configuration (Amoeba)
const DEFAULT_BRAND: BrandConfig = {
  primary: 'F5841F',
  secondary: '1E293B',
  accent: '3B82F6',
  fontTitle: 'Pretendard',
  fontBody: 'Pretendard',
};

@Injectable()
export class BrandConfigService {
  private readonly logger = new Logger(BrandConfigService.name);

  constructor(
    @InjectRepository(DocAssetEntity)
    private readonly assetRepo: Repository<DocAssetEntity>,
  ) {}

  /**
   * Get brand configuration for an entity.
   * Uses the first active LOGO asset if available.
   */
  async getConfig(entityId: string): Promise<BrandConfig> {
    const config = { ...DEFAULT_BRAND };

    // Look for logo asset
    const logo = await this.assetRepo.findOne({
      where: { entId: entityId, dasType: 'LOGO', dasIsActive: true },
      order: { dasCreatedAt: 'DESC' },
    });

    if (logo) {
      config.logoUrl = logo.dasDriveUrl || undefined;
      config.logoFileId = logo.dasDriveFileId || undefined;
    }

    return config;
  }
}
