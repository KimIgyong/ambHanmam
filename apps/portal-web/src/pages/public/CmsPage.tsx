import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft } from 'lucide-react';
import { cmsApi, type CmsPage as CmsPageData } from '@/lib/cms-api';
import { SectionRenderer } from '@/components/cms/SectionRenderer';
import { PricingPage } from './PricingPage';
import { PageHead } from '@/components/seo/PageHead';

const BUILT_IN_PAGES: Record<string, React.ComponentType> = {
  pricing: PricingPage,
};

export function CmsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const [page, setPage] = useState<CmsPageData | null>(null);
  const [posts, setPosts] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);

    cmsApi
      .getPage(slug)
      .then(async (data) => {
        setPage(data);
        if (data.type === 'BLOG' || data.type === 'BOARD') {
          const postData = await cmsApi.getPosts(slug);
          setPosts(postData?.items || postData || []);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // BUILT_IN 렌더링: CMS 페이지의 renderMode가 BUILT_IN이거나, API 실패 시 폴백
  if (page?.config?.renderMode === 'BUILT_IN' || (error && slug && BUILT_IN_PAGES[slug])) {
    const BuiltIn = slug ? BUILT_IN_PAGES[slug] : null;
    if (BuiltIn) return <BuiltIn />;
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg text-gray-500">Page not found</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    );
  }

  // LANDING / SERVICE_INFO → SectionRenderer
  if (page.type === 'LANDING' || page.type === 'SERVICE_INFO') {
    if (page.sections && page.sections.length > 0) {
      return (
        <>
          <PageHead title={page.title} path={`/page/${slug}`} />
          <SectionRenderer sections={page.sections} />
        </>
      );
    }
    return (
      <div className="py-24 text-center text-gray-400">
        <p>No content yet</p>
      </div>
    );
  }

  // STATIC → HTML content
  if (page.type === 'STATIC') {
    const lang = i18n.language.startsWith('ko') ? 'ko' : 'en';
    const contentItem = page.contents?.find((c) => c.lang === lang) || page.contents?.[0];
    if (contentItem?.content) {
      return (
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <PageHead title={page.title} path={`/page/${slug}`} />
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: contentItem.content }}
          />
        </div>
      );
    }
    return (
      <div className="py-24 text-center text-gray-400">
        <p>No content yet</p>
      </div>
    );
  }

  // BLOG / BOARD → post list
  if ((page.type === 'BLOG' || page.type === 'BOARD') && posts) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{page.title}</h1>
        {posts.length === 0 ? (
          <p className="mt-8 text-center text-gray-400">No posts yet</p>
        ) : (
          <div className="mt-8 space-y-6">
            {posts.map((post: any) => (
              <article
                key={post.id}
                className="rounded-lg border border-gray-200 p-6 transition-colors hover:border-primary-200"
              >
                <h2 className="text-lg font-semibold text-gray-900">{post.title}</h2>
                {post.summary && (
                  <p className="mt-2 text-sm text-gray-600">{post.summary}</p>
                )}
                {post.createdAt && (
                  <p className="mt-3 text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  // SUBSCRIPTION / etc → Coming Soon
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
      <p className="mt-4 text-gray-500">Coming Soon</p>
    </div>
  );
}
