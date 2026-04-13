import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KmsTagEntity } from '../entity/kms-tag.entity';
import { KmsTagSynonymEntity } from '../entity/kms-tag-synonym.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

interface SeedTag {
  name: string;
  display: string;
  nameLocal?: string;
  level: number;
  color?: string;
  synonyms?: { synonym: string; language?: string }[];
  children?: SeedTag[];
}

@Injectable()
export class TagSeedService implements OnModuleInit {
  private readonly logger = new Logger(TagSeedService.name);

  constructor(
    @InjectRepository(KmsTagEntity)
    private readonly tagRepository: Repository<KmsTagEntity>,
    @InjectRepository(KmsTagSynonymEntity)
    private readonly synonymRepository: Repository<KmsTagSynonymEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepository: Repository<HrEntityEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedIfEmpty();
  }

  private async seedIfEmpty(): Promise<void> {
    const count = await this.tagRepository.count();
    if (count > 0) {
      this.logger.log('Tags already exist, skipping seed');
      return;
    }

    const entities = await this.entityRepository.find();
    if (entities.length === 0) {
      this.logger.warn('No entities found, skipping tag seed');
      return;
    }

    for (const entity of entities) {
      await this.seedForEntity(entity.entId);
    }
    this.logger.log(`Seeded tags for ${entities.length} entities`);
  }

  async seedForEntity(entityId: string): Promise<void> {
    const seedData = this.getSeedData();

    for (const domain of seedData) {
      await this.createTagWithChildren(entityId, domain, null);
    }
  }

  private async createTagWithChildren(
    entityId: string,
    seedTag: SeedTag,
    parentId: string | null,
  ): Promise<void> {
    const existing = await this.tagRepository.findOne({
      where: { entId: entityId, tagName: seedTag.name },
    });

    let tag: KmsTagEntity;
    if (existing) {
      tag = existing;
    } else {
      tag = this.tagRepository.create({
        entId: entityId,
        tagName: seedTag.name,
        tagDisplay: seedTag.display,
        tagNameLocal: seedTag.nameLocal || null,
        tagLevel: seedTag.level,
        tagParentId: parentId,
        tagColor: seedTag.color || null,
        tagIsSystem: true,
      } as Partial<KmsTagEntity>) as KmsTagEntity;
      tag = await this.tagRepository.save(tag) as KmsTagEntity;
    }

    // Create synonyms
    if (seedTag.synonyms) {
      for (const syn of seedTag.synonyms) {
        const existingSyn = await this.synonymRepository.findOne({
          where: { tagId: tag.tagId, tsySynonym: syn.synonym },
        });
        if (!existingSyn) {
          const synEntity = this.synonymRepository.create({
              tagId: tag.tagId,
              tsySynonym: syn.synonym,
              tsyLanguage: syn.language || null,
            } as Partial<KmsTagSynonymEntity>) as KmsTagSynonymEntity;
          await this.synonymRepository.save(synEntity);
        }
      }
    }

    // Create children
    if (seedTag.children) {
      for (const child of seedTag.children) {
        await this.createTagWithChildren(entityId, child, tag.tagId);
      }
    }
  }

  private getSeedData(): SeedTag[] {
    return [
      {
        name: 'finance',
        display: 'Finance',
        nameLocal: '재무/금융',
        level: 1,
        color: '#2563EB',
        synonyms: [
          { synonym: '재무', language: 'ko' },
          { synonym: 'tài chính', language: 'vi' },
        ],
        children: [
          { name: 'accounting', display: 'Accounting', nameLocal: '회계', level: 2 },
          { name: 'invoicing', display: 'Invoicing', nameLocal: '청구', level: 2 },
          { name: 'payroll', display: 'Payroll', nameLocal: '급여', level: 2 },
          { name: 'tax', display: 'Tax', nameLocal: '세금', level: 2 },
        ],
      },
      {
        name: 'human-resources',
        display: 'Human Resources',
        nameLocal: '인사',
        level: 1,
        color: '#059669',
        synonyms: [
          { synonym: '인사', language: 'ko' },
          { synonym: 'nhân sự', language: 'vi' },
          { synonym: 'hr', language: 'en' },
        ],
        children: [
          { name: 'recruitment', display: 'Recruitment', nameLocal: '채용', level: 2 },
          { name: 'onboarding', display: 'Onboarding', nameLocal: '온보딩', level: 2 },
          { name: 'attendance', display: 'Attendance', nameLocal: '근태', level: 2 },
        ],
      },
      {
        name: 'operations',
        display: 'Operations',
        nameLocal: '운영',
        level: 1,
        color: '#D97706',
        synonyms: [
          { synonym: '운영', language: 'ko' },
          { synonym: 'vận hành', language: 'vi' },
        ],
        children: [
          { name: 'project-management', display: 'Project Management', nameLocal: '프로젝트 관리', level: 2 },
          { name: 'scheduling', display: 'Scheduling', nameLocal: '일정 관리', level: 2 },
        ],
      },
      {
        name: 'legal',
        display: 'Legal',
        nameLocal: '법무',
        level: 1,
        color: '#7C3AED',
        synonyms: [
          { synonym: '법무', language: 'ko' },
          { synonym: 'pháp lý', language: 'vi' },
        ],
        children: [
          { name: 'contracts', display: 'Contracts', nameLocal: '계약', level: 2 },
          { name: 'compliance', display: 'Compliance', nameLocal: '준법', level: 2 },
        ],
      },
      {
        name: 'sales',
        display: 'Sales',
        nameLocal: '영업',
        level: 1,
        color: '#DC2626',
        synonyms: [
          { synonym: '영업', language: 'ko' },
          { synonym: 'kinh doanh', language: 'vi' },
        ],
      },
      {
        name: 'technology',
        display: 'Technology',
        nameLocal: 'IT/기술',
        level: 1,
        color: '#0891B2',
        synonyms: [
          { synonym: 'it', language: 'en' },
          { synonym: '기술', language: 'ko' },
          { synonym: 'công nghệ', language: 'vi' },
        ],
      },
      {
        name: 'general-affairs',
        display: 'General Affairs',
        nameLocal: '총무',
        level: 1,
        color: '#64748B',
        synonyms: [
          { synonym: '총무', language: 'ko' },
          { synonym: 'hành chính', language: 'vi' },
        ],
      },
    ];
  }
}
