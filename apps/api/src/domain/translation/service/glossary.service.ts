import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { TranslationGlossaryEntity } from '../entity/translation-glossary.entity';
import { CreateGlossaryRequest, UpdateGlossaryRequest } from '../dto/request/glossary.request';
import { TranslationMapper } from '../mapper/translation.mapper';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { GlossaryTermResponse } from '@amb/types';

@Injectable()
export class GlossaryService {
  constructor(
    @InjectRepository(TranslationGlossaryEntity)
    private readonly glossaryRepo: Repository<TranslationGlossaryEntity>,
  ) {}

  async getTerms(entityId?: string): Promise<GlossaryTermResponse[]> {
    const entities = await this.glossaryRepo.find({
      where: { entId: entityId || IsNull() as any, glsIsDeleted: false },
      order: { glsTermEn: 'ASC' },
    });
    return entities.map((e) => TranslationMapper.toGlossaryResponse(e));
  }

  async createTerm(dto: CreateGlossaryRequest, userId: string, entityId?: string): Promise<GlossaryTermResponse> {
    // Check duplicate
    const existing = await this.glossaryRepo.findOne({
      where: { glsTermEn: dto.term_en, entId: entityId || IsNull() as any, glsIsDeleted: false },
    });
    if (existing) {
      throw new BusinessException(ERROR_CODE.GLOSSARY_TERM_EXISTS.code, ERROR_CODE.GLOSSARY_TERM_EXISTS.message, HttpStatus.CONFLICT);
    }

    const entity = this.glossaryRepo.create({
      entId: entityId || null,
      glsTermEn: dto.term_en,
      glsTermKo: dto.term_ko || null,
      glsTermVi: dto.term_vi || null,
      glsCategory: dto.category || null,
      glsContext: dto.context || null,
      glsIsDeleted: false,
      glsCreatedBy: userId,
    });

    const saved = await this.glossaryRepo.save(entity);
    return TranslationMapper.toGlossaryResponse(saved);
  }

  async updateTerm(glsId: string, dto: UpdateGlossaryRequest): Promise<GlossaryTermResponse> {
    const entity = await this.glossaryRepo.findOne({ where: { glsId, glsIsDeleted: false } });
    if (!entity) {
      throw new BusinessException(ERROR_CODE.GLOSSARY_NOT_FOUND.code, ERROR_CODE.GLOSSARY_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }

    if (dto.term_en !== undefined) entity.glsTermEn = dto.term_en;
    if (dto.term_ko !== undefined) entity.glsTermKo = dto.term_ko || null;
    if (dto.term_vi !== undefined) entity.glsTermVi = dto.term_vi || null;
    if (dto.category !== undefined) entity.glsCategory = dto.category || null;
    if (dto.context !== undefined) entity.glsContext = dto.context || null;

    const saved = await this.glossaryRepo.save(entity);
    return TranslationMapper.toGlossaryResponse(saved);
  }

  async deleteTerm(glsId: string): Promise<void> {
    const entity = await this.glossaryRepo.findOne({ where: { glsId, glsIsDeleted: false } });
    if (!entity) {
      throw new BusinessException(ERROR_CODE.GLOSSARY_NOT_FOUND.code, ERROR_CODE.GLOSSARY_NOT_FOUND.message, HttpStatus.NOT_FOUND);
    }
    entity.glsIsDeleted = true;
    await this.glossaryRepo.save(entity);
  }

  async getTermsForPrompt(entityId?: string): Promise<string> {
    const terms = await this.glossaryRepo.find({
      where: { entId: entityId || IsNull() as any, glsIsDeleted: false },
    });
    if (terms.length === 0) return '';

    return terms.map(t => {
      const parts = [`EN: ${t.glsTermEn}`];
      if (t.glsTermKo) parts.push(`KO: ${t.glsTermKo}`);
      if (t.glsTermVi) parts.push(`VI: ${t.glsTermVi}`);
      return `- ${parts.join(' | ')}`;
    }).join('\n');
  }
}
