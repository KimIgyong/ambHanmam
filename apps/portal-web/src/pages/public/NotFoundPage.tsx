import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';
import { PageHead } from '@/components/seo/PageHead';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <PageHead title={t('common:not_found_title')} noindex />

      <p className="text-8xl font-extrabold text-primary-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">
        {t('common:not_found_title')}
      </h1>
      <p className="mt-2 text-gray-500">
        {t('common:not_found_desc')}
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
      >
        <Home size={16} />
        {t('common:not_found_home')}
      </Link>
    </div>
  );
}
