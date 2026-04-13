import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PreviewContent {
  id: string;
  title: string;
  slug: string;
  type: string;
  description: string | null;
  status: string;
  contents: Array<{
    id: string;
    lang: string;
    content: string;
    sectionsJson: unknown;
    updatedAt: string;
  }>;
  sections: Array<{
    id: string;
    type: string;
    sortOrder: number;
    config: Record<string, unknown>;
    contentEn: Record<string, unknown>;
    contentKo: Record<string, unknown>;
    isVisible: boolean;
  }>;
  menu: {
    id: string;
    nameEn: string;
    nameKo: string;
    slug: string;
  } | null;
}

export default function SitePreviewPage() {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation(['site', 'common']);
  const [page, setPage] = useState<PreviewContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid preview token');
      setLoading(false);
      return;
    }

    apiClient
      .get<{ success: boolean; data: PreviewContent }>(`/cms/public/preview/${token}`)
      .then((r) => {
        setPage(r.data.data);
      })
      .catch((err) => {
        const code = err?.response?.data?.error?.code;
        if (code === 'CMS_PREVIEW_TOKEN_EXPIRED') {
          setError(t('site:preview.tokenExpired', '미리보기 링크가 만료되었습니다.'));
        } else {
          setError(t('site:preview.loadError', '미리보기를 불러올 수 없습니다.'));
        }
      })
      .finally(() => setLoading(false));
  }, [token, t]);

  const htmlContent = useMemo(() => {
    if (!page?.contents?.length) return '';
    const lang = i18n.language === 'ko' ? 'ko' : 'en';
    const content = page.contents.find((c) => c.lang === lang) ?? page.contents[0];
    return content?.content ?? '';
  }, [page, i18n.language]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 rounded-lg bg-white p-8 shadow-sm">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-sm text-gray-700">{error || 'Page not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Preview banner */}
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm">
        <Eye className="h-4 w-4" />
        {t('site:preview.banner', '미리보기 모드')}
        <span className="rounded bg-amber-600 px-2 py-0.5 text-xs">
          {page.status}
        </span>
      </div>

      {/* Page content */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">{page.title}</h1>
        {page.description && (
          <p className="mb-8 text-lg text-gray-500">{page.description}</p>
        )}

        {/* Rendered HTML content */}
        {htmlContent && (
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}

        {/* Sections */}
        {page.sections?.length > 0 && (
          <div className="mt-10 space-y-8">
            {page.sections.map((section) => {
              const lang = i18n.language === 'ko' ? 'contentKo' : 'contentEn';
              const sectionContent = section[lang] as Record<string, unknown> | null;
              if (!sectionContent) return null;

              return (
                <div
                  key={section.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-6"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {section.type}
                  </div>
                  {typeof sectionContent === 'object' && sectionContent !== null && (
                    <pre className="overflow-auto text-sm text-gray-700">
                      {JSON.stringify(sectionContent, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
