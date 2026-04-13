import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { usePartnerDetail, useCreatePartner, useUpdatePartner } from '../hooks/usePartner';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import PartnerBasicInfoTab from '../components/partner/PartnerBasicInfoTab';
import PartnerContractsTab from '../components/partner/PartnerContractsTab';
import PartnerInvoicesTab from '../components/partner/PartnerInvoicesTab';
import PartnerSowTab from '../components/partner/PartnerSowTab';
import TranslationPanel from '@/domain/translations/components/TranslationPanel';

type TabKey = 'basic' | 'contracts' | 'invoices' | 'sow';

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['billing', 'common']);
  const isNew = !id || id === 'new';
  const currentEntity = useEntityStore((s) => s.currentEntity);

  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  const { data: partner, isLoading } = usePartnerDetail(isNew ? '' : id);
  const createMutation = useCreatePartner();
  const updateMutation = useUpdatePartner();

  const handleSave = async (payload: Record<string, unknown>) => {
    if (isNew) {
      await createMutation.mutateAsync(payload);
    } else {
      await updateMutation.mutateAsync({ id: id!, data: payload });
    }
    navigate('/billing/partners');
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const tabs: { key: TabKey; label: string; disabled?: boolean }[] = [
    { key: 'basic', label: t('billing:partner.tab.basic') },
    { key: 'contracts', label: t('billing:partner.tab.contracts'), disabled: isNew },
    { key: 'invoices', label: t('billing:partner.tab.invoices'), disabled: isNew },
    { key: 'sow', label: t('billing:partner.tab.sow'), disabled: isNew },
  ];

  if (!isNew && isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/billing/partners')}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {isNew
              ? t('billing:partner.createTitle')
              : `${partner?.code} ${partner?.companyName}`}
          </h1>
        </div>

        {/* Tabs */}
        <div className="mt-3 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-orange-600 text-orange-700'
                  : tab.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-white px-6 py-4">
        {activeTab === 'basic' && (
          <PartnerBasicInfoTab
            partner={isNew ? null : partner}
            onSave={handleSave}
            isSaving={isSaving}
            isNew={isNew}
            currentEntity={currentEntity ? { country: currentEntity.country, currency: currentEntity.currency } : null}
          />
        )}
        {activeTab === 'contracts' && id && !isNew && (
          <PartnerContractsTab partnerId={id} />
        )}
        {activeTab === 'invoices' && id && !isNew && (
          <PartnerInvoicesTab partnerId={id} />
        )}
        {activeTab === 'sow' && id && !isNew && (
          <PartnerSowTab partnerId={id} />
        )}

        {/* Translation Panel */}
        {!isNew && partner && (
          <div className="mt-6 border-t pt-4">
            <TranslationPanel
              sourceType="PARTNER"
              sourceId={partner.partnerId}
              sourceFields={['title', 'content']}
              originalLang={partner.originalLang || 'ko'}
              originalContent={{ title: partner.companyName || '', content: partner.note || '' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
