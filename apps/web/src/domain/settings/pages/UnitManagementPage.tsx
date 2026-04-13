import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Network, Loader2, ArrowLeft, Plus, X, Check, UserPlus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UnitResponse } from '@amb/types';
import {
  useUnitTree,
  useUnitMembers,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  useRemoveUserRole,
} from '../hooks/useUnits';
import UnitTree from '../components/UnitTree';
import UserUnitRoleAssignModal from '../components/UserUnitRoleAssignModal';


interface UnitFormData {
  name: string;
  name_local: string;
  parent_id: string;
  is_active: boolean;
  sort_order: number;
}

const EMPTY_FORM: UnitFormData = {
  name: '',
  name_local: '',
  parent_id: '',
  is_active: true,
  sort_order: 0,
};

export default function UnitManagementPage() {
  const { t } = useTranslation(['acl', 'common']);
  const navigate = useNavigate();

  // For now, get first entity from user context or query params
  const entityId = new URLSearchParams(window.location.search).get('entityId') || '';
  const { data: tree, isLoading } = useUnitTree(entityId);

  const [selectedUnit, setSelectedUnit] = useState<UnitResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<UnitFormData>(EMPTY_FORM);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: members } = useUnitMembers(selectedUnit?.unitId || '');
  const createMut = useCreateUnit();
  const updateMut = useUpdateUnit();
  const deleteMut = useDeleteUnit();
  const removeRoleMut = useRemoveUserRole();

  const handleSelect = (dept: UnitResponse) => {
    setSelectedUnit(dept);
    setIsCreating(false);
    setIsEditing(false);
    setStatusMsg(null);
  };

  const handleAddChild = (parentId: string) => {
    setForm({ ...EMPTY_FORM, parent_id: parentId });
    setIsCreating(true);
    setIsEditing(false);
    setStatusMsg(null);
  };

  const handleEdit = (dept: UnitResponse) => {
    setForm({
      name: dept.name,
      name_local: dept.nameLocal || '',
      parent_id: dept.parentId || '',
      is_active: dept.isActive,
      sort_order: 0,
    });
    setSelectedUnit(dept);
    setIsEditing(true);
    setIsCreating(false);
    setStatusMsg(null);
  };

  const handleDelete = async (dept: UnitResponse) => {
    if (!confirm(t('acl:unit.deleteConfirm'))) return;
    try {
      await deleteMut.mutateAsync(dept.unitId);
      setStatusMsg({ type: 'success', text: t('acl:unit.deleteSuccess') });
      if (selectedUnit?.unitId === dept.unitId) {
        setSelectedUnit(null);
      }
    } catch {
      setStatusMsg({ type: 'error', text: 'Delete failed.' });
    }
  };

  const handleSave = async () => {
    setStatusMsg(null);
    try {
      if (isCreating) {
        await createMut.mutateAsync({
          data: {
            name: form.name,
            name_local: form.name_local || undefined,
            parent_id: form.parent_id || undefined,
            is_active: form.is_active,
            sort_order: form.sort_order,
          },
          entityId,
        });
      } else if (isEditing && selectedUnit) {
        await updateMut.mutateAsync({
          id: selectedUnit.unitId,
          data: {
            name: form.name,
            name_local: form.name_local || undefined,
            parent_id: form.parent_id || undefined,
            is_active: form.is_active,
            sort_order: form.sort_order,
          },
        });
      }
      setStatusMsg({ type: 'success', text: t('acl:unit.saveSuccess') });
      setIsCreating(false);
      setIsEditing(false);
    } catch {
      setStatusMsg({ type: 'error', text: 'Save failed.' });
    }
  };

  const handleRemoveMember = async (roleId: string) => {
    if (!confirm(t('acl:role.removeConfirm'))) return;
    await removeRoleMut.mutateAsync(roleId);
  };

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Network className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('acl:unit.title')}
              </h1>
            </div>
          </div>
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setIsCreating(true);
              setIsEditing(false);
              setStatusMsg(null);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('acl:unit.addNew')}
          </button>
        </div>

        {/* Status */}
        {statusMsg && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${
            statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {statusMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Tree */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              {t('acl:unit.title')}
            </h3>
            {tree && tree.length > 0 ? (
              <UnitTree
                departments={tree}
                selectedId={selectedUnit?.unitId}
                onSelect={handleSelect}
                onAddChild={handleAddChild}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showActions
              />
            ) : (
              <p className="text-sm text-gray-400">{t('acl:unit.noResults')}</p>
            )}
          </div>

          {/* Right: Detail / Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Create/Edit Form */}
            {(isCreating || isEditing) && (
              <div className="rounded-xl border border-indigo-200 bg-white p-6">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                  {isCreating ? t('acl:unit.createTitle') : t('acl:unit.editTitle')}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('acl:unit.name')} *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('acl:unit.nameLocal')}
                    </label>
                    <input
                      type="text"
                      value={form.name_local}
                      onChange={(e) => setForm({ ...form, name_local: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {t('acl:unit.sortOrder')}
                    </label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {t('acl:unit.active')}
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => { setIsCreating(false); setIsEditing(false); }}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    {t('common:close')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!form.name || createMut.isPending || updateMut.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {(createMut.isPending || updateMut.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {isCreating ? t('common:create') : t('common:save')}
                  </button>
                </div>
              </div>
            )}

            {/* Members Panel */}
            {selectedUnit && !isCreating && !isEditing && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {selectedUnit.name} — {t('acl:unit.members')}
                  </h3>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {t('acl:role.assign')}
                  </button>
                </div>

                {members && members.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                            {member.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                            <p className="text-xs text-gray-400">{member.userEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <RoleBadge role={member.role} t={t} />
                          {member.isPrimary && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                              {t('acl:role.primary')}
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">{t('acl:unit.noMembers')}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Assign Modal */}
        {showAssignModal && tree && (
          <UserUnitRoleAssignModal
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            departments={tree}
            preselectedDeptId={selectedUnit?.unitId}
          />
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role, t }: { role: string; t: (key: string) => string }) {
  const colors: Record<string, string> = {
    DEPARTMENT_HEAD: 'bg-red-100 text-red-700',
    TEAM_LEAD: 'bg-blue-100 text-blue-700',
    MEMBER: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[role] || colors.MEMBER}`}>
      {t(`acl:role.${role}`)}
    </span>
  );
}
