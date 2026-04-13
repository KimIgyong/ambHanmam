import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmsTagEntity } from '../entity/kms-tag.entity';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    @InjectRepository(KmsTagEntity)
    private readonly tagRepository: Repository<KmsTagEntity>,
  ) {}

  /**
   * Find similar tags using cosine similarity on embeddings.
   * Requires pgvector extension and populated tag_embedding columns.
   * Falls back gracefully when embeddings are not available.
   */
  async findSimilarTags(
    entityId: string,
    embedding: number[],
    threshold = 0.92,
    limit = 5,
  ): Promise<KmsTagEntity[]> {
    try {
      const vectorStr = `[${embedding.join(',')}]`;

      const results = await this.tagRepository
        .createQueryBuilder('tag')
        .where('tag.ent_id = :entityId', { entityId })
        .andWhere('tag.tag_embedding IS NOT NULL')
        .andWhere(`1 - (tag.tag_embedding::vector <=> :vector::vector) > :threshold`, {
          vector: vectorStr,
          threshold,
        })
        .orderBy(`tag.tag_embedding::vector <=> :vector::vector`, 'ASC')
        .setParameter('vector', vectorStr)
        .take(limit)
        .getMany();

      return results;
    } catch (error) {
      this.logger.debug(`Embedding search not available: ${error}`);
      return [];
    }
  }

  /**
   * Store embedding for a tag.
   * The actual embedding generation is handled externally (e.g., via OpenAI or Claude).
   */
  async storeEmbedding(tagId: string, embedding: number[]): Promise<void> {
    try {
      const vectorStr = `[${embedding.join(',')}]`;
      await this.tagRepository.update(tagId, { tagEmbedding: vectorStr });
    } catch (error) {
      this.logger.warn(`Failed to store embedding for tag ${tagId}: ${error}`);
    }
  }

  /**
   * Calculate cosine similarity between two embedding vectors.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
}
