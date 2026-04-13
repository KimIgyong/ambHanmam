import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { ManagerGuard } from '../../settings/guard/manager.guard';
import { CmsPostService } from '../service/cms-post.service';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';
import { CreatePostRequest } from '../dto/request/create-post.request';
import { UpdatePostRequest } from '../dto/request/update-post.request';
import { CreatePostCategoryRequest } from '../dto/request/create-post-category.request';

@Controller('cms')
@UseGuards(JwtAuthGuard, ManagerGuard)
export class CmsPostController {
  constructor(private readonly postService: CmsPostService) {}

  @Get('pages/:pageId/posts')
  async getPosts(
    @Param('pageId') pageId: string,
    @Req() req: any,
    @Query('category_id') categoryId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.postService.getPosts(pageId, entId, {
      categoryId,
      status,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('posts/:id')
  async getPost(@Param('id') id: string) {
    const data = await this.postService.getPostById(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('pages/:pageId/posts')
  async createPost(
    @Param('pageId') pageId: string,
    @Body() dto: CreatePostRequest,
    @Req() req: any,
  ) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const userId = req.user.userId;
    const data = await this.postService.createPost(pageId, entId, userId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put('posts/:id')
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostRequest) {
    const data = await this.postService.updatePost(id, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
    await this.postService.deletePost(id);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }

  // Categories
  @Get('pages/:pageId/categories')
  async getCategories(@Param('pageId') pageId: string, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.postService.getCategories(pageId, entId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('pages/:pageId/categories')
  async createCategory(
    @Param('pageId') pageId: string,
    @Body() dto: CreatePostCategoryRequest,
    @Req() req: any,
  ) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.postService.createCategory(pageId, entId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    await this.postService.deleteCategory(id);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }
}
