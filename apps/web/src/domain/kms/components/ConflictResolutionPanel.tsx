import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check } from 'lucide-react';
import { ConflictReportResponse } from '../service/doc-builder.service';

interface ConflictResolutionPanelProps {
  conflicts: ConflictReportResponse;
  onResolved: (resolutions: Record<string, { categoryCode: string; fieldKey: string; value: any }>) => void;
}

export default function ConflictResolutionPanel({ conflicts, onResolved }: ConflictResolutionPanelProps) {
  const { t } = useTranslation('kms');
  const [selections, setSelections] = useState<Record<string, number>>({});

  const handleSelect = (key: string, valueIndex: number) => {
    setSelections((prev) => ({ ...prev, [key]: valueIndex }));
  };

  const handleResolveAll = () => {
    const resolutions: Record<string, { categoryCode: string; fieldKey: string; value: any }> = {};
    for (const item of conflicts.items) {
      const key = `${item.categoryCode}::${item.fieldKey}`;
      const selectedIdx = selections[key] ?? 0;
      resolutions[key] = {
        categoryCode: item.categoryCode,
        fieldKey: item.fieldKey,
        value: item.values[selectedIdx]?.value,
      };
    }
    onResolved(resolutions);
  };

  const allResolved = conflicts.items.every(
    (item) => selections[`${item.categoryCode}::${item.fieldKey}`] !== undefined
  );

  if (conflicts.totalConflicts === 0) {
    return (
      <div className="rounded-lg border border-dashed border-green-200 bg-green-50/50 py-6 text-center">
        <Check className="mx-auto mb-2 h-6 w-6 text-green-400" />
        <p className="text-sm text-green-600">{t('docBuilder.wizard.noConflicts')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        <h3 className="text-sm font-semibold text-gray-900">
          {conflicts.totalConflicts} {t('docBuilder.wizard.conflictsFound')}
        </h3>
      </div>

      <div className="space-y-3">
        {conflicts.items.map((item) => {
          const key = `${item.categoryCode}::${item.fieldKey}`;
          const selectedIdx = selections[key];

          return (
            <div key={key} className="rounded-lg border border-yellow-200 bg-white p-4">
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500">{item.categoryName}</span>
                <span className="mx-1.5 text-gray-300">/</span>
                <span className="text-sm font-semibold text-gray-900">{item.fieldLabel || item.fieldKey}</span>
              </div>

              <div className="space-y-2">
                {item.values.map((val, idx) => (
                  <label
                    key={idx}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition-colors ${
                      selectedIdx === idx
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={key}
                      checked={selectedIdx === idx}
                      onChange={() => handleSelect(key, idx)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500">{val.source}</div>
                      <div className="mt-0.5 truncate text-sm text-gray-900">
                        {typeof val.value === 'object' ? JSON.stringify(val.value) : String(val.value)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleResolveAll}
        disabled={!allResolved}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t('docBuilder.wizard.resolveConflicts')}
      </button>
    </div>
  );
}
