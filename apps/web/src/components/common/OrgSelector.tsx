import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useOrgStore } from '@/domain/auth/store/org.store';
import { useTranslation } from 'react-i18next';

/**
 * HQ 사용자 전용: 조직 선택 드롭다운
 * - HQ 소속이 아니면 렌더링하지 않음
 * - "전체 조직" 선택 시 전체 데이터 노출
 */
export default function OrgSelector() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { organizations, selectedOrgId, setSelectedOrg } = useOrgStore();

  // HQ 소속이 아니면 렌더링하지 않음
  if (!user?.isHq) return null;

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {t('common.organization', 'Organization')}:
      </label>
      <select
        value={selectedOrgId ?? 'ALL'}
        onChange={(e) => setSelectedOrg(e.target.value === 'ALL' ? null : e.target.value)}
        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
      >
        <option value="ALL">{t('common.allOrganizations', 'All Organizations')}</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name} ({org.code})
          </option>
        ))}
      </select>
    </div>
  );
}
