import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Calendar, Clock, CalendarOff, Calculator,
  UserMinus, FileBarChart, Settings, LucideIcon, UserCheck, DollarSign, CalendarCheck,
  ClipboardCheck,
} from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useEntityStore } from '../store/entity.store';
import PageTitle from '@/global/components/PageTitle';

interface HrSubMenu {
  labelKey: string;
  path: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  krOnly?: boolean;
}

const HR_SUB_MENUS: HrSubMenu[] = [
  { labelKey: 'hr:menu.employees', path: '/hr/employees', icon: Users },
  { labelKey: 'hr:menu.freelancers', path: '/hr/freelancers', icon: UserCheck, krOnly: true },
  { labelKey: 'hr:menu.businessIncome', path: '/hr/business-income', icon: DollarSign, krOnly: true },
  { labelKey: 'hr:menu.yearend', path: '/hr/yearend', icon: CalendarCheck, krOnly: true },
  { labelKey: 'hr:menu.timesheet', path: '/hr/timesheet', icon: Calendar },
  { labelKey: 'hr:menu.overtime', path: '/hr/overtime', icon: Clock },
  { labelKey: 'hr:menu.leave', path: '/hr/leave', icon: CalendarOff },
  { labelKey: 'hr:menu.leaveRequests', path: '/hr/leave-requests', icon: ClipboardCheck },
  { labelKey: 'hr:menu.payroll', path: '/hr/payroll', icon: Calculator },
  { labelKey: 'hr:menu.severance', path: '/hr/severance', icon: UserMinus },
  { labelKey: 'hr:menu.reports', path: '/hr/reports', icon: FileBarChart },
  { labelKey: 'hr:menu.settings', path: '/hr/settings', icon: Settings, adminOnly: true },
];

export default function HrLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const isKrEntity = currentEntity?.country === 'KR';

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const visibleMenus = HR_SUB_MENUS.filter(
    (m) => (!m.adminOnly || isAdmin) && (!m.krOnly || isKrEntity),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 페이지 타이틀 - 탭 위 */}
      <div className="shrink-0 bg-white px-6 pt-6 pb-2">
        <PageTitle>{t('hr:title', { defaultValue: 'Human Resources' })}</PageTitle>
      </div>

      {/* 수평 탭메뉴 */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex overflow-x-auto px-6">
          {visibleMenus.map((menu) => {
            const Icon = menu.icon;
            const active = isActive(menu.path);
            return (
              <button
                key={menu.path}
                onClick={() => navigate(menu.path)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? 'border-indigo-600 font-medium text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(menu.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
