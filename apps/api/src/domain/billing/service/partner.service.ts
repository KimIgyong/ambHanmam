import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository, DeepPartial } from 'typeorm';
import { PartnerEntity } from '../entity/partner.entity';
import { CreatePartnerRequest } from '../dto/request/create-partner.request';
import { UpdatePartnerRequest } from '../dto/request/update-partner.request';
import { PartnerMapper } from '../mapper/partner.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { BilPartnerResponse } from '@amb/types';
import { MODULE_DATA_EVENTS } from '../../kms/event/module-data.event';
import { TranslationService } from '../../translation/service/translation.service';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(PartnerEntity)
    private readonly partnerRepo: Repository<PartnerEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly translationService: TranslationService,
  ) {}

  async findAll(
    entId: string,
    params?: { type?: string; status?: string; search?: string },
  ): Promise<BilPartnerResponse[]> {
    const qb = this.partnerRepo
      .createQueryBuilder('ptn')
      .where('ptn.entId = :entId', { entId });

    if (params?.type) {
      qb.andWhere('ptn.ptnType = :type', { type: params.type });
    }
    if (params?.status) {
      qb.andWhere('ptn.ptnStatus = :status', { status: params.status });
    }
    if (params?.search) {
      qb.andWhere(
        '(ptn.ptnCompanyName ILIKE :search OR ptn.ptnCompanyNameLocal ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    qb.orderBy('ptn.ptnCode', 'ASC');

    const entities = await qb.getMany();
    return entities.map(PartnerMapper.toResponse);
  }

  async findById(id: string, entId: string): Promise<BilPartnerResponse> {
    const entity = await this.partnerRepo.findOne({
      where: { ptnId: id, entId },
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.PARTNER_NOT_FOUND.message);
    }
    return PartnerMapper.toResponse(entity);
  }

  async create(dto: CreatePartnerRequest, entId: string): Promise<BilPartnerResponse> {
    const existing = await this.partnerRepo.findOne({
      where: { entId, ptnCode: dto.code },
    });
    if (existing) {
      throw new ConflictException(ERROR_CODE.PARTNER_CODE_DUPLICATE.message);
    }

    const entity = this.partnerRepo.create({
      entId,
      ptnCode: dto.code,
      ptnType: dto.type,
      ptnCompanyName: dto.company_name,
      ptnCompanyNameLocal: dto.company_name_local || null,
      ptnCountry: dto.country || null,
      ptnContactName: dto.contact_name || null,
      ptnContactEmail: dto.contact_email || null,
      ptnContactPhone: dto.contact_phone || null,
      ptnAddress: dto.address || null,
      ptnTaxId: dto.tax_id || null,
      ptnBizType: dto.biz_type || null,
      ptnBizCategory: dto.biz_category || null,
      ptnCeoName: dto.ceo_name || null,
      ptnDefaultCurrency: dto.default_currency || 'USD',
      ptnPaymentTerms: dto.payment_terms ?? 30,
      ptnStatus: dto.status || 'ACTIVE',
      ptnNote: dto.note || null,
    } as DeepPartial<PartnerEntity>);

    const saved: PartnerEntity = await this.partnerRepo.save(entity as PartnerEntity);

    this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
      module: 'partner',
      type: 'DOC',
      refId: saved.ptnId,
      title: saved.ptnCompanyName,
      content: [saved.ptnCompanyName, saved.ptnCompanyNameLocal, saved.ptnNote].filter(Boolean).join(' '),
      ownerId: '',
      entityId: entId,
    });

    return PartnerMapper.toResponse(saved);
  }

  async update(id: string, dto: UpdatePartnerRequest, entId: string): Promise<BilPartnerResponse> {
    const entity = await this.partnerRepo.findOne({
      where: { ptnId: id, entId },
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.PARTNER_NOT_FOUND.message);
    }

    if (dto.code !== undefined) entity.ptnCode = dto.code;
    if (dto.type !== undefined) entity.ptnType = dto.type;
    if (dto.company_name !== undefined) entity.ptnCompanyName = dto.company_name;
    if (dto.company_name_local !== undefined) entity.ptnCompanyNameLocal = dto.company_name_local;
    if (dto.country !== undefined) entity.ptnCountry = dto.country;
    if (dto.contact_name !== undefined) entity.ptnContactName = dto.contact_name;
    if (dto.contact_email !== undefined) entity.ptnContactEmail = dto.contact_email;
    if (dto.contact_phone !== undefined) entity.ptnContactPhone = dto.contact_phone;
    if (dto.address !== undefined) entity.ptnAddress = dto.address;
    if (dto.tax_id !== undefined) entity.ptnTaxId = dto.tax_id;
    if (dto.biz_type !== undefined) entity.ptnBizType = dto.biz_type;
    if (dto.biz_category !== undefined) entity.ptnBizCategory = dto.biz_category;
    if (dto.ceo_name !== undefined) entity.ptnCeoName = dto.ceo_name;
    if (dto.default_currency !== undefined) entity.ptnDefaultCurrency = dto.default_currency;
    if (dto.payment_terms !== undefined) entity.ptnPaymentTerms = dto.payment_terms;
    if (dto.status !== undefined) entity.ptnStatus = dto.status;
    if (dto.note !== undefined) entity.ptnNote = dto.note;

    const saved = await this.partnerRepo.save(entity);

    // Mark translations stale if translatable fields changed
    if (dto.company_name !== undefined || dto.note !== undefined) {
      await this.translationService.markStale('PARTNER', saved.ptnId);
    }

    this.eventEmitter.emit(MODULE_DATA_EVENTS.UPDATED, {
      module: 'partner',
      type: 'DOC',
      refId: saved.ptnId,
      title: saved.ptnCompanyName,
      content: [saved.ptnCompanyName, saved.ptnCompanyNameLocal, saved.ptnNote].filter(Boolean).join(' '),
      ownerId: '',
      entityId: entId,
    });

    return PartnerMapper.toResponse(saved);
  }

  async delete(id: string, entId: string): Promise<void> {
    const entity = await this.partnerRepo.findOne({
      where: { ptnId: id, entId },
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.PARTNER_NOT_FOUND.message);
    }
    await this.partnerRepo.softRemove(entity);
  }
}
