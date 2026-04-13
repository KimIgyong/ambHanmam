import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PG_PROVIDER, PG_ENVIRONMENT } from '@amb/types';
import {
  usePgConfigs,
  useCreatePgConfig,
  useUpdatePgConfig,
  useDeletePgConfig,
  useTestPgConnection,
} from '../hooks/usePaymentGateway';

interface PgForm {
  provider: string;
  merchantId: string;
  encodeKey: string;
  refundKey: string;
  cancelPw: string;
  environment: string;
  callbackUrl: string;
  notiUrl: string;
  windowColor: string;
  currency: string;
  isActive: boolean;
}

const INITIAL_FORM: PgForm = {
  provider: PG_PROVIDER.MEGAPAY,
  merchantId: '',
  encodeKey: '',
  refundKey: '',
  cancelPw: '',
  environment: PG_ENVIRONMENT.SANDBOX,
  callbackUrl: '',
  notiUrl: '',
  windowColor: '#0066CC',
  currency: 'VND',
  isActive: true,
};

export default function PaymentGatewaySettingsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { data: configs, isLoading } = usePgConfigs();
  const createMutation = useCreatePgConfig();
  const updateMutation = useUpdatePgConfig();
  const deleteMutation = useDeletePgConfig();
  const testMutation = useTestPgConnection();

  const [form, setForm] = useState<PgForm>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState({
    encodeKey: false,
    refundKey: false,
    cancelPw: false,
  });
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const activeConfig = configs?.[0];

  useEffect(() => {
    if (activeConfig && !editingId) {
      setForm({
        provider: activeConfig.provider,
        merchantId: activeConfig.merchantId,
        encodeKey: '',
        refundKey: '',
        cancelPw: '',
        environment: activeConfig.environment,
        callbackUrl: activeConfig.callbackUrl || '',
        notiUrl: activeConfig.notiUrl || '',
        windowColor: activeConfig.windowColor || '#0066CC',
        currency: activeConfig.currency || 'VND',
        isActive: activeConfig.isActive,
      });
      setEditingId(activeConfig.pgConfigId);
    }
  }, [activeConfig, editingId]);

  const getFormData = () => {
    const data: Record<string, unknown> = {
      provider: form.provider,
      merchant_id: form.merchantId,
      environment: form.environment,
      callback_url: form.callbackUrl || undefined,
      noti_url: form.notiUrl || undefined,
      window_color: form.windowColor,
      currency: form.currency,
      is_active: form.isActive,
    };
    if (form.encodeKey) data.encode_key = form.encodeKey;
    if (form.refundKey) data.refund_key = form.refundKey;
    if (form.cancelPw) data.cancel_pw = form.cancelPw;
    return data;
  };

  const handleSave = async () => {
    setStatusMessage(null);
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: getFormData() });
      } else {
        const result = await createMutation.mutateAsync({
          provider: form.provider,
          merchant_id: form.merchantId,
          encode_key: form.encodeKey,
          refund_key: form.refundKey,
          cancel_pw: form.cancelPw,
          environment: form.environment,
          callback_url: form.callbackUrl || undefined,
          noti_url: form.notiUrl || undefined,
          window_color: form.windowColor,
          currency: form.currency,
          is_active: form.isActive,
        });
        setEditingId(result.pgConfigId);
      }
      setStatusMessage({
        type: 'success',
        text: t('settings:paymentGateway.saveSuccess'),
      });
      setForm((prev) => ({ ...prev, encodeKey: '', refundKey: '', cancelPw: '' }));
    } catch {
      setStatusMessage({
        type: 'error',
        text: t('settings:paymentGateway.saveError'),
      });
    }
  };

  const handleTest = async () => {
    if (!editingId) return;
    setStatusMessage(null);
    try {
      const result = await testMutation.mutateAsync(editingId);
      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: t('settings:paymentGateway.testSuccess'),
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || t('settings:paymentGateway.testFailed'),
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: t('settings:paymentGateway.testFailed'),
      });
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm(t('settings:paymentGateway.deleteConfirm'))) return;
    setStatusMessage(null);
    try {
      await deleteMutation.mutateAsync(editingId);
      setEditingId(null);
      setForm(INITIAL_FORM);
      setStatusMessage({
        type: 'success',
        text: t('settings:paymentGateway.deleteSuccess'),
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: t('settings:paymentGateway.deleteError'),
      });
    }
  };

  const toggleKeyVisibility = (key: keyof typeof showKeys) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const canSave = form.merchantId && (editingId || (form.encodeKey && form.refundKey && form.cancelPw));

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
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <CreditCard className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {t('settings:paymentGateway.title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('settings:paymentGateway.subtitle')}
            </p>
          </div>
          {editingId && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              {t('common:delete')}
            </button>
          )}
        </div>

        {/* Status Message */}
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

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900">
              {t('settings:paymentGateway.basicSettings')}
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('settings:paymentGateway.provider')}
                </label>
                <select
                  value={form.provider}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, provider: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={PG_PROVIDER.MEGAPAY}>MegaPay (VNPT EPAY)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('settings:paymentGateway.environment')}
                </label>
                <select
                  value={form.environment}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, environment: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={PG_ENVIRONMENT.SANDBOX}>Sandbox</option>
                  <option value={PG_ENVIRONMENT.PRODUCTION}>Production</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('settings:paymentGateway.merchantId')}
              </label>
              <input
                type="text"
                value={form.merchantId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, merchantId: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="EPAY000001"
              />
            </div>
          </div>

          {/* Security Keys */}
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900">
              {t('settings:paymentGateway.securityKeys')}
            </h3>

            {[
              {
                key: 'encodeKey' as const,
                label: t('settings:paymentGateway.encodeKey'),
                last4: activeConfig?.encodeKeyLast4,
              },
              {
                key: 'refundKey' as const,
                label: t('settings:paymentGateway.refundKey'),
                last4: activeConfig?.refundKeyLast4,
              },
              {
                key: 'cancelPw' as const,
                label: t('settings:paymentGateway.cancelPw'),
                last4: activeConfig?.cancelPwLast4,
              },
            ].map(({ key, label, last4 }) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type={showKeys[key] ? 'text' : 'password'}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder={
                      last4
                        ? `••••••••${last4}`
                        : '••••••••'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility(key)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showKeys[key] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {editingId && (
                  <p className="mt-1 text-xs text-gray-400">
                    {t('settings:paymentGateway.keyHint')}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* URLs & Options */}
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900">
              {t('settings:paymentGateway.urlSettings')}
            </h3>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('settings:paymentGateway.callbackUrl')}
              </label>
              <input
                type="url"
                value={form.callbackUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, callbackUrl: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="https://example.com/payment/callback"
              />
              <p className="mt-1 text-xs text-gray-400">
                {t('settings:paymentGateway.callbackUrlHint')}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('settings:paymentGateway.notiUrl')}
              </label>
              <input
                type="url"
                value={form.notiUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notiUrl: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="https://example.com/payment/ipn"
              />
              <p className="mt-1 text-xs text-gray-400">
                {t('settings:paymentGateway.notiUrlHint')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('settings:paymentGateway.windowColor')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.windowColor}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        windowColor: e.target.value,
                      }))
                    }
                    className="h-9 w-9 cursor-pointer rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={form.windowColor}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        windowColor: e.target.value,
                      }))
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="#0066CC"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('settings:paymentGateway.currency')}
                </label>
                <input
                  type="text"
                  value={form.currency}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {t('settings:paymentGateway.currencyHint')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                onClick={() =>
                  setForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  form.isActive ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {t('settings:paymentGateway.isActive')}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {editingId && (
            <button
              onClick={handleTest}
              disabled={testMutation.isPending}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {testMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t('settings:paymentGateway.testButton')}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !canSave}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common:save')}
          </button>
        </div>
      </div>
    </div>
  );
}
