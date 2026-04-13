import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';

export interface MilestoneItem {
  seq: number;
  label: string;
  percentage: number;
  amount: number;
  due_date: string;
  status?: string;
}

interface Props {
  milestones: MilestoneItem[];
  contractAmount: number;
  onChange: (milestones: MilestoneItem[]) => void;
  readOnly?: boolean;
}

export default function MilestoneEditor({ milestones, contractAmount, onChange, readOnly }: Props) {
  const { t } = useTranslation(['billing', 'common']);

  const addMilestone = () => {
    const nextSeq = milestones.length + 1;
    onChange([
      ...milestones,
      { seq: nextSeq, label: '', percentage: 0, amount: 0, due_date: '' },
    ]);
  };

  const removeMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index).map((m, i) => ({ ...m, seq: i + 1 }));
    onChange(updated);
  };

  const updateField = (index: number, field: keyof MilestoneItem, value: string | number) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'percentage' && contractAmount > 0) {
      updated[index].amount = Math.round(contractAmount * (Number(value) / 100));
    } else if (field === 'amount' && contractAmount > 0) {
      updated[index].percentage = Math.round((Number(value) / contractAmount) * 10000) / 100;
    }

    onChange(updated);
  };

  const totalPct = milestones.reduce((s, m) => s + Number(m.percentage), 0);
  const totalAmt = milestones.reduce((s, m) => s + Number(m.amount), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">{t('billing:contract.milestones')}</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={addMilestone}
            className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('billing:contract.addMilestone')}
          </button>
        )}
      </div>

      {milestones.length === 0 ? (
        <p className="text-xs text-gray-400">{t('billing:contract.noMilestones')}</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[40px_1fr_80px_120px_120px_32px] gap-2 text-xs font-medium text-gray-500">
            <span>#</span>
            <span>{t('billing:contract.milestoneLabel')}</span>
            <span>%</span>
            <span>{t('billing:contract.milestoneAmount')}</span>
            <span>{t('billing:contract.milestoneDue')}</span>
            <span />
          </div>
          {milestones.map((m, i) => (
            <div key={i} className="grid grid-cols-[40px_1fr_80px_120px_120px_32px] gap-2 items-center">
              <span className="text-sm text-gray-500 text-center">{m.seq}</span>
              <input
                type="text"
                value={m.label}
                onChange={(e) => updateField(i, 'label', e.target.value)}
                disabled={readOnly}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
                placeholder={t('billing:contract.milestoneLabelPlaceholder')}
              />
              <input
                type="number"
                value={m.percentage}
                onChange={(e) => updateField(i, 'percentage', parseFloat(e.target.value) || 0)}
                disabled={readOnly}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm text-right disabled:bg-gray-50"
              />
              <input
                type="number"
                value={m.amount}
                onChange={(e) => updateField(i, 'amount', parseFloat(e.target.value) || 0)}
                disabled={readOnly}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm text-right disabled:bg-gray-50"
              />
              <input
                type="date"
                value={m.due_date}
                onChange={(e) => updateField(i, 'due_date', e.target.value)}
                disabled={readOnly}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeMilestone(i)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <div className="grid grid-cols-[40px_1fr_80px_120px_120px_32px] gap-2 text-xs font-medium text-gray-600 border-t border-gray-200 pt-2">
            <span />
            <span>{t('billing:contract.milestoneTotal')}</span>
            <span className={`text-right ${Math.abs(totalPct - 100) > 0.01 ? 'text-red-500' : 'text-green-600'}`}>
              {totalPct.toFixed(2)}%
            </span>
            <span className="text-right">{totalAmt.toLocaleString()}</span>
            <span />
            <span />
          </div>
        </div>
      )}
    </div>
  );
}
