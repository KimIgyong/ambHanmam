import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository, DeepPartial } from 'typeorm';
import { SvcClientEntity } from '../entity/client.entity';
import { SvcClientContactEntity } from '../entity/client-contact.entity';
import { SvcClientNoteEntity } from '../entity/client-note.entity';
import { SvcSubscriptionEntity } from '../entity/subscription.entity';
import { CreateClientRequest } from '../dto/request/create-client.request';
import { UpdateClientRequest } from '../dto/request/update-client.request';
import { CreateClientNoteRequest } from '../dto/request/create-client-note.request';
import { ClientMapper } from '../mapper/client.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { SvcClientResponse, SvcClientContactResponse, SvcClientNoteResponse } from '@amb/types';
import { MODULE_DATA_EVENTS } from '../../kms/event/module-data.event';
import { TranslationService } from '../../translation/service/translation.service';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(SvcClientEntity)
    private readonly clientRepo: Repository<SvcClientEntity>,
    @InjectRepository(SvcClientContactEntity)
    private readonly contactRepo: Repository<SvcClientContactEntity>,
    @InjectRepository(SvcClientNoteEntity)
    private readonly noteRepo: Repository<SvcClientNoteEntity>,
    @InjectRepository(SvcSubscriptionEntity)
    private readonly subscriptionRepo: Repository<SvcSubscriptionEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly translationService: TranslationService,
  ) {}

  private async generateClientCode(): Promise<string> {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `C-${ym}-`;

    const latest = await this.clientRepo
      .createQueryBuilder('cli')
      .where('cli.cliCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('cli.cliCode', 'DESC')
      .getOne();

    let seq = 1;
    if (latest) {
      const parts = latest.cliCode.split('-');
      seq = parseInt(parts[2], 10) + 1;
    }
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  async findAll(params?: {
    status?: string; type?: string; service?: string;
    manager?: string; search?: string;
  }): Promise<SvcClientResponse[]> {
    const qb = this.clientRepo
      .createQueryBuilder('cli')
      .leftJoinAndSelect('cli.accountManager', 'mgr');

    if (params?.status) {
      qb.andWhere('cli.cliStatus = :status', { status: params.status });
    }
    if (params?.type) {
      qb.andWhere('cli.cliType = :type', { type: params.type });
    }
    if (params?.manager) {
      qb.andWhere('cli.cliAccountManagerId = :manager', { manager: params.manager });
    }
    if (params?.search) {
      qb.andWhere(
        '(cli.cliCompanyName ILIKE :search OR cli.cliCompanyNameLocal ILIKE :search OR cli.cliCode ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    qb.orderBy('cli.cliCreatedAt', 'DESC');
    const entities = await qb.getMany();

    if (params?.service) {
      // Filter clients that have subscriptions to specific service
      const filtered: SvcClientEntity[] = [];
      for (const entity of entities) {
        const hasSub = await this.subscriptionRepo.count({
          where: { cliId: entity.cliId, svcId: params.service },
        });
        if (hasSub > 0) filtered.push(entity);
      }
      return this.mapClientsWithCounts(filtered);
    }

    return this.mapClientsWithCounts(entities);
  }

  private async mapClientsWithCounts(entities: SvcClientEntity[]): Promise<SvcClientResponse[]> {
    const results: SvcClientResponse[] = [];
    for (const entity of entities) {
      const subscriptionCount = await this.subscriptionRepo.count({ where: { cliId: entity.cliId } });
      const activeSubscriptionCount = await this.subscriptionRepo.count({
        where: { cliId: entity.cliId, subStatus: 'ACTIVE' },
      });
      results.push(ClientMapper.toResponse(entity, { subscriptionCount, activeSubscriptionCount }));
    }
    return results;
  }

  async findById(id: string): Promise<SvcClientResponse> {
    const entity = await this.clientRepo.findOne({
      where: { cliId: id },
      relations: ['accountManager'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SVC_CLIENT_NOT_FOUND.message);
    }

    const subscriptionCount = await this.subscriptionRepo.count({ where: { cliId: id } });
    const activeSubscriptionCount = await this.subscriptionRepo.count({
      where: { cliId: id, subStatus: 'ACTIVE' },
    });

    const contacts = await this.contactRepo.find({
      where: { cliId: id },
      order: { ctcIsPrimary: 'DESC', ctcCreatedAt: 'ASC' },
    });

    const subscriptions = await this.subscriptionRepo.find({
      where: { cliId: id },
      relations: ['service', 'plan'],
      order: { subCreatedAt: 'DESC' },
    });

    const response = ClientMapper.toResponse(entity, { subscriptionCount, activeSubscriptionCount });
    response.contacts = contacts.map(ClientMapper.contactToResponse);

    const { SubscriptionMapper } = await import('../mapper/subscription.mapper');
    response.subscriptions = subscriptions.map(SubscriptionMapper.toResponse);

    return response;
  }

  async create(dto: CreateClientRequest): Promise<SvcClientResponse> {
    const code = await this.generateClientCode();

    const entity = this.clientRepo.create({
      cliCode: code,
      cliType: dto.type,
      cliCompanyName: dto.company_name,
      cliCompanyNameLocal: dto.company_name_local || undefined,
      cliCountry: dto.country || undefined,
      cliIndustry: dto.industry || undefined,
      cliCompanySize: dto.company_size || undefined,
      cliTaxId: dto.tax_id || undefined,
      cliAddress: dto.address || undefined,
      cliWebsite: dto.website || undefined,
      cliLogoUrl: dto.logo_url || undefined,
      cliStatus: dto.status || 'ACTIVE',
      cliSource: dto.source || undefined,
      cliReferredBy: dto.referred_by || undefined,
      cliAccountManagerId: dto.account_manager_id || undefined,
      cliBilPartnerId: dto.bil_partner_id || undefined,
      cliNote: dto.note || undefined,
    } as DeepPartial<SvcClientEntity>);

    const saved: SvcClientEntity = await this.clientRepo.save(entity as SvcClientEntity);

    this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
      module: 'client',
      type: 'DOC',
      refId: saved.cliId,
      title: saved.cliCompanyName,
      content: [saved.cliCompanyName, saved.cliCompanyNameLocal, saved.cliNote].filter(Boolean).join(' '),
      ownerId: saved.cliAccountManagerId || '',
    });

    return ClientMapper.toResponse(saved);
  }

  async update(id: string, dto: UpdateClientRequest): Promise<SvcClientResponse> {
    const entity = await this.clientRepo.findOne({ where: { cliId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SVC_CLIENT_NOT_FOUND.message);
    }

    if (dto.type !== undefined) entity.cliType = dto.type;
    if (dto.company_name !== undefined) entity.cliCompanyName = dto.company_name;
    if (dto.company_name_local !== undefined) entity.cliCompanyNameLocal = dto.company_name_local;
    if (dto.country !== undefined) entity.cliCountry = dto.country;
    if (dto.industry !== undefined) entity.cliIndustry = dto.industry;
    if (dto.company_size !== undefined) entity.cliCompanySize = dto.company_size;
    if (dto.tax_id !== undefined) entity.cliTaxId = dto.tax_id;
    if (dto.address !== undefined) entity.cliAddress = dto.address;
    if (dto.website !== undefined) entity.cliWebsite = dto.website;
    if (dto.logo_url !== undefined) entity.cliLogoUrl = dto.logo_url;
    if (dto.status !== undefined) entity.cliStatus = dto.status;
    if (dto.source !== undefined) entity.cliSource = dto.source;
    if (dto.referred_by !== undefined) entity.cliReferredBy = dto.referred_by;
    if (dto.account_manager_id !== undefined) entity.cliAccountManagerId = dto.account_manager_id;
    if (dto.bil_partner_id !== undefined) entity.cliBilPartnerId = dto.bil_partner_id;
    if (dto.note !== undefined) entity.cliNote = dto.note;

    const saved = await this.clientRepo.save(entity);

    // Mark translations stale if translatable fields changed
    if (dto.company_name !== undefined || dto.note !== undefined) {
      await this.translationService.markStale('CLIENT', saved.cliId);
    }

    this.eventEmitter.emit(MODULE_DATA_EVENTS.UPDATED, {
      module: 'client',
      type: 'DOC',
      refId: saved.cliId,
      title: saved.cliCompanyName,
      content: [saved.cliCompanyName, saved.cliCompanyNameLocal, saved.cliNote].filter(Boolean).join(' '),
      ownerId: saved.cliAccountManagerId || '',
    });

    return ClientMapper.toResponse(saved);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.clientRepo.findOne({ where: { cliId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.SVC_CLIENT_NOT_FOUND.message);
    }
    await this.clientRepo.softRemove(entity);
  }

  // Contact methods
  async findContacts(clientId: string): Promise<SvcClientContactResponse[]> {
    const contacts = await this.contactRepo.find({
      where: { cliId: clientId },
      order: { ctcIsPrimary: 'DESC', ctcCreatedAt: 'ASC' },
    });
    return contacts.map(ClientMapper.contactToResponse);
  }

  async createContact(clientId: string, data: {
    name: string; email?: string; phone?: string; position?: string;
    department?: string; is_primary?: boolean; note?: string;
  }): Promise<SvcClientContactResponse> {
    const client = await this.clientRepo.findOne({ where: { cliId: clientId } });
    if (!client) {
      throw new NotFoundException(ERROR_CODE.SVC_CLIENT_NOT_FOUND.message);
    }

    if (data.is_primary) {
      await this.contactRepo.update({ cliId: clientId }, { ctcIsPrimary: false });
    }

    const entity = this.contactRepo.create({
      cliId: clientId,
      ctcName: data.name,
      ctcEmail: data.email || undefined,
      ctcPhone: data.phone || undefined,
      ctcPosition: data.position || undefined,
      ctcDepartment: data.department || undefined,
      ctcIsPrimary: data.is_primary ?? false,
      ctcNote: data.note || undefined,
    } as DeepPartial<SvcClientContactEntity>);

    const saved: SvcClientContactEntity = await this.contactRepo.save(entity as SvcClientContactEntity);
    return ClientMapper.contactToResponse(saved);
  }

  async updateContact(clientId: string, contactId: string, data: Record<string, any>): Promise<SvcClientContactResponse> {
    const entity = await this.contactRepo.findOne({ where: { ctcId: contactId, cliId: clientId } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.CLIENT_CONTACT_NOT_FOUND.message);
    }

    if (data.is_primary) {
      await this.contactRepo.update({ cliId: clientId }, { ctcIsPrimary: false });
    }

    if (data.name !== undefined) entity.ctcName = data.name;
    if (data.email !== undefined) entity.ctcEmail = data.email;
    if (data.phone !== undefined) entity.ctcPhone = data.phone;
    if (data.position !== undefined) entity.ctcPosition = data.position;
    if (data.department !== undefined) entity.ctcDepartment = data.department;
    if (data.is_primary !== undefined) entity.ctcIsPrimary = data.is_primary;
    if (data.note !== undefined) entity.ctcNote = data.note;

    const saved = await this.contactRepo.save(entity);
    return ClientMapper.contactToResponse(saved);
  }

  async deleteContact(clientId: string, contactId: string): Promise<void> {
    const entity = await this.contactRepo.findOne({ where: { ctcId: contactId, cliId: clientId } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.CLIENT_CONTACT_NOT_FOUND.message);
    }
    await this.contactRepo.softRemove(entity);
  }

  // Note methods
  async findNotes(clientId: string): Promise<SvcClientNoteResponse[]> {
    const notes = await this.noteRepo.find({
      where: { cliId: clientId },
      relations: ['author'],
      order: { cntCreatedAt: 'DESC' },
    });
    return notes.map(ClientMapper.noteToResponse);
  }

  async createNote(clientId: string, dto: CreateClientNoteRequest, userId: string): Promise<SvcClientNoteResponse> {
    const client = await this.clientRepo.findOne({ where: { cliId: clientId } });
    if (!client) {
      throw new NotFoundException(ERROR_CODE.SVC_CLIENT_NOT_FOUND.message);
    }

    const entity = this.noteRepo.create({
      cliId: clientId,
      subId: dto.subscription_id || undefined,
      cntType: dto.type,
      cntTitle: dto.title || undefined,
      cntContent: dto.content,
      cntAuthorId: userId,
    } as DeepPartial<SvcClientNoteEntity>);

    const saved: SvcClientNoteEntity = await this.noteRepo.save(entity as SvcClientNoteEntity);
    const full = await this.noteRepo.findOne({
      where: { cntId: saved.cntId },
      relations: ['author'],
    });
    return ClientMapper.noteToResponse(full!);
  }

  async updateNote(clientId: string, noteId: string, data: Record<string, any>): Promise<SvcClientNoteResponse> {
    const entity = await this.noteRepo.findOne({
      where: { cntId: noteId, cliId: clientId },
      relations: ['author'],
    });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.CLIENT_NOTE_NOT_FOUND.message);
    }

    if (data.type !== undefined) entity.cntType = data.type;
    if (data.title !== undefined) entity.cntTitle = data.title;
    if (data.content !== undefined) entity.cntContent = data.content;

    const saved = await this.noteRepo.save(entity);
    return ClientMapper.noteToResponse(saved);
  }

  async deleteNote(clientId: string, noteId: string): Promise<void> {
    const entity = await this.noteRepo.findOne({ where: { cntId: noteId, cliId: clientId } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.CLIENT_NOTE_NOT_FOUND.message);
    }
    await this.noteRepo.softRemove(entity);
  }
}
