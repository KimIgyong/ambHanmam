import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, ExternalLink, AppWindow } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useMyCustomApps, useAppToken } from '@/domain/entity-settings/hooks/useEntitySettings';
import i18n from '@/i18n';

type AppPhase = 'loading' | 'landing' | 'iframe' | 'blocked';

export default function CustomAppHostPage() {
  const { appCode } = useParams<{ appCode: string }>();
  const { t } = useTranslation(['entitySettings']);
  const { data: apps, isLoading: appsLoading } = useMyCustomApps();
  const appTokenMutation = useAppToken();
  const [phase, setPhase] = useState<AppPhase>('loading');
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeLoadedRef = useRef(false);
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const app = useMemo(() => {
    if (!apps || !appCode) return null;
    return apps.find((a) => a.code === appCode) || null;
  }, [apps, appCode]);

  useEffect(() => {
    if (!app) return;

    const loadApp = async () => {
      try {
        let src: string;
        const separator = app.url.includes('?') ? '&' : '?';

        if (app.authMode === 'jwt') {
          const result = await appTokenMutation.mutateAsync(app.id);
          src = `${app.url}${separator}ama_token=${result.token}&locale=${i18n.language}`;
        } else if (app.authMode === 'api_key') {
          const result = await appTokenMutation.mutateAsync(app.id);
          src = `${app.url}${separator}api_key=${result.apiKey}&locale=${i18n.language}`;
        } else {
          src = `${app.url}${separator}locale=${i18n.language}`;
        }

        setIframeSrc(src);

        // open_mode에 따라 초기 단계 결정
        if (app.openMode === 'new_tab') {
          setPhase('blocked');
        } else {
          setPhase('landing');
        }
      } catch {
        setError(t('entitySettings:customApps.connectionFailed'));
      }
    };

    loadApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.id]);

  // landing 단계에서만 iframe 차단 감지 타이머 가동
  useEffect(() => {
    if (phase !== 'landing' || !iframeSrc) return;
    iframeLoadedRef.current = false;
    iframeTimeoutRef.current = setTimeout(() => {
      if (!iframeLoadedRef.current) {
        setPhase('blocked');
      }
    }, 3000);
    return () => {
      if (iframeTimeoutRef.current) clearTimeout(iframeTimeoutRef.current);
    };
  }, [phase, iframeSrc]);

  const handleIframeLoad = useCallback(() => {
    iframeLoadedRef.current = true;
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
      iframeTimeoutRef.current = null;
    }
    setPhase('iframe');
  }, []);

  const handleOpenExternal = useCallback(() => {
    if (iframeSrc) window.open(iframeSrc, '_blank');
  }, [iframeSrc]);

  // 앱 아이콘 동적 렌더링
  const IconComponent = useMemo(() => {
    if (!app?.icon) return AppWindow;
    return (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[app.icon] ?? AppWindow;
  }, [app?.icon]);

  if (appsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!appsLoading && !app) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
        <AlertCircle className="h-12 w-12" />
        <p className="text-sm">{t('entitySettings:customApps.appNotFound')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-red-400">
        <AlertCircle className="h-12 w-12" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // 로딩 중 (앱 정보/토큰 취득 전)
  if (phase === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // iframe 전체화면 표시
  if (phase === 'iframe') {
    return (
      <div className="flex h-full w-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
          <span className="text-sm font-medium text-gray-700">{app?.name || 'App'}</span>
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm border border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('entitySettings:customApps.openInNewTab')}
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <iframe
            src={iframeSrc!}
            title={app?.name || 'Custom App'}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </div>
    );
  }

  // landing (iframe 감지 중) 또는 blocked (새탭 안내)
  return (
    <div className="flex h-full items-center justify-center bg-gray-50 p-6">
      {/* 백그라운드 iframe 감지 (landing 단계에서만) */}
      {phase === 'landing' && iframeSrc && (
        <iframe
          src={iframeSrc}
          className="hidden"
          title="background-check"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          onLoad={handleIframeLoad}
        />
      )}
      <div className="max-w-sm w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <IconComponent className="h-8 w-8 text-indigo-500" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-gray-800">
          {app?.name || 'App'}
        </h3>
        <p className="mb-1 text-xs text-gray-400">
          {new URL(app?.url || 'https://example.com').hostname}
        </p>
        {app?.description && (
          <p className="mb-4 mt-2 text-sm text-gray-500">{app.description}</p>
        )}

        {phase === 'blocked' && app?.openMode !== 'new_tab' && (
          <p className="mb-4 text-sm text-gray-400">
            {t('entitySettings:customApps.iframeBlocked')}
          </p>
        )}

        <button
          onClick={handleOpenExternal}
          disabled={phase === 'landing'}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {phase === 'landing' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('entitySettings:customApps.checking')}
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              {t('entitySettings:customApps.openInNewTab')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
