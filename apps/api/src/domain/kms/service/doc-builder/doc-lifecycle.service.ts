import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocGeneratedEntity } from '../../entity/doc-generated.entity';
import { DocEditHistoryEntity } from '../../entity/doc-edit-history.entity';
import { DocBaseDataEntity } from '../../entity/doc-base-data.entity';

/**
 * Document lifecycle states:
 * DRAFT → REVIEW → APPROVED → FINALIZED → OUTDATED
 *                                           ↑ (base data 변경 시)
 *   └─────────────── ARCHIVED ◀──────────┘
 */

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['DRAFT', 'APPROVED', 'ARCHIVED'],
  APPROVED: ['REVIEW', 'FINALIZED', 'ARCHIVED'],
  FINALIZED: ['OUTDATED', 'ARCHIVED'],
  OUTDATED: ['DRAFT', 'ARCHIVED'], // regenerate cycle
  ARCHIVED: [], // terminal state
};

const TRANSITION_ACTIONS: Record<string, string> = {
  'DRAFT→REVIEW': 'REVIEW_REQUESTED',
  'REVIEW→APPROVED': 'APPROVED',
  'REVIEW→DRAFT': 'REVIEW_REJECTED',
  'APPROVED→FINALIZED': 'FINALIZED',
  'FINALIZED→OUTDATED': 'OUTDATED',
};

@Injectable()
export class DocLifecycleService {
  private readonly logger = new Logger(DocLifecycleService.name);

  constructor(
    @InjectRepository(DocGeneratedEntity)
    private readonly generatedRepository: Repository<DocGeneratedEntity>,
    @InjectRepository(DocEditHistoryEntity)
    private readonly editHistoryRepository: Repository<DocEditHistoryEntity>,
    @InjectRepository(DocBaseDataEntity)
    private readonly baseDataRepository: Repository<DocBaseDataEntity>,
  ) {}

  async transition(
    entityId: string,
    dgnId: string,
    userId: string,
    targetStatus: string,
    notes?: string,
  ): Promise<DocGeneratedEntity> {
    const doc = await this.generatedRepository.findOne({
      where: { dgnId, entId: entityId, dgnIsDeleted: false },
    });
    if (!doc) throw new NotFoundException(`Document ${dgnId} not found`);

    const currentStatus = doc.dgnStatus;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${targetStatus}. Allowed: ${allowedTransitions.join(', ')}`,
      );
    }

    // Update document status
    doc.dgnStatus = targetStatus;

    // Set role-specific fields
    if (targetStatus === 'REVIEW' || targetStatus === 'APPROVED') {
      doc.dgnReviewedBy = userId;
      doc.dgnReviewedAt = new Date();
    }
    if (targetStatus === 'FINALIZED') {
      doc.dgnFinalizedBy = userId;
      doc.dgnFinalizedAt = new Date();
    }

    await this.generatedRepository.save(doc);

    // Record history
    const actionKey = `${currentStatus}→${targetStatus}`;
    const action = TRANSITION_ACTIONS[actionKey] || targetStatus;
    await this.editHistoryRepository.save(
      this.editHistoryRepository.create({
        dgnId,
        dehAction: action,
        dehUserId: userId,
        dehNotes: notes || `Status changed: ${currentStatus} → ${targetStatus}`,
      } as Partial<DocEditHistoryEntity>),
    );

    return doc;
  }

  async checkStaleness(entityId: string): Promise<{ dgnId: string; dgnTitle: string; reason: string }[]> {
    // Find FINALIZED documents
    const finalizedDocs = await this.generatedRepository.find({
      where: { entId: entityId, dgnStatus: 'FINALIZED', dgnIsDeleted: false },
    });

    const staleDocuments: { dgnId: string; dgnTitle: string; reason: string }[] = [];

    for (const doc of finalizedDocs) {
      const snapshot = doc.dgnDataSnapshot;
      if (!snapshot) continue;

      // Check if any base data used has been updated since document generation
      for (const [categoryCode, catData] of Object.entries(snapshot)) {
        const cat = catData as any;
        if (!cat.hasData) continue;

        // Find current base data for this category
        const currentData = await this.baseDataRepository
          .createQueryBuilder('d')
          .innerJoin('d.category', 'c')
          .where('c.dbcCode = :code', { code: categoryCode })
          .andWhere('d.entId = :entityId', { entityId })
          .andWhere('d.dbdIsCurrent = true')
          .andWhere('d.dbdUpdatedAt > :docDate', { docDate: doc.dgnCreatedAt })
          .getOne();

        if (currentData) {
          staleDocuments.push({
            dgnId: doc.dgnId,
            dgnTitle: doc.dgnTitle,
            reason: `Base data "${categoryCode}" was updated on ${currentData.dbdUpdatedAt.toISOString().split('T')[0]}`,
          });
          break; // one reason is enough
        }
      }
    }

    return staleDocuments;
  }

  async markOutdated(entityId: string, dgnId: string, reason: string): Promise<DocGeneratedEntity> {
    return this.transition(entityId, dgnId, 'SYSTEM', 'OUTDATED', reason);
  }

  async getLifecycleTimeline(entityId: string, dgnId: string): Promise<DocEditHistoryEntity[]> {
    const doc = await this.generatedRepository.findOne({
      where: { dgnId, entId: entityId, dgnIsDeleted: false },
    });
    if (!doc) throw new NotFoundException(`Document ${dgnId} not found`);

    return this.editHistoryRepository.find({
      where: { dgnId },
      order: { dehCreatedAt: 'ASC' },
      relations: ['user'],
    });
  }

  getValidTransitions(currentStatus: string): string[] {
    return VALID_TRANSITIONS[currentStatus] || [];
  }
}
