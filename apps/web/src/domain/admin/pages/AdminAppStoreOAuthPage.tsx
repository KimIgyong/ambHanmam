import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Key, Copy, Check, RefreshCw, Globe, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface OAuthClient {
  id: string;
  code: string;
  name: string;
  clientId: string | null;
  redirectUris: string[];
  scopes: string[];
  status: string;
  authMode: string;
}

interface ReissueResult {
  clientId: string;
  clientSecret: string;
}

export default function AdminAppStoreOAuthPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [reissueResult, setReissueResult] = useState<Record<string, ReissueResult>>({});

  const { data: clients, isLoading } = useQuery({
    queryKey: ['admin', 'app-store-oauth'],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: OAuthClient[] }>('/admin/partner-apps/oauth-clients');
      return res.data.data;
    },
  });

  const reissueMutation = useMutation({
    mutationFn: async (appId: string) => {
      const res = await apiClient.post<{ success: boolean; data: { clientCredentials: ReissueResult } }>(
        `/admin/partner-apps/${appId}/reissue-credentials`,
      );
      return { appId, credentials: res.data.data.clientCredentials };
    },
    onSuccess: ({ appId, credentials }) => {
      setReissueResult((prev) => ({ ...prev, [appId]: credentials }));
      queryClient.invalidateQueries({ queryKey: ['admin', 'app-store-oauth'] });
    },
  });

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="ml-2 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
    >
      {copiedField === field ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <Store className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('admin:dashboard.cards.appStoreOAuth.title', { defaultValue: 'App Store OAuth' })}
            </h1>
            <p className="text-sm text-gray-500">
              {t('admin:dashboard.cards.appStoreOAuth.desc', { defaultValue: 'OAuth client management for App Store' })}
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">OAuth 2.0 Authorization Code Flow</p>
            <p className="mt-1 text-blue-600">
              App Store는 AMA의 OAuth 클라이언트로 등록되어, 사용자가 AMA 계정으로 로그인하여 앱스토어를 이용할 수 있습니다.
              client_secret은 최초 발급 시에만 표시되므로 반드시 안전하게 보관하세요.
            </p>
          </div>
        </div>

        {/* Client Cards */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-400">Loading...</div>
        ) : !clients || clients.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-gray-400">
            등록된 OAuth 클라이언트가 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            {clients.map((client) => {
              const creds = reissueResult[client.id];
              return (
                <div key={client.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50">
                        <Globe className="h-4.5 w-4.5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                        <p className="text-xs text-gray-500">Code: {client.code}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      client.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' :
                      client.status === 'APPROVED' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {client.status}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-4 px-6 py-4">
                    {/* Client ID */}
                    <div>
                      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <Key className="h-3 w-3" /> Client ID
                      </label>
                      <div className="flex items-center rounded-md bg-gray-50 px-3 py-2">
                        <code className="flex-1 text-sm text-gray-800">{client.clientId || '—'}</code>
                        {client.clientId && <CopyButton text={client.clientId} field={`${client.id}-id`} />}
                      </div>
                    </div>

                    {/* Client Secret (only if just reissued) */}
                    {creds && (
                      <div>
                        <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-red-500">
                          <Key className="h-3 w-3" /> Client Secret (지금만 표시됨!)
                        </label>
                        <div className="flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-2">
                          <code className="flex-1 break-all text-sm text-red-800">{creds.clientSecret}</code>
                          <CopyButton text={creds.clientSecret} field={`${client.id}-secret`} />
                        </div>
                      </div>
                    )}

                    {/* Redirect URIs */}
                    <div>
                      <label className="mb-1 text-xs font-medium text-gray-500">Redirect URIs</label>
                      <div className="space-y-1">
                        {client.redirectUris?.map((uri, i) => (
                          <div key={i} className="flex items-center rounded-md bg-gray-50 px-3 py-1.5">
                            <code className="text-sm text-gray-700">{uri}</code>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Scopes */}
                    <div>
                      <label className="mb-1 text-xs font-medium text-gray-500">Scopes</label>
                      <div className="flex flex-wrap gap-1.5">
                        {client.scopes?.map((scope) => (
                          <span key={scope} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-end border-t border-gray-100 px-6 py-3">
                    <button
                      onClick={() => {
                        if (confirm('client_secret을 재발급하시겠습니까? 기존 시크릿은 무효화됩니다.')) {
                          reissueMutation.mutate(client.id);
                        }
                      }}
                      disabled={reissueMutation.isPending}
                      className="flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${reissueMutation.isPending ? 'animate-spin' : ''}`} />
                      Reissue Credentials
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
