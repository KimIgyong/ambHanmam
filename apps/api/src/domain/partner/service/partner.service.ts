import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { PartnerOrganizationEntity } from '../entity/partner-organization.entity';
import { CreatePartnerRequest } from '../dto/request/create-partner.request';
import { UpdatePartnerRequest } from '../dto/request/update-partner.request';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class PartnerService {
  constructor(
    @InjectRepository(PartnerOrganizationEntity)
    private readonly partnerRepo: Repository<PartnerOrganizationEntity>,
  ) {}

  async findAll(search?: string) {
    const where = search
      ? [
          { ptnCompanyName: ILike(`%${search}%`) },
          { ptnCode: ILike(`%${search}%`) },
        ]
      : undefined;

    const partners = await this.partnerRepo.find({
      where,
      order: { ptnCode: 'ASC' },
    });

    return partners.map((p) => this.toResponse(p));
  }

  async findOne(id: string) {
    const partner = await this.partnerRepo.findOne({ where: { ptnId: id } });
    if (!partner) {
      throw new BusinessException(
        'E4001',
        'Partner organization not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toResponse(partner);
  }

  async create(dto: CreatePartnerRequest) {
    const existing = await this.partnerRepo.findOne({
      where: { ptnCode: dto.code },
    });
    if (existing) {
      throw new BusinessException(
        'E4002',
        'Partner code already exists',
        HttpStatus.CONFLICT,
      );
    }

    const partner = this.partnerRepo.create({
      ptnCode: dto.code,
      ptnCompanyName: dto.company_name,
      ptnCompanyNameLocal: dto.company_name_local || null,
      ptnCountry: dto.country || null,
      ptnContactName: dto.contact_name || null,
      ptnContactEmail: dto.contact_email || null,
      ptnContactPhone: dto.contact_phone || null,
      ptnAddress: dto.address || null,
      ptnTaxId: dto.tax_id || null,
      ptnNote: dto.note || null,
    });

    const saved = await this.partnerRepo.save(partner);
    return this.toResponse(saved);
  }

  async update(id: string, dto: UpdatePartnerRequest) {
    const partner = await this.partnerRepo.findOne({ where: { ptnId: id } });
    if (!partner) {
      throw new BusinessException(
        'E4001',
        'Partner organization not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.company_name !== undefined) partner.ptnCompanyName = dto.company_name;
    if (dto.company_name_local !== undefined) partner.ptnCompanyNameLocal = dto.company_name_local;
    if (dto.country !== undefined) partner.ptnCountry = dto.country;
    if (dto.contact_name !== undefined) partner.ptnContactName = dto.contact_name;
    if (dto.contact_email !== undefined) partner.ptnContactEmail = dto.contact_email;
    if (dto.contact_phone !== undefined) partner.ptnContactPhone = dto.contact_phone;
    if (dto.address !== undefined) partner.ptnAddress = dto.address;
    if (dto.tax_id !== undefined) partner.ptnTaxId = dto.tax_id;
    if (dto.status !== undefined) partner.ptnStatus = dto.status;
    if (dto.note !== undefined) partner.ptnNote = dto.note;

    const saved = await this.partnerRepo.save(partner);
    return this.toResponse(saved);
  }

  async remove(id: string) {
    const partner = await this.partnerRepo.findOne({ where: { ptnId: id } });
    if (!partner) {
      throw new BusinessException(
        'E4001',
        'Partner organization not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.partnerRepo.softRemove(partner);
    return { success: true };
  }

  private toResponse(p: PartnerOrganizationEntity) {
    return {
      id: p.ptnId,
      code: p.ptnCode,
      companyName: p.ptnCompanyName,
      companyNameLocal: p.ptnCompanyNameLocal,
      country: p.ptnCountry,
      contactName: p.ptnContactName,
      contactEmail: p.ptnContactEmail,
      contactPhone: p.ptnContactPhone,
      address: p.ptnAddress,
      taxId: p.ptnTaxId,
      status: p.ptnStatus,
      note: p.ptnNote,
      createdAt: p.ptnCreatedAt,
      updatedAt: p.ptnUpdatedAt,
    };
  }
}
