import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Store } from 'lucide-react';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { buildStoreUrl } from '@/domain/entity-settings/util/build-store-url';

const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || 'https://apps.amoeba.site';

interface AppStorePageProps {
  storeUrl?: string;
  label?: string;
}

export default function AppStorePage({ storeUrl, label }: AppStorePageProps) {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const user = useAuthStore((s) => s.user);

  const baseUrl = storeUrl || APP_STORE_URL;
  const displayLabel = label || t('common:sidebar.appStore', { defaultValue: 'App Store' });

  const iframeSrc = useMemo(
    () => buildStoreUrl(baseUrl, currentEntity, user),
    [baseUrl, currentEntity, user],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gray-50">
      {/* 헤더 */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:px-6">
        <button
          onClick={() => navigate(-1)}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title={t('common:actions.back', { defaultValue: 'Back' })}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600">
            <Store className="h-3.5 w-3.5" />
            {displayLabel}
          </span>
        </div>
      </div>

      {/* iframe 영역 */}
      <div className="flex-1">
        <iframe
          src={iframeSrc}
          className="h-full w-full border-0"
          title="App Store"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}
