import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, X, Search, Loader2 } from 'lucide-react';
import PageTitle from '@/global/components/PageTitle';
import { useGlossary, useCreateTerm, useUpdateTerm, useDeleteTerm } from '../hooks/useTranslations';

interface GlossaryTerm {
  glsId: string;
  termEn: string;
  termKo?: string;
  termVi?: string;
  category?: string;
  context?: string;
  createdBy?: { id: string; name: string };
  createdAt?: string;
}

interface TermFormData {
  term_en: string;
  term_ko?: string;
  term_vi?: string;
  category?: string;
  context?: string;
}

export default function GlossaryPage() {
  const { t } = useTranslation('translation');
  const { data: terms = [], isLoading } = useGlossary();
  const createTerm = useCreateTerm();
  const updateTerm = useUpdateTerm();
  const deleteTerm = useDeleteTerm();

  const [showForm, setShowForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GlossaryTerm | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<TermFormData>({
    term_en: '', term_ko: '', term_vi: '', category: '', context: '',
  });

  const filteredTerms = (terms as GlossaryTerm[]).filter((term) => {
    const q = searchQuery.toLowerCase();
    return (
      term.termEn?.toLowerCase().includes(q) ||
      term.termKo?.toLowerCase().includes(q) ||
      term.termVi?.toLowerCase().includes(q) ||
      term.category?.toLowerCase().includes(q)
    );
  });

  const categories = [...new Set((terms as GlossaryTerm[]).map((t) => t.category).filter(Boolean))] as string[];

  const openAddForm = () => {
    setEditingTerm(null);
    setFormData({ term_en: '', term_ko: '', term_vi: '', category: '', context: '' });
    setShowForm(true);
  };

  const openEditForm = (term: GlossaryTerm) => {
    setEditingTerm(term);
    setFormData({
      term_en: term.termEn,
      term_ko: term.termKo || '',
      term_vi: term.termVi || '',
      category: term.category || '',
      context: term.context || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = {
      term_en: formData.term_en.trim(),
      term_ko: formData.term_ko?.trim() || undefined,
      term_vi: formData.term_vi?.trim() || undefined,
      category: formData.category?.trim() || undefined,
      context: formData.context?.trim() || undefined,
    };

    if (editingTerm) {
      await updateTerm.mutateAsync({ glsId: editingTerm.glsId, dto: payload });
    } else {
      await createTerm.mutateAsync(payload);
    }
    setShowForm(false);
    setEditingTerm(null);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteTerm.mutateAsync(deleteTarget.glsId);
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>{t('glossary.title')}</PageTitle>
            <p className="mt-1 text-sm text-gray-500">
              {(terms as GlossaryTerm[]).length} {t('glossary.title').toLowerCase()}
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t('glossary.addTerm')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terms..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTerms.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-gray-400">
            {t('glossary.noTerms')}
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t('glossary.termEn')}</th>
                  <th className="px-4 py-3">{t('glossary.termKo')}</th>
                  <th className="px-4 py-3">{t('glossary.termVi')}</th>
                  <th className="px-4 py-3">{t('glossary.category')}</th>
                  <th className="px-4 py-3">{t('glossary.context')}</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTerms.map((term) => (
                  <tr key={term.glsId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{term.termEn}</td>
                    <td className="px-4 py-3 text-gray-600">{term.termKo || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{term.termVi || '-'}</td>
                    <td className="px-4 py-3">
                      {term.category ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                          {term.category}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-500">{term.context || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditForm(term)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title={t('glossary.editTerm')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(term)}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title={t('glossary.deleteTerm')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTerm ? t('glossary.editTerm') : t('glossary.addTerm')}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('glossary.termEn')} *
                </label>
                <input
                  type="text"
                  value={formData.term_en}
                  onChange={(e) => setFormData((prev) => ({ ...prev, term_en: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('glossary.termKo')}
                  </label>
                  <input
                    type="text"
                    value={formData.term_ko}
                    onChange={(e) => setFormData((prev) => ({ ...prev, term_ko: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('glossary.termVi')}
                  </label>
                  <input
                    type="text"
                    value={formData.term_vi}
                    onChange={(e) => setFormData((prev) => ({ ...prev, term_vi: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('glossary.category')}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  list="categories"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <datalist id="categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('glossary.context')}
                </label>
                <textarea
                  value={formData.context}
                  onChange={(e) => setFormData((prev) => ({ ...prev, context: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {t('edit.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.term_en.trim() || createTerm.isPending || updateTerm.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {(createTerm.isPending || updateTerm.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('edit.save')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <p className="mb-1 text-sm font-medium text-gray-900">{t('glossary.deleteTerm')}</p>
            <p className="mb-4 text-sm text-gray-500">
              {t('glossary.deleteConfirm')}
            </p>
            <p className="mb-4 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900">
              {deleteTarget.termEn}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {t('edit.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteTerm.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteTerm.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('glossary.deleteTerm')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
