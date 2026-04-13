import { useTranslation } from 'react-i18next';
import { UnitCode } from '@amb/types';
import { UNITS } from '@/global/constant/unit.constant';
import { useAssistantModalStore } from '../store/assistant-modal.store';

export default function WelcomeSection() {
  const { t } = useTranslation(['assistant', 'units']);
  const selectUnit = useAssistantModalStore((s) => s.selectUnit);
  const accessibleUnits = UNITS.filter((u) => u.code === 'IT');

  const handleSelectUnit = (unitCode: UnitCode) => {
    selectUnit(unitCode);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
      {/* Welcome message */}
      <p className="mb-4 text-center text-sm text-gray-500">
        {t('assistant:welcome')}
      </p>

      <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3">
        <p className="text-center text-sm font-semibold text-indigo-700">
          {t('assistant:userGuideHighlight')}
        </p>
        <p className="mt-1 text-center text-sm text-indigo-900">
          {t('assistant:userGuidePrompt')}
        </p>
      </div>

      {/* Agent Selection Grid */}
      {accessibleUnits.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            {t('assistant:selectAgent')}
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {accessibleUnits.map((unit) => {
              const Icon = unit.icon;
              return (
                <button
                  key={unit.code}
                  onClick={() => handleSelectUnit(unit.code as UnitCode)}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 text-left transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-sm"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${unit.bgColor}`}>
                    <Icon className={`h-5 w-5 ${unit.color}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-700">{t(`units:${unit.nameKey}`)}</span>
                    <span className="text-xs text-gray-500">{t('assistant:itOnlyDescription')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
