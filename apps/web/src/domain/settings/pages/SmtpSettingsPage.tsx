import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useSmtpSettings,
  useUpdateSmtpSettings,
  useTestSmtpConnection,
} from '../hooks/useSmtpSettings';

export default function SmtpSettingsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { data: settings, isLoading } = useSmtpSettings();
  const updateMutation = useUpdateSmtpSettings();
  const testMutation = useTestSmtpConnection();

  const [form, setForm] = useState({
    host: '',
    port: 587,
    user: '',
    pass: '',
    from: '',
    secure: false,
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        host: settings.host,
        port: settings.port,
        user: settings.user,
        pass: '',
        from: settings.from,
        secure: settings.secure,
      });
    }
  }, [settings]);

  const getFormData = () => {
    const data: {
      host: string;
      port: number;
      user: string;
      pass?: string;
      from: string;
      secure: boolean;
    } = {
      host: form.host,
      port: form.port,
      user: form.user,
      from: form.from,
      secure: form.secure,
    };
    if (form.pass) {
      data.pass = form.pass;
    }
    return data;
  };

  const handleSave = async () => {
    setStatusMessage(null);
    try {
      await updateMutation.mutateAsync(getFormData());
      setStatusMessage({ type: 'success', text: t('settings:smtp.saveSuccess') });
      setForm((prev) => ({ ...prev, pass: '' }));
    } catch {
      setStatusMessage({ type: 'error', text: t('common:errors.E8001') });
    }
  };

  const handleTest = async () => {
    setStatusMessage(null);
    try {
      await testMutation.mutateAsync(getFormData());
      setStatusMessage({ type: 'success', text: t('settings:smtp.testSuccess') });
    } catch {
      setStatusMessage({ type: 'error', text: t('common:errors.E8002') });
    }
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <Mail className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('settings:smtp.title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('settings:smtp.subtitle')}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('settings:smtp.host')}
              </label>
              <input
                type="text"
                value={form.host}
                onChange={(e) => setForm((prev) => ({ ...prev, host: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('settings:smtp.port')}
              </label>
              <input
                type="number"
                value={form.port}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, port: parseInt(e.target.value) || 0 }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="587"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:smtp.user')}
            </label>
            <input
              type="text"
              value={form.user}
              onChange={(e) => setForm((prev) => ({ ...prev, user: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:smtp.password')}
            </label>
            <input
              type="password"
              value={form.pass}
              onChange={(e) => setForm((prev) => ({ ...prev, pass: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={settings?.maskedPass || '••••••••'}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t('settings:smtp.passwordHint')}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('settings:smtp.from')}
            </label>
            <input
              type="text"
              value={form.from}
              onChange={(e) => setForm((prev) => ({ ...prev, from: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="AMB Management <noreply@example.com>"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.secure}
              onClick={() => setForm((prev) => ({ ...prev, secure: !prev.secure }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                form.secure ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.secure ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {t('settings:smtp.secure')}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={handleTest}
            disabled={testMutation.isPending || !form.host || !form.user || !form.from}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {testMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('settings:smtp.testButton')}
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || !form.host || !form.user || !form.from}
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
