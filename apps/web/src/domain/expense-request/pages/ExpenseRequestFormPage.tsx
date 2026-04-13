import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Send } from 'lucide-react';
import {
  useCreateExpenseRequest,
  useUpdateExpenseRequest,
  useExpenseRequestDetail,
} from '../hooks/useExpenseRequest';
import ExpenseItemsEditor from '../components/ExpenseItemsEditor';
import type {
  ExpenseItemBody,
  ExpenseRecurringType,
} from '../service/expenseRequest.service';
import { useMemberList } from '@/domain/members/hooks/useMembers';
import type { MemberResponse } from '@amb/types';

const RECURRING_TYPES: ExpenseRecurringType[] = ['NONE', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

interface FormState {
  title: string;
  request_date: string;
  required_date: string;
  is_recurring: boolean;
  recurring_type: ExpenseRecurringType;
  approver1_id: string;
  approver2_id: string;
  memo: string;
  items: ExpenseItemBody[];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function mapCategoryToApi(category?: string): string {
  const map: Record<string, string> = {
    TRAVEL: 'TRANSPORTATION',
    ENTERTAINMENT: 'ENTERTAINMENT',
    SUPPLIES: 'OFFICE_SUPPLIES',
    TRAINING: 'TRAINING',
    MARKETING: 'MARKETING',
    IT_INFRASTRUCTURE: 'SOFTWARE',
    MAINTENANCE: 'UTILITIES',
    UTILITIES: 'UTILITIES',
    OTHER: 'OTHER',
  };
  return map[category || 'OTHER'] || 'OTHER';
}

function mapRecurringTypeToPeriod(type: ExpenseRecurringType): 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' {
  if (type === 'QUARTERLY') return 'QUARTERLY';
  if (type === 'YEARLY') return 'ANNUAL';
  return 'MONTHLY';
}

interface CreateExpenseResponse {
  data?: { id?: string; data?: { id?: string } };
}

export default function ExpenseRequestFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('expenseRequest');
  const isEdit = !!id;

  const { data: existing } = useExpenseRequestDetail(id ?? null);
  const createMutation = useCreateExpenseRequest();
  const updateMutation = useUpdateExpenseRequest();

  const { data: membersRes } = useMemberList();
  const members: MemberResponse[] = membersRes ?? [];

  const [form, setForm] = useState<FormState>({
    title: '',
    request_date: today(),
    required_date: '',
    is_recurring: false,
    recurring_type: 'NONE',
    approver1_id: '',
    approver2_id: '',
    memo: '',
    items: [],
  });

  useEffect(() => {
    if (existing && isEdit) {
      setForm({
        title: existing.title,
        request_date: existing.requestDate,
        required_date: existing.requiredDate ?? '',
        is_recurring: existing.isRecurring,
        recurring_type: existing.recurringType,
        approver1_id: existing.approver1Id ?? '',
        approver2_id: existing.approver2Id ?? '',
        memo: existing.memo ?? '',
        items: existing.items.map((it) => ({
          name: it.name,
          category: it.category,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          description: it.description ?? undefined,
        })),
      });
    }
  }, [existing, isEdit]);

  const handleSave = async (_submit = false) => {
    if (!form.title.trim()) {
      alert(t('error.titleRequired'));
      return;
    }
    if (form.items.length === 0) {
      alert(t('error.itemsRequired'));
      return;
    }

    const payload = {
      title: form.title,
      type: 'PRE_APPROVAL' as const,
      frequency: form.is_recurring ? ('RECURRING' as const) : ('ONE_TIME' as const),
      category: mapCategoryToApi(form.items[0]?.category),
      expense_date: form.request_date,
      reason: form.memo || undefined,
      currency: 'VND',
      period: form.is_recurring ? mapRecurringTypeToPeriod(form.recurring_type) : undefined,
      approver1_id: form.approver1_id || undefined,
      approver2_id: form.approver2_id || undefined,
      items: form.items.map((item, idx) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_amount: 0,
        currency: 'VND',
        note: item.description || undefined,
        sort_order: idx,
      })),
    };

    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, data: payload });
      navigate(`/expense-requests/${id}`);
    } else {
      const res = (await createMutation.mutateAsync(payload)) as CreateExpenseResponse;
      const createdId = res.data?.id || res.data?.data?.id;
      if (createdId) {
        navigate(`/expense-requests/${createdId}`);
      } else {
        navigate('/expense-requests');
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? t('action.edit') : t('action.create')}
          </h1>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t('form.titlePlaceholder')}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.requestDate')}
              </label>
              <input
                type="date"
                value={form.request_date}
                onChange={(e) => setForm((f) => ({ ...f, request_date: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.requiredDate')}
              </label>
              <input
                type="date"
                value={form.required_date}
                onChange={(e) => setForm((f) => ({ ...f, required_date: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-start gap-6">
            <div className="flex items-center gap-2 mt-1">
              <input
                id="is_recurring"
                type="checkbox"
                checked={form.is_recurring}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    is_recurring: e.target.checked,
                    recurring_type: e.target.checked ? 'MONTHLY' : 'NONE',
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('form.isRecurring')}
              </label>
            </div>
            {form.is_recurring && (
              <div>
                <select
                  value={form.recurring_type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recurring_type: e.target.value as ExpenseRecurringType }))
                  }
                  className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {RECURRING_TYPES.filter((r) => r !== 'NONE').map((type) => (
                    <option key={type} value={type}>
                      {t(`recurringType.${type}`)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Approvers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.approver1')}
              </label>
              <select
                value={form.approver1_id}
                onChange={(e) => setForm((f) => ({ ...f, approver1_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('form.approverPlaceholder')}</option>
                {members.map((m: MemberResponse) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.approver2')}
              </label>
              <select
                value={form.approver2_id}
                onChange={(e) => setForm((f) => ({ ...f, approver2_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('form.approverPlaceholder')}</option>
                {members.map((m: MemberResponse) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.items')} <span className="text-red-500">*</span>
            </label>
            <ExpenseItemsEditor
              items={form.items}
              onChange={(items) => setForm((f) => ({ ...f, items }))}
            />
          </div>

          {/* Memo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.memo')}
            </label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
              placeholder={t('form.memoPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {t('form.cancel')}
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {t('form.saveDraft')}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {t('form.submit')}
        </button>
      </div>
    </div>
  );
}
