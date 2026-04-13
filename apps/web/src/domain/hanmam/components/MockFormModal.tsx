import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export interface FormField {
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'file';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface Props {
  title: string;
  fields: FormField[];
  isOpen: boolean;
  onClose: () => void;
}

export default function MockFormModal({ title, fields, isOpen, onClose }: Props) {
  const { t } = useTranslation(['hanmam']);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          {fields.map((f, i) => (
            <div key={i} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">{f.label}</label>
              {f.type === 'text' && (
                <input type="text" placeholder={f.placeholder} className="h-9 rounded-md border border-gray-300 px-3 text-sm" readOnly />
              )}
              {f.type === 'number' && (
                <input type="number" placeholder={f.placeholder} className="h-9 rounded-md border border-gray-300 px-3 text-sm" readOnly />
              )}
              {f.type === 'textarea' && (
                <textarea placeholder={f.placeholder} rows={3} className="rounded-md border border-gray-300 px-3 py-2 text-sm" readOnly />
              )}
              {f.type === 'select' && (
                <select className="h-9 rounded-md border border-gray-300 px-2 text-sm" disabled>
                  <option>—</option>
                  {f.options?.map((o) => <option key={o.value}>{o.label}</option>)}
                </select>
              )}
              {f.type === 'date' && (
                <input type="date" className="h-9 rounded-md border border-gray-300 px-3 text-sm" readOnly />
              )}
              {f.type === 'file' && (
                <input type="file" className="text-sm text-gray-500" disabled />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            {t('hanmam:button.reset')}
          </button>
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            {t('hanmam:button.register')}
          </button>
        </div>
      </div>
    </div>
  );
}
