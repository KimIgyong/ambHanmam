import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  X,
} from 'lucide-react';
import { CmsSectionResponse } from '@amb/types';
import { cmsSectionService } from '../service/cms-api.service';
import { useCmsEditorStore } from '../store/cms.store';

// ── Section type → content field schema ──
const SECTION_FIELDS: Record<string, Array<{ key: string; label: string; type: 'text' | 'textarea' | 'items'; itemFields?: Array<{ key: string; label: string; type: 'text' | 'textarea' }> }>> = {
  HERO: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'ctaText', label: 'CTA Button Text', type: 'text' },
    { key: 'ctaLink', label: 'CTA Button Link', type: 'text' },
  ],
  FEATURES: [
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'items', label: 'Feature Items', type: 'items', itemFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ]},
  ],
  CTA: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'buttonText', label: 'Button Text', type: 'text' },
    { key: 'buttonLink', label: 'Button Link', type: 'text' },
  ],
  FAQ: [
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'items', label: 'FAQ Items', type: 'items', itemFields: [
      { key: 'question', label: 'Question', type: 'text' },
      { key: 'answer', label: 'Answer', type: 'textarea' },
    ]},
  ],
  IMAGE_TEXT: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'imageUrl', label: 'Image URL', type: 'text' },
    { key: 'imagePosition', label: 'Image Position (left/right)', type: 'text' },
  ],
  TESTIMONIALS: [
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'items', label: 'Testimonials', type: 'items', itemFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'role', label: 'Role / Company', type: 'text' },
      { key: 'quote', label: 'Quote', type: 'textarea' },
    ]},
  ],
  PRICING: [
    { key: 'title', label: 'Section Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
  ],
  CONTACT: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'email', label: 'Contact Email', type: 'text' },
    { key: 'phone', label: 'Contact Phone', type: 'text' },
    { key: 'address', label: 'Address', type: 'textarea' },
  ],
};

const SECTION_TYPES = ['HERO', 'FEATURES', 'IMAGE_TEXT', 'TESTIMONIALS', 'FAQ', 'CTA', 'PRICING', 'CONTACT'];

// ── Items Editor (for FEATURES, FAQ, TESTIMONIALS) ──
function ItemsEditor({
  items,
  onChange,
  itemFields,
}: {
  items: Record<string, any>[];
  onChange: (items: Record<string, any>[]) => void;
  itemFields: Array<{ key: string; label: string; type: 'text' | 'textarea' }>;
}) {
  const addItem = () => {
    const empty: Record<string, any> = {};
    itemFields.forEach((f) => (empty[f.key] = ''));
    onChange([...items, empty]);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, key: string, value: string) => {
    const updated = items.map((item, i) => (i === idx ? { ...item, [key]: value } : item));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
            <button
              onClick={() => removeItem(idx)}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {itemFields.map((field) => (
            <div key={field.key} className="mb-2 last:mb-0">
              <label className="mb-0.5 block text-xs text-gray-500">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  value={item[field.key] || ''}
                  onChange={(e) => updateItem(idx, field.key, e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
                />
              ) : (
                <input
                  type="text"
                  value={item[field.key] || ''}
                  onChange={(e) => updateItem(idx, field.key, e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
                />
              )}
            </div>
          ))}
        </div>
      ))}
      <button
        onClick={addItem}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-lime-400 hover:text-lime-600"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Item
      </button>
    </div>
  );
}

