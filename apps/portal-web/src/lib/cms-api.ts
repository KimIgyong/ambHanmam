import api from './api';

export interface CmsSection {
  id: string;
  type: string;
  sortOrder: number;
  config: Record<string, any>;
  contentEn: Record<string, any>;
  contentKo: Record<string, any> | null;
  isVisible: boolean;
}

export interface CmsPageContent {
  id: string;
  lang: string;
  content: string | null;
  sectionsJson: Record<string, any> | null;
  updatedAt: string;
}

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  config: Record<string, any> | null;
  contents: CmsPageContent[];
  sections: CmsSection[];
}

export interface CmsMenu {
  id: string;
  parentId: string | null;
  nameEn: string;
  nameKo: string | null;
  slug: string;
  icon: string | null;
  type: string;
  externalUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  page: {
    id: string;
    type: string;
    title: string;
    slug: string;
    status: string;
  } | null;
  children: CmsMenu[];
}

export const cmsApi = {
  getMenus: (entityId?: string): Promise<CmsMenu[]> =>
    api
      .get('/cms/public/menus', { params: { entity_id: entityId } })
      .then((r) => r.data.data),

  getPage: (slug: string, entityId?: string): Promise<CmsPage> =>
    api
      .get(`/cms/public/pages/${slug}`, { params: { entity_id: entityId } })
      .then((r) => r.data.data),

  getPosts: (
    slug: string,
    params?: { entityId?: string; page?: number; limit?: number },
  ) =>
    api
      .get(`/cms/public/pages/${slug}/posts`, {
        params: {
          entity_id: params?.entityId,
          page: params?.page,
          limit: params?.limit,
        },
      })
      .then((r) => r.data.data),

  getSiteConfig: (entityId?: string) =>
    api
      .get('/cms/public/site-config', { params: { entity_id: entityId } })
      .then((r) => r.data.data),

  subscribe: (slug: string, email: string, name?: string) =>
    api
      .post(`/cms/public/pages/${slug}/subscribe`, { email, name })
      .then((r) => r.data),
};
