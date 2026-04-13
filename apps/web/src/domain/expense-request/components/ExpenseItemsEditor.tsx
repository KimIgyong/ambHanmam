import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import type { ExpenseItemBody, ExpenseCategory } from '../service/expenseRequest.service';

const CATEGORIES: ExpenseCategory[] = [
  'TRAVEL',
  'ENTERTAINMENT',
  'SUPPLIES',
  'TRAINING',
  'MARKETING',
  'IT_INFRASTRUCTURE',
  'MAINTENANCE',
  'UTILITIES',
  'OTHER',
];

interface Props {
  items: ExpenseItemBody[];
  onChange: (items: ExpenseItemBody[]) => void;
  readOnly?: boolean;
}

export default function ExpenseItemsEditor({ items, onChange, readOnly = false }: Props) {
  const { t } = useTranslation('expenseRequest');

  const addItem = () => {
    onChange([
      ...items,
      { name: '', category: 'OTHER', quantity: 1, unit_price: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ExpenseItemBody, value: unknown) => {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  };

  const total = items.reduce((sum, item) => sum + (item.unit_price || 0) * (item.quantity || 0), 0);

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 min-w-[160px]">
                {t('form.itemName')}
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 min-w-[130px]">
                {t('form.itemCategory')}
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-20">
                {t('form.itemQuantity')}
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-28">
                {t('form.itemUnitPrice')}
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300 w-28">
                {t('form.itemAmount')}
              </th>
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((item, idx) => (
              <tr key={idx} className="bg-white dark:bg-gray-900">
                <td className="px-3 py-1.5">
                  {readOnly ? (
                    <span>{item.name}</span>
                  ) : (
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      placeholder={t('form.itemNamePlaceholder')}
                      className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {readOnly ? (
                    <span>{t(`category.${item.category}`)}</span>
                  ) : (
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(idx, 'category', e.target.value)}
                      className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {t(`category.${cat}`)}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {readOnly ? (
                    <span className="block text-right">{item.quantity}</span>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-sm text-right bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {readOnly ? (
                    <span className="block text-right">
                      {(item.unit_price || 0).toLocaleString()}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, 'unit_price', Number(e.target.value))}
                      className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-sm text-right bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>
                <td className="px-3 py-1.5 text-right font-medium text-gray-900 dark:text-gray-100">
                  {((item.unit_price || 0) * (item.quantity || 0)).toLocaleString()}
                </td>
                {!readOnly && (
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 5 : 6} className="px-3 py-4 text-center text-gray-400 text-sm">
                  {t('form.addItem')}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <td colSpan={readOnly ? 4 : 5} className="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                {t('form.totalAmount')}
              </td>
              <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-gray-100">
                {total.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 border border-dashed border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('form.addItem')}
        </button>
      )}
    </div>
  );
}
