import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';

export interface InvoiceItem {
  seq: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceItemsEditorProps {
  items: InvoiceItem[];
  currency: string;
  onChange: (items: InvoiceItem[]) => void;
}

export default function InvoiceItemsEditor({ items, currency, onChange }: InvoiceItemsEditorProps) {
  const { t } = useTranslation(['billing', 'common']);

  const addItem = () => {
    const nextSeq = items.length > 0 ? Math.max(...items.map((i) => i.seq)) + 1 : 1;
    onChange([...items, { seq: nextSeq, description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calc amount
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = Number(updated[index].quantity) * Number(updated[index].unit_price);
    }

    onChange(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('billing:invoice.items')}
        </h3>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('billing:invoice.addItem')}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-gray-400 py-3 text-center">{t('billing:invoice.noItems')}</p>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-[11px] font-medium text-gray-500 uppercase px-1">
            <div className="col-span-5">{t('billing:invoice.itemDescription')}</div>
            <div className="col-span-2 text-right">{t('billing:invoice.itemQty')}</div>
            <div className="col-span-2 text-right">{t('billing:invoice.itemUnitPrice')}</div>
            <div className="col-span-2 text-right">{t('billing:invoice.itemAmount')}</div>
            <div className="col-span-1" />
          </div>

          {/* Items */}
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder={t('billing:invoice.itemDescPlaceholder')}
                  className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-right focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-right focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="col-span-2 text-right text-xs font-mono text-gray-700 pr-1">
                {Number(item.amount).toLocaleString()}
              </div>
              <div className="col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Subtotal */}
          <div className="flex justify-end border-t border-gray-200 pt-2 pr-1">
            <span className="text-xs font-medium text-gray-600 mr-3">{t('billing:invoice.subtotal')}:</span>
            <span className="text-xs font-mono font-semibold text-gray-900">
              {currency} {subtotal.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
