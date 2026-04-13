import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { FieldSchema } from '../service/doc-builder.service';

interface Props {
  field: FieldSchema;
  value: any;
  onChange: (value: any) => void;
}

export default function BaseDataField({ field, value, onChange }: Props) {
  const renderLabel = () => (
    <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
      {field.label}
      {field.required && <span className="text-red-500">*</span>}
    </label>
  );

  // text / url
  if (field.type === 'text' || field.type === 'url') {
    return (
      <div>
        {renderLabel()}
        <input
          type={field.type === 'url' ? 'url' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    );
  }

  // number
  if (field.type === 'number') {
    return (
      <div>
        {renderLabel()}
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    );
  }

  // date
  if (field.type === 'date') {
    return (
      <div>
        {renderLabel()}
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    );
  }

  // richtext → textarea
  if (field.type === 'richtext') {
    return (
      <div>
        {renderLabel()}
        <textarea
          rows={4}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    );
  }

  // file → text input for URL (simplified)
  if (field.type === 'file') {
    return (
      <div>
        {renderLabel()}
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    );
  }

  // json → JSON textarea
  if (field.type === 'json') {
    return <JsonField field={field} value={value} onChange={onChange} />;
  }

  // json_array → dynamic array of objects
  if (field.type === 'json_array') {
    return <JsonArrayField field={field} value={value} onChange={onChange} />;
  }

  // Fallback
  return (
    <div>
      {renderLabel()}
      <input
        type="text"
        value={typeof value === 'object' ? JSON.stringify(value) : value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

function JsonField({ field, value, onChange }: Props) {
  const [raw, setRaw] = useState(() => (value ? JSON.stringify(value, null, 2) : ''));
  const [error, setError] = useState('');

  const handleBlur = () => {
    if (!raw.trim()) {
      onChange(null);
      setError('');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      onChange(parsed);
      setError('');
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        rows={4}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={handleBlur}
        className={`w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function JsonArrayField({ field, value, onChange }: Props) {
  const items: any[] = Array.isArray(value) ? value : [];
  const schema = field.schema || {};
  const schemaKeys = Object.keys(schema);

  const addItem = () => {
    const empty: Record<string, any> = {};
    for (const key of schemaKeys) {
      empty[key] = '';
    }
    onChange([...items, empty]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: string, val: any) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [key]: val } : item,
    );
    onChange(updated);
  };

  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="rounded-md border border-gray-200 bg-gray-50 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
              <button
                onClick={() => removeItem(idx)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {schemaKeys.map((key) => (
                <div key={key}>
                  <label className="mb-0.5 block text-xs text-gray-500">{key}</label>
                  <input
                    type={schema[key] === 'number' ? 'number' : 'text'}
                    value={item[key] ?? ''}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        key,
                        schema[key] === 'number' && e.target.value
                          ? Number(e.target.value)
                          : e.target.value,
                      )
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        className="mt-2 flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <Plus className="h-4 w-4" />
        {field.label}
      </button>
    </div>
  );
}
