import { apiClient } from '@/lib/api-client';
import {
  CmsMenuResponse,
  CmsPageResponse,
  CmsPageListResponse,
  CmsPageContentResponse,
  CmsVersionResponse,
  CmsSectionResponse,
  CmsPostResponse,
  CmsPostListResponse,
  CmsPostCategoryResponse,
  CmsSubscriberResponse,
} from '@amb/types';

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    size: number;
  };
  timestamp: string;
}

// ── Menu ──
class CmsMenuApiService {
  private readonly basePath = '/cms/menus';

  getMenuTree = () =>
    apiClient.get<ListResponse<CmsMenuResponse>>(this.basePath).then((r) => r.data.data);

  createMenu = (data: {
    name_en: string;
    name_ko?: string;
    slug: string;
    icon?: string;
    parent_id?: string | null;
    menu_type?: string;
    external_url?: string;
    page_type?: string;
    page_config?: Record<string, unknown>;
  }) =>
    apiClient.post<SingleResponse<CmsMenuResponse>>(this.basePath, data).then((r) => r.data.data);

  updateMenu = (id: string, data: {
    name_en?: string;
    name_ko?: string;
    icon?: string;
    is_visible?: boolean;
    menu_type?: string;
    external_url?: string;
  }) =>
    apiClient.put<SingleResponse<CmsMenuResponse>>(`${this.basePath}/${id}`, data).then((r) => r.data.data);

  reorderMenus = (items: { id: string; sort_order: number; parent_id?: string | null }[]) =>
    apiClient.patch(`${this.basePath}/reorder`, { items });

  deleteMenu = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);
}

// ── Page ──
class CmsPageApiService {
  private readonly basePath = '/cms/pages';

  getPages = (params?: { status?: string; type?: string; search?: string }) =>
    apiClient.get<ListResponse<CmsPageListResponse>>(this.basePath, { params }).then((r) => r.data.data);

  getPageById = (id: string) =>
    apiClient.get<SingleResponse<CmsPageResponse>>(`${this.basePath}/${id}`).then((r) => r.data.data);

  updatePage = (id: string, data: {
    title?: string;
    description?: string;
    og_image?: string;
    seo_keywords?: string[];
    config?: Record<string, unknown>;
  }) =>
    apiClient.put<SingleResponse<CmsPageResponse>>(`${this.basePath}/${id}`, data).then((r) => r.data.data);

  saveContent = (pageId: string, data: { content: string; lang?: string }) => {
    const lang = data.lang || 'en';
    const { lang: _, ...body } = data;
    return apiClient.put<SingleResponse<CmsPageContentResponse>>(`${this.basePath}/${pageId}/content/${lang}`, body).then((r) => r.data.data);
  };

  publishPage = (pageId: string, note?: string) =>
    apiClient.post<SingleResponse<CmsPageResponse>>(`${this.basePath}/${pageId}/publish`, { note }).then((r) => r.data.data);

  unpublishPage = (pageId: string) =>
    apiClient.post<SingleResponse<CmsPageResponse>>(`${this.basePath}/${pageId}/unpublish`).then((r) => r.data.data);

  getVersions = (pageId: string) =>
    apiClient.get<ListResponse<CmsVersionResponse>>(`${this.basePath}/${pageId}/versions`).then((r) => r.data.data);

  rollback = (pageId: string, versionId: string) =>
    apiClient.post<SingleResponse<CmsPageResponse>>(`${this.basePath}/${pageId}/versions/${versionId}/rollback`).then((r) => r.data.data);

  getPreview = (pageId: string) =>
    apiClient.post<SingleResponse<{ token: string; url: string }>>(`${this.basePath}/${pageId}/preview`).then((r) => r.data.data);
}

// ── Section ──
class CmsSectionApiService {
  getSections = (pageId: string) =>
    apiClient.get<ListResponse<CmsSectionResponse>>(`/cms/pages/${pageId}/sections`).then((r) => r.data.data);

