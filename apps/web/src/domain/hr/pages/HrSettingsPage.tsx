import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useEntityStore } from '../store/entity.store';
import InsuranceRatesTab from '../components/settings/InsuranceRatesTab';
import TaxBracketsTab from '../components/settings/TaxBracketsTab';
import RegionalWagesTab from '../components/settings/RegionalWagesTab';
import OtRatesTab from '../components/settings/OtRatesTab';
import HolidayCalendarTab from '../components/settings/HolidayCalendarTab';
import KrInsuranceParamsTab from '../components/settings/KrInsuranceParamsTab';
import KrTaxTableTab from '../components/settings/KrTaxTableTab';

const VN_TABS = [
  { key: 'insurance', labelKey: 'hr:settings.insuranceRates' },
  { key: 'tax', labelKey: 'hr:settings.taxBrackets' },
  { key: 'wages', labelKey: 'hr:settings.regionalWages' },
  { key: 'ot', labelKey: 'hr:settings.otRates' },
  { key: 'holidays', labelKey: 'hr:settings.holidays' },
] as const;

const KR_TABS = [
  { key: 'kr-insurance', labelKey: 'hr:kr.insurance.title' },
  { key: 'kr-tax-table', labelKey: 'hr:kr.taxTable.title' },
  { key: 'holidays', labelKey: 'hr:settings.holidays' },
] as const;

export default function HrSettingsPage() {
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const isKrEntity = currentEntity?.country === 'KR';

  const tabs = isKrEntity ? KR_TABS : VN_TABS;
  const [activeTab, setActiveTab] = useState<string>(tabs[0].key);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <Settings className="h-6 w-6 text-teal-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{t('hr:menu.settings')}</h1>
            <p className="text-sm text-gray-500">{t('hr:settings.subtitle')}</p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </nav>
        </div>

        {/* VN Tab content */}
        {activeTab === 'insurance' && <InsuranceRatesTab isAdmin={isAdmin} />}
        {activeTab === 'tax' && <TaxBracketsTab isAdmin={isAdmin} />}
        {activeTab === 'wages' && <RegionalWagesTab isAdmin={isAdmin} />}
        {activeTab === 'ot' && <OtRatesTab isAdmin={isAdmin} />}
        {activeTab === 'holidays' && <HolidayCalendarTab isAdmin={isAdmin} />}

        {/* KR Tab content */}
        {activeTab === 'kr-insurance' && <KrInsuranceParamsTab isAdmin={isAdmin} />}
        {activeTab === 'kr-tax-table' && <KrTaxTableTab isAdmin={isAdmin} />}
      </div>
    </div>
  );
}
