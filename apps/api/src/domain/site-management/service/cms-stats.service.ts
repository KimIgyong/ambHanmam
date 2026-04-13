import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsMenuEntity } from '../entity/cms-menu.entity';
import { CmsPageEntity } from '../entity/cms-page.entity';
import { CmsPostEntity } from '../entity/cms-post.entity';
import { CmsSubscriberEntity } from '../entity/cms-subscriber.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

export interface EntityCmsStats {
  entityId: string;
  entityCode: string;
  entityName: string;
  menuCount: number;
  pageCount: number;
  postCount: number;
  subscriberCount: number;
}

@Injectable()
export class CmsStatsService {
  constructor(
    @InjectRepository(CmsMenuEntity)
    private readonly menuRepo: Repository<CmsMenuEntity>,
    @InjectRepository(CmsPageEntity)
    private readonly pageRepo: Repository<CmsPageEntity>,
    @InjectRepository(CmsPostEntity)
    private readonly postRepo: Repository<CmsPostEntity>,
    @InjectRepository(CmsSubscriberEntity)
    private readonly subscriberRepo: Repository<CmsSubscriberEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
  ) {}

  async getEntityStats(): Promise<EntityCmsStats[]> {
    const entities = await this.entityRepo.find({
      where: { entStatus: 'ACTIVE' },
      order: { entSortOrder: 'ASC' },
    });

    const [menuCounts, pageCounts, postCounts, subscriberCounts] =
      await Promise.all([
        this.menuRepo
          .createQueryBuilder('m')
          .select('m.ent_id', 'entId')
          .addSelect('COUNT(*)', 'count')
          .where('m.cmn_deleted_at IS NULL')
          .groupBy('m.ent_id')
          .getRawMany<{ entId: string; count: string }>(),
        this.pageRepo
          .createQueryBuilder('p')
          .select('p.ent_id', 'entId')
          .addSelect('COUNT(*)', 'count')
          .where('p.cmp_deleted_at IS NULL')
          .groupBy('p.ent_id')
          .getRawMany<{ entId: string; count: string }>(),
        // Post는 ent_id 없음 → page 조인으로 법인별 집계
        this.postRepo
          .createQueryBuilder('po')
          .innerJoin('amb_cms_pages', 'pg', 'pg.cmp_id = po.cmp_id')
          .select('pg.ent_id', 'entId')
          .addSelect('COUNT(*)', 'count')
          .where('po.cpt_deleted_at IS NULL')
          .andWhere('pg.cmp_deleted_at IS NULL')
          .groupBy('pg.ent_id')
          .getRawMany<{ entId: string; count: string }>(),
        // Subscriber도 ent_id 없음 → page 조인
        this.subscriberRepo
          .createQueryBuilder('s')
          .innerJoin('amb_cms_pages', 'pg', 'pg.cmp_id = s.cmp_id')
          .select('pg.ent_id', 'entId')
          .addSelect('COUNT(*)', 'count')
          .where('pg.cmp_deleted_at IS NULL')
          .groupBy('pg.ent_id')
          .getRawMany<{ entId: string; count: string }>(),
      ]);

    const toMap = (rows: { entId: string; count: string }[]) =>
      new Map(rows.map((r) => [r.entId, parseInt(r.count, 10)]));

    const menuMap = toMap(menuCounts);
    const pageMap = toMap(pageCounts);
    const postMap = toMap(postCounts);
    const subMap = toMap(subscriberCounts);

    return entities.map((e) => ({
      entityId: e.entId,
      entityCode: e.entCode,
      entityName: e.entName,
      menuCount: menuMap.get(e.entId) || 0,
      pageCount: pageMap.get(e.entId) || 0,
      postCount: postMap.get(e.entId) || 0,
      subscriberCount: subMap.get(e.entId) || 0,
    }));
  }
}
