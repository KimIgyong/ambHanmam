import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsPostEntity } from '../entity/cms-post.entity';
import { CmsPostCategoryEntity } from '../entity/cms-post-category.entity';
import { CmsPageEntity } from '../entity/cms-page.entity';
import { CreatePostRequest } from '../dto/request/create-post.request';
import { UpdatePostRequest } from '../dto/request/update-post.request';
import { CreatePostCategoryRequest } from '../dto/request/create-post-category.request';
import { CmsPostMapper } from '../mapper/cms-post.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class CmsPostService {
  constructor(
    @InjectRepository(CmsPostEntity)
    private readonly postRepo: Repository<CmsPostEntity>,
    @InjectRepository(CmsPostCategoryEntity)
    private readonly categoryRepo: Repository<CmsPostCategoryEntity>,
    @InjectRepository(CmsPageEntity)
    private readonly pageRepo: Repository<CmsPageEntity>,
  ) {}

  async getPosts(
    pageId: string,
    entId: string,
    filters?: { categoryId?: string; status?: string; search?: string; page?: number; limit?: number },
  ) {
    await this.validatePage(pageId, entId);

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const qb = this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'cat')
      .where('p.cmp_id = :pageId', { pageId })
      .orderBy('p.cptIsPinned', 'DESC')
      .addOrderBy('p.cptCreatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters?.categoryId) qb.andWhere('p.cpg_id = :catId', { catId: filters.categoryId });
    if (filters?.status) qb.andWhere('p.cpt_status = :status', { status: filters.status });
    if (filters?.search) {
      qb.andWhere('(p.cpt_title ILIKE :search OR p.cpt_content ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [posts, total] = await qb.getManyAndCount();
    return {
      items: posts.map((p) => CmsPostMapper.toListResponse(p)),
      total,
      page,
      limit,
    };
  }

  async getPostById(postId: string) {
    const post = await this.postRepo.findOne({
      where: { cptId: postId },
      relations: ['category', 'attachments'],
    });
    if (!post) throw new NotFoundException(ERROR_CODE.CMS_POST_NOT_FOUND);
    return CmsPostMapper.toResponse(post);
  }

  async createPost(pageId: string, entId: string, userId: string, dto: CreatePostRequest) {
    await this.validatePage(pageId, entId);

    const post = this.postRepo.create({
      cmpId: pageId,
      cpgId: dto.category_id || null,
      cptTitle: dto.title,
      cptContent: dto.content,
      cptAuthorId: userId,
      cptIsPinned: dto.is_pinned || false,
      cptFeaturedImage: dto.featured_image || null,
      cptTags: dto.tags || null,
      cptStatus: dto.status || 'PUBLISHED',
      cptPublishedAt: dto.status !== 'DRAFT' ? new Date() : null,
    });
    await this.postRepo.save(post);
    return CmsPostMapper.toResponse(post);
  }

  async updatePost(postId: string, dto: UpdatePostRequest) {
    const post = await this.postRepo.findOne({ where: { cptId: postId } });
    if (!post) throw new NotFoundException(ERROR_CODE.CMS_POST_NOT_FOUND);

    if (dto.title !== undefined) post.cptTitle = dto.title;
    if (dto.content !== undefined) post.cptContent = dto.content;
    if (dto.category_id !== undefined) post.cpgId = dto.category_id;
    if (dto.is_pinned !== undefined) post.cptIsPinned = dto.is_pinned;
    if (dto.featured_image !== undefined) post.cptFeaturedImage = dto.featured_image;
    if (dto.tags !== undefined) post.cptTags = dto.tags;
    if (dto.status !== undefined) {
      post.cptStatus = dto.status;
      if (dto.status === 'PUBLISHED' && !post.cptPublishedAt) {
        post.cptPublishedAt = new Date();
      }
    }

    await this.postRepo.save(post);
    return this.getPostById(postId);
  }

  async deletePost(postId: string) {
    const post = await this.postRepo.findOne({ where: { cptId: postId } });
    if (!post) throw new NotFoundException(ERROR_CODE.CMS_POST_NOT_FOUND);
    await this.postRepo.softRemove(post);
  }

  // Categories
  async getCategories(pageId: string, entId: string) {
    await this.validatePage(pageId, entId);
    const cats = await this.categoryRepo.find({
      where: { cmpId: pageId },
      order: { cpgSortOrder: 'ASC' },
    });
    return cats.map((c) => ({ id: c.cpgId, name: c.cpgName, sortOrder: c.cpgSortOrder }));
  }

  async createCategory(pageId: string, entId: string, dto: CreatePostCategoryRequest) {
    await this.validatePage(pageId, entId);

    const maxSort = await this.categoryRepo
      .createQueryBuilder('c')
      .select('MAX(c.cpg_sort_order)', 'max')
      .where('c.cmp_id = :pageId', { pageId })
      .getRawOne();

    const cat = this.categoryRepo.create({
      cmpId: pageId,
      cpgName: dto.name,
      cpgSortOrder: (maxSort?.max || 0) + 1,
    });
    await this.categoryRepo.save(cat);
    return { id: cat.cpgId, name: cat.cpgName, sortOrder: cat.cpgSortOrder };
  }

  async deleteCategory(categoryId: string) {
    const cat = await this.categoryRepo.findOne({ where: { cpgId: categoryId } });
    if (!cat) throw new NotFoundException(ERROR_CODE.CMS_POST_CATEGORY_NOT_FOUND);
    // Set posts in this category to null
    await this.postRepo.update({ cpgId: categoryId }, { cpgId: null as any });
    await this.categoryRepo.remove(cat);
  }

  // Public: increment view count
  async incrementViewCount(postId: string) {
    await this.postRepo.increment({ cptId: postId }, 'cptViewCount', 1);
  }

  private async validatePage(pageId: string, entId: string) {
    const page = await this.pageRepo.findOne({ where: { cmpId: pageId, entId } });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);
    return page;
  }
}
