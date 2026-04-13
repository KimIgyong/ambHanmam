import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useTagTree, useCreateTag, useUpdateTag, useDeleteTag } from '../hooks/useTags';
import TagHierarchyTree from '../components/TagHierarchyTree';
import PageTitle from '@/global/components/PageTitle';
import { KmsTagResponse, TAG_LEVEL } from '@amb/types';

export default function TagManagementPage() {
  const { t } = useTranslation('kms');
  const { data: tags = [], isLoading } = useTagTree();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<KmsTagResponse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_local: '',
    level: 2,
    parent_id: '',
    color: '',
  });

  // Flatten tags for parent selector
  const flatTags: { id: string; display: string; level: number }[] = [];
  const flatten = (list: KmsTagResponse[], depth = 0) => {
    list.forEach((tag) => {
      flatTags.push({ id: tag.tagId, display: `${'  '.repeat(depth)}${tag.display}`, level: tag.level });
      if (tag.children) flatten(tag.children, depth + 1);
    });
  };
  flatten(tags);

  const resetForm = () => {
    setFormData({ name: '', name_local: '', level: 2, parent_id: '', color: '' });
    setEditingTag(null);
    setShowForm(false);
  };

  const handleEdit = (tag: KmsTagResponse) => {
    setEditingTag(tag);
    setFormData({
      name: tag.display,
      name_local: tag.nameLocal || '',
      level: tag.level,
      parent_id: tag.parentId || '',
      color: tag.color || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (tagId: string) => {
    if (!window.confirm(t('tag.confirmDelete'))) return;
    deleteTag.mutate(tagId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTag) {
      updateTag.mutate({
        id: editingTag.tagId,
        data: {
          name: formData.name || undefined,
          name_local: formData.name_local || undefined,
          level: formData.level,
          parent_id: formData.parent_id || undefined,
          color: formData.color || undefined,
        },
      });
    } else {
      createTag.mutate({
        name: formData.name,
        name_local: formData.name_local || undefined,
        level: formData.level,
        parent_id: formData.parent_id || undefined,
        color: formData.color || undefined,
      });
    }
    resetForm();
  };

  // Close modal on Escape key
  useEffect(() => {
    if (!showForm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resetForm();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showForm]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <PageTitle>{t('tagManagement')}</PageTitle>
          <p className="mt-1 text-sm text-gray-500">{t('title')}</p>
        </div>
        <button
          onClick={() => {
            setEditingTag(null);
            setFormData({ name: '', name_local: '', level: 2, parent_id: '', color: '' });
            setShowForm(true);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t('tag.create')}
        </button>
      </div>

      {/* Tag Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTag ? t('tag.edit') : t('tag.create')}
              </h2>
              <button
                onClick={resetForm}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t('tag.name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t('tag.nameLocal')}</label>
                  <input
                    type="text"
                    value={formData.name_local}
                    onChange={(e) => setFormData({ ...formData, name_local: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t('tag.level')}</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={TAG_LEVEL.DOMAIN}>{t('level.domain')}</option>
                    <option value={TAG_LEVEL.TOPIC}>{t('level.topic')}</option>
                    <option value={TAG_LEVEL.CONTEXT}>{t('level.context')}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t('tag.parent')}</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">({t('tag.noTags')})</option>
                    {flatTags.map((ft) => (
                      <option key={ft.id} value={ft.id}>
                        {ft.display}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('tag.color')}</label>
                <input
                  type="color"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 rounded-lg border border-gray-300"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('common:close', 'Close')}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingTag ? t('tag.edit') : t('tag.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading...</div>
      ) : (
        <TagHierarchyTree
          tags={tags}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      </div>
    </div>
  );
}
