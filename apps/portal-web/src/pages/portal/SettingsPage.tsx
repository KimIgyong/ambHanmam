import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { Save } from 'lucide-react';

export function SettingsPage() {
  const { t } = useTranslation();
  const customer = useAuthStore((s) => s.customer);
  const [saving] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('portal.settings.title')}</h1>

      <div className="max-w-2xl space-y-6">
        {/* Profile section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('portal.settings.profile')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.name')}</label>
              <input type="text" className="input-field" defaultValue={customer?.name} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
              <input type="email" className="input-field bg-gray-50" defaultValue={customer?.email} disabled />
              <p className="mt-1 text-xs text-gray-500">{t('portal.settings.email_readonly')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.company_name')}</label>
              <input type="text" className="input-field" defaultValue={customer?.companyName || ''} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Save className="h-4 w-4" />
              {t('portal.settings.save')}
            </button>
          </div>
        </div>

        {/* Security section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('portal.settings.security')}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('portal.settings.change_password_desc')}</p>
          <button className="btn-outline px-4 py-2 text-sm">
            {t('portal.settings.change_password')}
          </button>
        </div>
      </div>
    </div>
  );
}
