import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import CurrencyInput from '../common/CurrencyInput';

export interface PaymentScheduleItem {
  seq: number;
  billing_date: string;
  billing_period: string;
  amount: number;
  status?: string;
}

interface Props {
  schedules: PaymentScheduleItem[];
  contractAmount: number;
  onChange: (schedules: PaymentScheduleItem[]) => void;
  readOnly?: boolean;
}

export default function PaymentScheduleEditor({ schedules, contractAmount, onChange, readOnly }: Props) {
  const { t } = useTranslation(['billing', 'common']);

  const addSchedule = () => {
    const nextSeq = schedules.length + 1;
    onChange([
      ...schedules,
      { seq: nextSeq, billing_date: '', billing_period: 'CURRENT_MONTH', amount: 0 },
    ]);
  };

  const removeSchedule = (index: number) => {
    const updated = schedules.filter((_, i) => i !== index).map((s, i) => ({ ...s, seq: i + 1 }));
    onChange(updated);
  };

  const updateField = (index: number, field: keyof PaymentScheduleItem, value: string | number) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const totalAmt = schedules.reduce((s, item) => s + Number(item.amount), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">{t('billing:contract.schedule.title', '결제 스케줄')}</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={addSchedule}
            className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('billing:contract.schedule.addSchedule', '회차 추가')}
          </button>
        )}
      </div>

      {schedules.length === 0 ? (
        <p className="text-xs text-gray-400">{t('billing:contract.schedule.noSchedules', '등록된 결제 스케줄이 없습니다.')}</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[40px_1fr_140px_160px_32px] gap-2 text-xs font-medium text-gray-500">
            <span>#</span>
            <span>{t('billing:contract.schedule.billingDate', '청구일')}</span>
            <span>{t('billing:contract.schedule.billingPeriod', '청구 기준')}</span>
            <span>{t('billing:contract.schedule.amount', '청구 금액')}</span>
            <span />
          </div>
          {schedules.map((s, i) => (
            <div key={i} className="grid grid-cols-[40px_1fr_140px_160px_32px] gap-2 items-center">
              <span className="text-sm text-gray-500 text-center">{s.seq}</span>
              <input
                type="date"
                value={s.billing_date}
                onChange={(e) => updateField(i, 'billing_date', e.target.value)}
                disabled={readOnly}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
              />
              <select
                value={s.billing_period}
                onChange={(e) => updateField(i, 'billing_period', e.target.value)}
                disabled={readOnly}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50"
              >
                <option value="CURRENT_MONTH">{t('billing:contract.billingPeriodOpt.CURRENT_MONTH')}</option>
                <option value="PREVIOUS_MONTH">{t('billing:contract.billingPeriodOpt.PREVIOUS_MONTH')}</option>
              </select>
              <CurrencyInput
                value={Number(s.amount)}
                onChange={(v) => updateField(i, 'amount', v)}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm text-right disabled:bg-gray-50"
                disabled={readOnly}
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeSchedule(i)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <div className="grid grid-cols-[40px_1fr_140px_160px_32px] gap-2 text-xs font-medium text-gray-600 border-t border-gray-200 pt-2">
            <span />
            <span>{t('billing:contract.schedule.total', '합계')}</span>
            <span />
            <span className={`text-right ${contractAmount > 0 && Math.abs(totalAmt - contractAmount) > 0.01 ? 'text-red-500' : 'text-green-600'}`}>
              {totalAmt.toLocaleString()}
            </span>
            <span />
          </div>
          {contractAmount > 0 && Math.abs(totalAmt - contractAmount) > 0.01 && (
            <p className="text-xs text-red-500">
              {t('billing:contract.schedule.mismatch', '합계가 계약 금액({{amount}})과 다릅니다.', { amount: contractAmount.toLocaleString() })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
