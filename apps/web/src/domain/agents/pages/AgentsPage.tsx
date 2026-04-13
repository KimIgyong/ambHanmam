import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import { UNITS } from '@/global/constant/unit.constant';
import { useMyPermissions } from '@/domain/settings/hooks/useMenuPermissions';
import PageTitle from '@/global/components/PageTitle';

export default function AgentsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['agents', 'units']);
  const { data: accessibleMenus } = useMyPermissions();

  const accessibleDepts = UNITS.filter((dept) => {
    if (!accessibleMenus) return true;
    const menuCode = `CHAT_${dept.code}`;
    return accessibleMenus.includes(menuCode);
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
        <div className="mb-6">
          <PageTitle>{t('agents:title')}</PageTitle>
          <p className="mt-1 text-sm text-gray-500">{t('agents:subtitle')}</p>
        </div>

        {accessibleDepts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
            {t('agents:noAccess')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accessibleDepts.map((dept) => {
              const Icon = dept.icon;
              return (
                <button
                  key={dept.code}
                  onClick={() => navigate(`/chat/${dept.code}`)}
                  className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 text-left transition-all hover:border-indigo-300 hover:shadow-lg"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${dept.bgColor}`}>
                    <Icon className={`h-6 w-6 ${dept.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                    {t(`units:${dept.nameKey}`)}
                  </h3>
                  <p className="mt-1 flex-1 text-sm text-gray-500">
                    {t(`units:${dept.descriptionKey}`)}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{t('agents:startChat')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
