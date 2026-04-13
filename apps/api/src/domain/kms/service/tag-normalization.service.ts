import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmsTagEntity } from '../entity/kms-tag.entity';
import { KmsTagSynonymEntity } from '../entity/kms-tag-synonym.entity';

@Injectable()
export class TagNormalizationService {
  constructor(
    @InjectRepository(KmsTagEntity)
    private readonly tagRepository: Repository<KmsTagEntity>,
    @InjectRepository(KmsTagSynonymEntity)
    private readonly synonymRepository: Repository<KmsTagSynonymEntity>,
  ) {}

  /**
   * 4-stage normalization pipeline:
   * 1. Exact match (normalized name)
   * 2. Synonym lookup
   * 3. Fuzzy trigram match (similarity > 0.8)
   * 4. Create new tag if no match
   */
  async normalizeTag(
    entityId: string,
    rawName: string,
    level = 2,
  ): Promise<KmsTagEntity> {
    const normalized = this.normalizeText(rawName);

    // Stage 1: Exact match
    const exact = await this.tagRepository.findOne({
      where: { entId: entityId, tagName: normalized },
    });
    if (exact) return exact;

    // Stage 2: Synonym lookup
    const synonym = await this.findBySynonym(entityId, normalized);
    if (synonym) return synonym;

    // Stage 3: Fuzzy trigram match (requires pg_trgm extension)
    const fuzzy = await this.findByTrigram(entityId, normalized, 0.8);
    if (fuzzy) return fuzzy;

    // Stage 4: Create new tag
    const newTag = this.tagRepository.create({
      entId: entityId,
      tagName: normalized,
      tagDisplay: rawName.trim(),
      tagLevel: level,
    } as Partial<KmsTagEntity>) as KmsTagEntity;
    return this.tagRepository.save(newTag) as Promise<KmsTagEntity>;
  }

  /**
   * Batch normalize multiple tags
   */
  async normalizeTags(
    entityId: string,
    rawNames: string[],
    level = 2,
  ): Promise<KmsTagEntity[]> {
    const results: KmsTagEntity[] = [];
    for (const name of rawNames) {
      const tag = await this.normalizeTag(entityId, name, level);
      results.push(tag);
    }
    return results;
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-가-힣ㄱ-ㅎㅏ-ㅣàáảãạăắằẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi, '');
  }

  private async findBySynonym(
    entityId: string,
    normalizedName: string,
  ): Promise<KmsTagEntity | null> {
    const result = await this.synonymRepository
      .createQueryBuilder('syn')
      .innerJoinAndSelect('syn.tag', 'tag')
      .where('tag.ent_id = :entityId', { entityId })
      .andWhere('LOWER(syn.tsy_synonym) = :name', { name: normalizedName })
      .getOne();

    return result?.tag || null;
  }

  private async findByTrigram(
    entityId: string,
    normalizedName: string,
    threshold: number,
  ): Promise<KmsTagEntity | null> {
    try {
      const result = await this.tagRepository
        .createQueryBuilder('tag')
        .where('tag.ent_id = :entityId', { entityId })
        .andWhere('similarity(tag.tag_name, :name) > :threshold', {
          name: normalizedName,
          threshold,
        })
        .orderBy('similarity(tag.tag_name, :name)', 'DESC')
        .setParameter('name', normalizedName)
        .getOne();

      return result || null;
    } catch {
      // pg_trgm extension may not be available
      return null;
    }
  }
}
