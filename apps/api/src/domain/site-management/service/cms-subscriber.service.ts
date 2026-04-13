import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CmsSubscriberEntity } from '../entity/cms-subscriber.entity';
import { CmsPageEntity } from '../entity/cms-page.entity';
import { SubscribeRequest } from '../dto/request/subscribe.request';
import { CmsSubscriberMapper } from '../mapper/cms-subscriber.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class CmsSubscriberService {
  constructor(
    @InjectRepository(CmsSubscriberEntity)
    private readonly subscriberRepo: Repository<CmsSubscriberEntity>,
    @InjectRepository(CmsPageEntity)
    private readonly pageRepo: Repository<CmsPageEntity>,
  ) {}

  async getSubscribers(
    pageId: string,
    entId: string,
    filters?: { search?: string; page?: number; limit?: number },
  ) {
    await this.validatePage(pageId, entId);

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const qb = this.subscriberRepo
      .createQueryBuilder('s')
      .where('s.cmp_id = :pageId', { pageId })
      .orderBy('s.csb_subscribed_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters?.search) {
      qb.andWhere('(s.csb_email ILIKE :search OR s.csb_name ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [subscribers, total] = await qb.getManyAndCount();
    return {
      items: subscribers.map((s) => CmsSubscriberMapper.toResponse(s)),
      total,
      page,
      limit,
    };
  }

  async subscribe(pageId: string, dto: SubscribeRequest) {
    // Check duplicate
    const existing = await this.subscriberRepo.findOne({
      where: { cmpId: pageId, csbEmail: dto.email, csbUnsubscribedAt: IsNull() },
    });
    if (existing) {
      throw new ConflictException(ERROR_CODE.CMS_SUBSCRIBER_ALREADY_EXISTS);
    }

    const subscriber = this.subscriberRepo.create({
      cmpId: pageId,
      csbEmail: dto.email,
      csbName: dto.name || null,
    });
    await this.subscriberRepo.save(subscriber);
    return CmsSubscriberMapper.toResponse(subscriber);
  }

  async exportCsv(pageId: string, entId: string) {
    await this.validatePage(pageId, entId);

    const subscribers = await this.subscriberRepo.find({
      where: { cmpId: pageId },
      order: { csbSubscribedAt: 'DESC' },
    });

    const header = 'Email,Name,Subscribed At,Status\n';
    const rows = subscribers.map((s) => {
      const status = s.csbUnsubscribedAt ? 'Unsubscribed' : 'Active';
      return `${s.csbEmail},${s.csbName || ''},${s.csbSubscribedAt?.toISOString() || ''},${status}`;
    });
    return header + rows.join('\n');
  }

  private async validatePage(pageId: string, entId: string) {
    const page = await this.pageRepo.findOne({ where: { cmpId: pageId, entId } });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);
    return page;
  }
}
