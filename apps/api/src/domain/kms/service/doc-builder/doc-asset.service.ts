import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocAssetEntity } from '../../entity/doc-asset.entity';

export interface CreateAssetDto {
  name: string;
  type: string;
  description?: string;
  drive_file_id?: string;
  drive_url?: string;
  mime_type?: string;
  dimensions?: { width: number; height: number };
  tags?: string[];
}

@Injectable()
export class DocAssetService {
  private readonly logger = new Logger(DocAssetService.name);

  constructor(
    @InjectRepository(DocAssetEntity)
    private readonly assetRepo: Repository<DocAssetEntity>,
  ) {}

  async findAll(entityId: string, type?: string): Promise<DocAssetEntity[]> {
    const where: any = { entId: entityId, dasIsActive: true };
    if (type) where.dasType = type;

    return this.assetRepo.find({
      where,
      order: { dasCreatedAt: 'DESC' },
    });
  }

  async findOne(entityId: string, dasId: string): Promise<DocAssetEntity> {
    const asset = await this.assetRepo.findOne({
      where: { dasId, entId: entityId, dasIsActive: true },
    });
    if (!asset) throw new NotFoundException(`Asset ${dasId} not found`);
    return asset;
  }

  async create(entityId: string, dto: CreateAssetDto): Promise<DocAssetEntity> {
    const entity = this.assetRepo.create({
      entId: entityId,
      dasName: dto.name,
      dasType: dto.type || 'OTHER',
      dasDescription: dto.description || '',
      dasDriveFileId: dto.drive_file_id || '',
      dasDriveUrl: dto.drive_url || '',
      dasMimeType: dto.mime_type || '',
      dasDimensions: dto.dimensions || null,
      dasTags: dto.tags || [],
    } as Partial<DocAssetEntity>);

    return this.assetRepo.save(entity);
  }

  async delete(entityId: string, dasId: string): Promise<void> {
    const asset = await this.findOne(entityId, dasId);
    asset.dasIsActive = false;
    await this.assetRepo.save(asset);
  }
}