// ── Section Content Editor ──
function SectionContentEditor({
  type,
  content,
  onChange,
}: {
  type: string;
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}) {
  const fields = SECTION_FIELDS[type] || [];

  const updateField = (key: string, value: any) => {
    onChange({ ...content, [key]: value });
  };

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
          {field.type === 'items' && field.itemFields ? (
            <ItemsEditor
              items={content[field.key] || []}
              onChange={(items) => updateField(field.key, items)}
              itemFields={field.itemFields}
            />
          ) : field.type === 'textarea' ? (
            <textarea
              value={content[field.key] || ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
            />
          ) : (
            <input
              type="text"
              value={content[field.key] || ''}
              onChange={(e) => updateField(field.key, e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Section Card ──
function SectionCard({
  section,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  section: CmsSectionResponse;
  onUpdate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { t } = useTranslation(['site']);
  const editorLang = useCmsEditorStore((s) => s.editorLang);

  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<Record<string, any>>(
    editorLang === 'ko' ? (section.contentKo || section.contentEn || {}) : (section.contentEn || {}),
  );

  // Sync content when language changes
  const currentContent = editorLang === 'ko'
    ? (section.contentKo || section.contentEn || {})
    : (section.contentEn || {});

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = editorLang === 'ko'
        ? { content_ko: content }
        : { content_en: content };
      await cmsSectionService.updateSection(section.id, data);
      onUpdate();
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      await cmsSectionService.updateSection(section.id, { is_visible: !section.isVisible });
      onUpdate();
    } catch {
      // Error handled silently
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await cmsSectionService.deleteSection(section.id);
      onDelete();
    } catch {
      // Error handled silently
    }
  };

  return (
    <div className={`rounded-lg border ${section.isVisible ? 'border-gray-200 bg-white' : 'border-dashed border-gray-300 bg-gray-50 opacity-70'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-gray-400" />

        <span className="inline-flex items-center rounded bg-lime-100 px-2 py-0.5 text-xs font-medium text-lime-700">
          {t(`site:section.${section.type}`, section.type)}
        </span>

        <span className="min-w-0 flex-1 truncate text-sm text-gray-600">
          {currentContent.title || currentContent.question || '(no title)'}
        </span>

        {/* Move up/down */}
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown className="h-4 w-4" />
        </button>

        {/* Visibility */}
        <button
          onClick={handleToggleVisibility}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title={section.isVisible ? 'Hide' : 'Show'}
        >
          {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Expand/Collapse */}
        <button
          onClick={() => {
            if (!expanded) {
              // Sync content from section data when expanding
              setContent(editorLang === 'ko'
                ? (section.contentKo || section.contentEn || {})
                : (section.contentEn || {}));
            }
            setExpanded(!expanded);
          }}
          className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200"
        >
          {expanded ? t('site:section.settings') + ' ▲' : t('site:section.settings') + ' ▼'}
        </button>
      </div>

      {/* Expanded Editor */}
      {expanded && (
        <div className="border-t border-gray-200 px-4 py-4">
          <SectionContentEditor
            type={section.type}
            content={content}
            onChange={setContent}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-lime-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-lime-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('site:section.saveSection')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Section Modal ──
function AddSectionModal({
  onAdd,
  onClose,
}: {
  onAdd: (type: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation(['site']);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('site:section.addSection')}
          </h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SECTION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="rounded-lg border border-gray-200 px-3 py-3 text-left transition-colors hover:border-lime-300 hover:bg-lime-50"
            >
              <span className="text-sm font-medium text-gray-900">
                {t(`site:section.${type}`, type)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main SectionBuilder ──
interface SectionBuilderProps {
  pageId: string;
  sections: CmsSectionResponse[];
  onRefresh: () => void;
}

export default function SectionBuilder({ pageId, sections, onRefresh }: SectionBuilderProps) {
  const { t } = useTranslation(['site']);
  const [showAddModal, setShowAddModal] = useState(false);

  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAddSection = async (type: string) => {
    setShowAddModal(false);
    try {
      await cmsSectionService.createSection(pageId, { type });
      onRefresh();
    } catch {
      // Error handled silently
    }
  };

  const handleReorder = async (idx: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const items = sorted.map((s, i) => ({
      id: s.id,
      sort_order: i === idx ? sorted[swapIdx].sortOrder : i === swapIdx ? sorted[idx].sortOrder : s.sortOrder,
    }));

    try {
      await cmsSectionService.reorderSections(pageId, items);
      onRefresh();
    } catch {
      // Error handled silently
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          {t('site:section.builder')}
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-lime-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-lime-700"
        >
          <Plus className="h-4 w-4" />
          {t('site:section.addSection')}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-gray-400">
          <Plus className="h-10 w-10" />
          <p className="mt-3 text-sm">{t('site:section.addSection')}</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 rounded-md bg-lime-600 px-4 py-2 text-sm font-medium text-white hover:bg-lime-700"
          >
            {t('site:section.addSection')}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((section, idx) => (
            <SectionCard
              key={section.id}
              section={section}
              onUpdate={onRefresh}
              onDelete={onRefresh}
              onMoveUp={() => handleReorder(idx, 'up')}
              onMoveDown={() => handleReorder(idx, 'down')}
              isFirst={idx === 0}
              isLast={idx === sorted.length - 1}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddSectionModal
          onAdd={handleAddSection}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
