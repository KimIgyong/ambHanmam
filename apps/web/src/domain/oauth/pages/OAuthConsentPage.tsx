import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, AlertTriangle, Loader2, CheckSquare, Square } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/domain/auth/store/auth.store';

interface AuthorizeInfo {
  app: {
    name: string;
    description?: string;
    iconUrl?: string;
    partnerName?: string;
  };
  requestedScopes: string[];
  grantableScopes: string[];
  redirectUri: string;
  entityName: string;
}

export default function OAuthConsentPage() {
  const { t } = useTranslation('oauth');
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [info, setInfo] = useState<AuthorizeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const clientId = searchParams.get('client_id') || '';
  const redirectUri = searchParams.get('redirect_uri') || '';
  const responseType = searchParams.get('response_type') || '';
  const scope = searchParams.get('scope') || '';
  const state = searchParams.get('state') || '';
  const codeChallenge = searchParams.get('code_challenge') || '';
  const codeChallengeMethod = searchParams.get('code_challenge_method') || '';

  useEffect(() => {
    const fetchAuthorizeInfo = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/oauth/authorize', {
          params: {
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: responseType,
            scope,
            state,
            code_challenge: codeChallenge || undefined,
            code_challenge_method: codeChallengeMethod || undefined,
          },
        });
        const data = res.data?.data || res.data;
        setInfo(data);
        setSelectedScopes(data.grantableScopes || data.requestedScopes || []);
      } catch (err: any) {
        const msg = err.response?.data?.error?.message || err.message;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (clientId && redirectUri && responseType) {
      fetchAuthorizeInfo();
    } else {
      setError(t('consent.errorInvalidClient'));
      setLoading(false);
    }
  }, [clientId, redirectUri, responseType, scope, state, codeChallenge, codeChallengeMethod, t]);

  const toggleScope = (s: string) => {
    setSelectedScopes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const handleApprove = async () => {
    if (!info || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post('/oauth/authorize/consent', {
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: selectedScopes.join(' '),
        state: state || undefined,
        code_challenge: codeChallenge || undefined,
        code_challenge_method: codeChallengeMethod || undefined,
      });
      const data = res.data?.data || res.data;
      // Redirect to partner app with authorization code
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        const url = new URL(redirectUri);
        if (data.code) url.searchParams.set('code', data.code);
        if (state) url.searchParams.set('state', state);
        window.location.href = url.toString();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message;
      setError(msg);
      setSubmitting(false);
    }
  };

  const handleDeny = () => {
    const url = new URL(redirectUri);
    url.searchParams.set('error', 'access_denied');
    url.searchParams.set('error_description', 'User denied the request');
    if (state) url.searchParams.set('state', state);
    window.location.href = url.toString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-3 text-sm text-gray-500">{t('consent.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">{t('consent.error')}</h2>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const requestedScopes = info.requestedScopes || [];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
              {info.app.iconUrl ? (
                <img src={info.app.iconUrl} alt="" className="h-8 w-8 rounded" />
              ) : (
                <Shield className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{info.app.name}</h1>
              {info.app.partnerName && (
                <p className="text-sm text-gray-500">
                  {t('consent.byPartner', { partnerName: info.app.partnerName })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700">{t('consent.scopeRequest')}</p>

          {/* Scope list */}
          <div className="mt-4 space-y-2">
            {requestedScopes.map((s) => {
              const isSelected = selectedScopes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleScope(s)}
                  className="flex w-full items-center gap-3 rounded-md border border-gray-200 px-3 py-2.5 text-left transition hover:bg-gray-50"
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 flex-shrink-0 text-gray-300" />
                  )}
                  <span className="text-sm text-gray-700">
                    {t(`scopes.${s}` as any, { defaultValue: s })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Entity warning */}
          <div className="mt-4 flex items-start gap-2 rounded-md bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700">
              {t('consent.entityWarning', { entityName: info.entityName })}
            </p>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={handleDeny}
            disabled={submitting}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {t('consent.denyButton')}
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={submitting || selectedScopes.length === 0}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('consent.approving')}
              </span>
            ) : (
              t('consent.approveButton')
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-3 text-center">
          <p className="text-xs text-gray-400">
            {info.entityName} · {user?.name || user?.email || ''}
          </p>
        </div>
      </div>
    </div>
  );
}
