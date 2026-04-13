import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Loader2, CheckCircle, XCircle, ArrowLeft, Plus, X, Eye, FileCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useSiteSettings,
  useUpdateSiteSettings,
} from '../hooks/useSiteSettings';

export default function SiteSettingsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { data: settings, isLoading } = useSiteSettings();
  const updateMutation = useUpdateSiteSettings();

  const [form, setForm] = useState({
    portal_url: '',
    portal_domain: '',
    allowed_ips: [] as string[],
    allowed_domains: [] as string[],
    is_public: false,
    logo_url: '',
    favicon_url: '',
    index_enabled: false,
    index_html: '',
  });

  const [newIp, setNewIp] = useState('');
  const [newDomain, setNewDomain] = useState('');

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        portal_url: settings.portalUrl || '',
        portal_domain: settings.portalDomain || '',
        allowed_ips: settings.allowedIps || [],
        allowed_domains: settings.allowedDomains || [],
        is_public: settings.isPublic,
        logo_url: settings.logoUrl || '',
        favicon_url: settings.faviconUrl || '',
        index_enabled: settings.indexEnabled ?? false,
        index_html: settings.indexHtml || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setStatusMessage(null);
    try {
      await updateMutation.mutateAsync(form);
      setStatusMessage({ type: 'success', text: t('settings:site.saveSuccess') });
    } catch (error: any) {
      const msg = error?.response?.data?.message || t('settings:site.saveFailed');
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const addIp = () => {
    const trimmed = newIp.trim();
    if (trimmed && !form.allowed_ips.includes(trimmed)) {
      setForm((prev) => ({ ...prev, allowed_ips: [...prev.allowed_ips, trimmed] }));
      setNewIp('');
    }
  };

  const removeIp = (ip: string) => {
    setForm((prev) => ({ ...prev, allowed_ips: prev.allowed_ips.filter((i) => i !== ip) }));
  };

  const addDomain = () => {
    const trimmed = newDomain.trim();
    if (trimmed && !form.allowed_domains.includes(trimmed)) {
      setForm((prev) => ({ ...prev, allowed_domains: [...prev.allowed_domains, trimmed] }));
      setNewDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    setForm((prev) => ({ ...prev, allowed_domains: prev.allowed_domains.filter((d) => d !== domain) }));
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
            <Globe className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('settings:site.title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('settings:site.subtitle')}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-lg p-3 text-sm ${
              statusMessage.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {statusMessage.text}
          </div>
        )}

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          {/* Portal URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:site.portalUrl')}
            </label>
            <input
              type="text"
              value={form.portal_url}
              onChange={(e) => setForm((prev) => ({ ...prev, portal_url: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="https://portal.example.com"
            />
          </div>

          {/* Portal Domain */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:site.portalDomain')}
            </label>
            <input
              type="text"
              value={form.portal_domain}
              onChange={(e) => setForm((prev) => ({ ...prev, portal_domain: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="portal.example.com"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:site.logoUrl')}
            </label>
            <input
              type="text"
              value={form.logo_url}
              onChange={(e) => setForm((prev) => ({ ...prev, logo_url: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="https://cdn.example.com/logo.png"
            />
          </div>

          {/* Favicon URL */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:site.faviconUrl')}
            </label>
            <input
              type="text"
              value={form.favicon_url}
              onChange={(e) => setForm((prev) => ({ ...prev, favicon_url: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="https://cdn.example.com/favicon.ico"
            />
          </div>

          {/* Public Access Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.is_public}
              onClick={() => setForm((prev) => ({ ...prev, is_public: !prev.is_public }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                form.is_public ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.is_public ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {t('settings:site.isPublic')}
            </span>
          </div>

          {/* Allowed IPs */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:site.allowedIps')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIp())}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="192.168.1.0/24"
              />
              <button
                onClick={addIp}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {form.allowed_ips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.allowed_ips.map((ip) => (
                  <span
                    key={ip}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {ip}
                    <button onClick={() => removeIp(ip)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Allowed Domains */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:site.allowedDomains')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="example.com"
              />
              <button
                onClick={addDomain}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {form.allowed_domains.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.allowed_domains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {domain}
                    <button onClick={() => removeDomain(domain)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Index Page Section ── */}
        <div className="mt-6 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {t('settings:site.indexPage')}
              </h2>
              <p className="text-xs text-gray-500">
                {t('settings:site.indexPageDesc')}
              </p>
            </div>
          </div>

          {/* Index Enable Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.index_enabled}
              onClick={() => setForm((prev) => ({ ...prev, index_enabled: !prev.index_enabled }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                form.index_enabled ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.index_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t('settings:site.indexEnabled')}
              </span>
              <p className="text-xs text-gray-400">
                {t('settings:site.indexEnabledDesc')}
              </p>
            </div>
          </div>

          {/* HTML Editor */}
          {form.index_enabled && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {t('settings:site.indexHtml')}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        index_html: DEFAULT_INDEX_TEMPLATE,
                      }));
                    }}
                    className="flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    {t('settings:site.insertTemplate')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open('', '_blank');
                      if (win) {
                        win.document.write(form.index_html);
                        win.document.close();
                      }
                    }}
                    className="flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t('settings:site.preview')}
                  </button>
                </div>
              </div>
              <textarea
                value={form.index_html}
                onChange={(e) => setForm((prev) => ({ ...prev, index_html: e.target.value }))}
                className="h-96 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-sm leading-relaxed focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder={t('settings:site.indexHtmlPlaceholder')}
                spellCheck={false}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common:save')}
          </button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_INDEX_TEMPLATE = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AMA - Amoeba Management Assistant</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 700; }
    p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 2rem; }
    .btn {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #fff;
      color: #667eea;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
  </style>
</head>
<body>
  <div class="container">
    <h1>AMA</h1>
    <p>Amoeba Management Assistant</p>
    <a href="/user/login" class="btn">로그인</a>
  </div>
</body>
</html>`;
