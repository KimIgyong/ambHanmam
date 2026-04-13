import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { partnerPortalApiService, type PartnerApp } from '../service/partner-portal.service';

const CATEGORIES = ['PRODUCTIVITY', 'COMMUNICATION', 'ANALYTICS', 'INTEGRATION', 'UTILITY', 'OTHER'] as const;
const AUTH_MODES = ['NONE', 'SSO_JWT', 'API_KEY', 'OAUTH2'] as const;
const OPEN_MODES = ['IFRAME', 'NEW_TAB', 'POPUP'] as const;

interface Props {
  app: PartnerApp | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PartnerAppFormModal({ app, onClose, onSaved }: Props) {
  const { t } = useTranslation('partnerPortal');
  const isEdit = !!app;

  const [form, setForm] = useState({
    code: app?.papCode || '',
    name: app?.papName || '',
    description: app?.papDescription || '',
    icon: app?.papIcon || '',
    url: app?.papUrl || '',
    auth_mode: app?.papAuthMode || 'NONE',
    open_mode: app?.papOpenMode || 'IFRAME',
    category: app?.papCategory || 'OTHER',
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => partnerPortalApiService.createApp(data),
    onSuccess: () => {
      toast.success(t('app.saved'));
      onSaved();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Omit<typeof form, 'code'>) =>
      partnerPortalApiService.updateApp(app!.papId, data),
    onSuccess: () => {
      toast.success(t('app.saved'));
      onSaved();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      const { code: _, ...rest } = form;
      updateMutation.mutate(rest);
    } else {
      createMutation.mutate(form);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? t('app.edit') : t('app.create')}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* Code (read-only on edit) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('app.code')} *</label>
            <input
              type="text"
              required
              disabled={isEdit}
              maxLength={50}
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="my-app-code"
            />
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('app.name')} *</label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('app.url')} *</label>
            <input
              type="url"
              required
              value={form.url}
              onChange={(e) => handleChange('url', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="https://example.com/app"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('app.description')}</label>
            <textarea
              rows={3}
              maxLength={500}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('app.icon')}</label>
            <input
              type="text"
              maxLength={10}
              value={form.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="🚀"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('app.category')}</label>
            <select
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`app.categories.${c}`)}</option>
              ))}
            </select>
          </div>

          {/* Auth Mode */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('app.authMode')}</label>
            <select
              value={form.auth_mode}
              onChange={(e) => handleChange('auth_mode', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {AUTH_MODES.map((m) => (
                <option key={m} value={m}>{t(`app.authModes.${m}`)}</option>
              ))}
            </select>
          </div>

          {/* Open Mode */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">{t('app.openMode')}</label>
            <select
              value={form.open_mode}
              onChange={(e) => handleChange('open_mode', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {OPEN_MODES.map((m) => (
                <option key={m} value={m}>{t(`app.openModes.${m}`)}</option>
              ))}
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !form.code || !form.name || !form.url}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? '...' : t('app.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
