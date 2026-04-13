import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, CheckCircle, XCircle, HardDrive } from 'lucide-react';
import { useDeleteEntityDriveSettings, useUpdateEntityDriveSettings } from '../hooks/useAdmin';
import type { EntityDriveSettingsItem } from '../service/admin.service';

interface Props {
  item: EntityDriveSettingsItem;
  onClose: () => void;
}

export default function DriveSettingsEditModal({ item, onClose }: Props) {
  const { t } = useTranslation(['totalUsers', 'common']);
  const updateMutation = useUpdateEntityDriveSettings();
  const deleteMutation = useDeleteEntityDriveSettings();

  const [impersonateEmail, setImpersonateEmail] = useState(item.drive.impersonateEmail || '');
  const [billingRootFolderId, setBillingRootFolderId] = useState(item.drive.billingRootFolderId || '');
  const [billingRootFolderName, setBillingRootFolderName] = useState(item.drive.billingRootFolderName || '');

  useEffect(() => {
    setImpersonateEmail(item.drive.impersonateEmail || '');
    setBillingRootFolderId(item.drive.billingRootFolderId || '');
    setBillingRootFolderName(item.drive.billingRootFolderName || '');
  }, [item]);

  const sourceLabel = (source: string, sourceEntityCode?: string) => {
    switch (source) {
      case 'own':
        return t('totalUsers:drive.sourceOwn');
      case 'inherited':
        return `${t('totalUsers:drive.sourceInherited')} (${sourceEntityCode})`;
      case 'global':
        return t('totalUsers:drive.sourceGlobal');
      default:
        return t('totalUsers:drive.sourceNone');
    }
  };

  const sourceColor = (source: string) => {
    switch (source) {
      case 'own':
        return 'bg-green-100 text-green-700';
      case 'inherited':
        return 'bg-blue-100 text-blue-700';
      case 'global':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        entityId: item.entityId,
        data: {
          impersonate_email: impersonateEmail || undefined,
          billing_root_folder_id: billingRootFolderId || undefined,
          billing_root_folder_name: billingRootFolderName || undefined,
        },
      },
      { onSuccess: () => onClose() },
    );
  };

  const handleDelete = () => {
    const confirmed = window.confirm(t('totalUsers:drive.deleteConfirm'));
    if (!confirmed) return;

    deleteMutation.mutate(item.entityId, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
              <HardDrive className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {item.entityName}
                <span className="ml-2 text-sm font-normal text-gray-400">({item.entityCode})</span>
              </h3>
              <p className="text-xs text-gray-500">{t('totalUsers:drive.editDescription')}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status badges */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            {item.drive.configured ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-300" />
            )}
            <span className="text-gray-600">{t('totalUsers:drive.configured')}</span>
          </div>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sourceColor(item.drive.source)}`}>
            {sourceLabel(item.drive.source, item.drive.sourceEntityCode)}
          </span>
          {item.drive.updatedAt && (
            <span className="text-xs text-gray-400">
              {new Date(item.drive.updatedAt).toLocaleString()}
            </span>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('totalUsers:drive.impersonateEmail')}
            </label>
            <input
              type="email"
              value={impersonateEmail}
              onChange={(e) => setImpersonateEmail(e.target.value)}
              maxLength={200}
              placeholder="service-account@domain.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('totalUsers:drive.folderId')}
            </label>
            <input
              type="text"
              value={billingRootFolderId}
              onChange={(e) => setBillingRootFolderId(e.target.value)}
              maxLength={100}
              placeholder="0AAbCd1234..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('totalUsers:drive.folderName')}
            </label>
            <input
              type="text"
              value={billingRootFolderName}
              onChange={(e) => setBillingRootFolderName(e.target.value)}
              maxLength={200}
              placeholder="Company Shared Drive"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending || updateMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('totalUsers:drive.delete')}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common:save')}
          </button>
        </div>
      </div>
    </div>
  );
}
