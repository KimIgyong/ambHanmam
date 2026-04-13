import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useEntitiesDriveSettings } from '../hooks/useAdmin';
import type { EntityDriveSettingsItem } from '../service/admin.service';
import DriveSettingsEditModal from './DriveSettingsEditModal';

export default function EntityDriveSettingsTab() {
  const { t } = useTranslation(['totalUsers']);
  const { data, isLoading } = useEntitiesDriveSettings();
  const [selectedItem, setSelectedItem] = useState<EntityDriveSettingsItem | null>(null);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
        <p className="text-sm font-medium text-gray-500">{t('totalUsers:noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.entityName')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.entityCode')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:drive.configured')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:drive.source')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:drive.impersonateEmail')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:drive.rootFolder')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => {
              return (
                <tr key={item.entityId} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedItem(item)}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-violet-600 hover:underline">{item.entityName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-violet-600 hover:underline">{item.entityCode}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {item.drive.configured ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-300" />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${sourceColor(item.drive.source)}`}>
                      {sourceLabel(item.drive.source, item.drive.sourceEntityCode)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {item.drive.impersonateEmail || '-'}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-600">
                    <span title={item.drive.billingRootFolderName || ''}>
                      {item.drive.billingRootFolderName || '-'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedItem && (
        <DriveSettingsEditModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
