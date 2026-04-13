import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmsWorkItemTagEntity } from '../entity/kms-work-item-tag.entity';
import { TagService } from './tag.service';
import { KmsWorkItemTagResponse, TagSource, TagLevel } from '@amb/types';

@Injectable()
export class TagAssignmentService {
  constructor(
    @InjectRepository(KmsWorkItemTagEntity)
    private readonly witTagRepository: Repository<KmsWorkItemTagEntity>,
    private readonly tagService: TagService,
  ) {}

  async assignTag(params: {
    workItemId: string;
    tagId: string;
    source: string;
    confidence?: number;
    weight?: number;
    assignedBy?: string;
  }): Promise<KmsWorkItemTagResponse> {
    // Check if already assigned
    const existing = await this.witTagRepository.findOne({
      where: { witId: params.workItemId, tagId: params.tagId },
    });

    if (existing) {
      // Update source/confidence
      existing.wttSource = params.source;
      if (params.confidence !== undefined) existing.wttConfidence = params.confidence;
      if (params.weight !== undefined) existing.wttWeight = params.weight;
      const saved = await this.witTagRepository.save(existing);
      return this.loadAndMap(saved.witTagId);
    }

    const entity = this.witTagRepository.create({
      witId: params.workItemId,
      tagId: params.tagId,
      wttSource: params.source,
      wttConfidence: params.confidence ?? null,
      wttWeight: params.weight ?? 1.0,
      wttAssignedBy: params.assignedBy || null,
    } as Partial<KmsWorkItemTagEntity>) as KmsWorkItemTagEntity;

    const saved = await this.witTagRepository.save(entity) as KmsWorkItemTagEntity;

    // Increment tag usage count
    await this.tagService.incrementUsageCount(params.tagId);

    return this.loadAndMap(saved.witTagId);
  }

  async removeTag(workItemId: string, tagId: string): Promise<void> {
    await this.witTagRepository.delete({ witId: workItemId, tagId });
  }

  async getTagsForWorkItem(workItemId: string): Promise<KmsWorkItemTagResponse[]> {
    const entities = await this.witTagRepository.find({
      where: { witId: workItemId },
      relations: ['tag'],
      order: { wttWeight: 'DESC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async getWorkItemsForTag(tagId: string, limit = 50): Promise<string[]> {
    const entities = await this.witTagRepository.find({
      where: { tagId },
      take: limit,
      order: { wttCreatedAt: 'DESC' },
    });
    return entities.map((e) => e.witId);
  }

  private async loadAndMap(id: string): Promise<KmsWorkItemTagResponse> {
    const entity = await this.witTagRepository.findOne({
      where: { witTagId: id },
      relations: ['tag'],
    });
    return this.toResponse(entity!);
  }

  private toResponse(entity: KmsWorkItemTagEntity): KmsWorkItemTagResponse {
    return {
      id: entity.witTagId,
      workItemId: entity.witId,
      tagId: entity.tagId,
      tagName: entity.tag?.tagName || '',
      tagDisplay: entity.tag?.tagDisplay || '',
      tagLevel: (entity.tag?.tagLevel || 2) as TagLevel,
      tagColor: entity.tag?.tagColor || null,
      source: entity.wttSource as TagSource,
      confidence: entity.wttConfidence ? Number(entity.wttConfidence) : null,
      weight: Number(entity.wttWeight),
      assignedBy: entity.wttAssignedBy || null,
      createdAt: entity.wttCreatedAt?.toISOString(),
    };
  }
}