  createSection = (pageId: string, data: {
    type: string;
    config?: Record<string, unknown>;
    content_en?: Record<string, unknown>;
    content_ko?: Record<string, unknown>;
    is_visible?: boolean;
  }) =>
    apiClient.post<SingleResponse<CmsSectionResponse>>(`/cms/pages/${pageId}/sections`, data).then((r) => r.data.data);

  updateSection = (sectionId: string, data: {
    config?: Record<string, unknown>;
    content_en?: Record<string, unknown>;
    content_ko?: Record<string, unknown>;
    is_visible?: boolean;
  }) =>
    apiClient.put<SingleResponse<CmsSectionResponse>>(`/cms/sections/${sectionId}`, data).then((r) => r.data.data);

  reorderSections = (pageId: string, items: { id: string; sort_order: number }[]) =>
    apiClient.patch(`/cms/pages/${pageId}/sections/reorder`, { items });

  deleteSection = (sectionId: string) =>
    apiClient.delete(`/cms/sections/${sectionId}`);
}

// ── Post ──
class CmsPostApiService {
  getPosts = (pageId: string, params?: {
    category_id?: string;
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }) =>
    apiClient.get<PaginatedResponse<CmsPostListResponse>>(`/cms/pages/${pageId}/posts`, { params }).then((r) => r.data.data);

  getPostById = (postId: string) =>
    apiClient.get<SingleResponse<CmsPostResponse>>(`/cms/posts/${postId}`).then((r) => r.data.data);

  createPost = (pageId: string, data: {
    title: string;
    content: string;
    category_id?: string;
    is_pinned?: boolean;
    featured_image?: string;
    tags?: string[];
    status?: string;
  }) =>
    apiClient.post<SingleResponse<CmsPostResponse>>(`/cms/pages/${pageId}/posts`, data).then((r) => r.data.data);

  updatePost = (postId: string, data: {
    title?: string;
    content?: string;
    category_id?: string;
    is_pinned?: boolean;
    featured_image?: string;
    tags?: string[];
    status?: string;
  }) =>
    apiClient.put<SingleResponse<CmsPostResponse>>(`/cms/posts/${postId}`, data).then((r) => r.data.data);

  deletePost = (postId: string) =>
    apiClient.delete(`/cms/posts/${postId}`);

  getCategories = (pageId: string) =>
    apiClient.get<ListResponse<CmsPostCategoryResponse>>(`/cms/pages/${pageId}/categories`).then((r) => r.data.data);

  createCategory = (pageId: string, name: string) =>
    apiClient.post<SingleResponse<CmsPostCategoryResponse>>(`/cms/pages/${pageId}/categories`, { name }).then((r) => r.data.data);

  deleteCategory = (categoryId: string) =>
    apiClient.delete(`/cms/categories/${categoryId}`);
}

// ── Subscriber ──
class CmsSubscriberApiService {
  getSubscribers = (pageId: string, params?: { search?: string; page?: number; size?: number }) =>
    apiClient.get<PaginatedResponse<CmsSubscriberResponse>>(`/cms/pages/${pageId}/subscribers`, { params }).then((r) => r.data.data);

  exportCsv = (pageId: string) =>
    apiClient.get(`/cms/pages/${pageId}/subscribers/export`, { responseType: 'blob' }).then((r) => r.data);
}

// ── Stats ──
export interface EntityCmsStats {
  entityId: string;
  entityCode: string;
  entityName: string;
  menuCount: number;
  pageCount: number;
  postCount: number;
  subscriberCount: number;
}

class CmsStatsApiService {
  getEntityStats = () =>
    apiClient
      .get<{ success: boolean; data: EntityCmsStats[] }>('/cms/stats/entities')
      .then((r) => r.data.data);
}

export const cmsMenuService = new CmsMenuApiService();
export const cmsPageService = new CmsPageApiService();
export const cmsSectionService = new CmsSectionApiService();
export const cmsPostService = new CmsPostApiService();
export const cmsSubscriberService = new CmsSubscriberApiService();
export const cmsStatsService = new CmsStatsApiService();
