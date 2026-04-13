import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, Landmark, Star, CalendarDays, Users, FileText, Plus, ChevronRight, Clock } from 'lucide-react';
import { useMyProfile } from '../hooks/useMyPage';
import { useMyLeaveBalance } from '../../hr/hooks/useLeaveRequest';
import ProfileSection from '../components/ProfileSection';
import PasswordChangeSection from '../components/PasswordChangeSection';
import TimezoneSection from '../components/TimezoneSection';
import { useExpenseRequestList } from '../../expense-request/hooks/useExpenseRequest';
import ExpenseStatusBadge from '../../expense-request/components/ExpenseStatusBadge';
import PageTitle from '@/global/components/PageTitle';

export default function MyPage() {
  const { t } = useTranslation(['myPage', 'expenseRequest', 'common']);
  const navigate = useNavigate();
  const { data: profile, isLoading } = useMyProfile();
  const currentYear = new Date().getFullYear();
  const { data: leaveBalance } = useMyLeaveBalance(currentYear);
  const { data: expenseData } = useExpenseRequestList({ view: 'my' });
  const myExpenseRaw = (expenseData as { data?: unknown } | undefined)?.data;
  const myExpenseList = Array.isArray(myExpenseRaw)
    ? myExpenseRaw
    : Array.isArray((myExpenseRaw as { data?: unknown[] } | undefined)?.data)
      ? ((myExpenseRaw as { data?: unknown[] }).data ?? [])
      : [];
  const myExpenses = myExpenseList.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        {t('common:loading')}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        {t('common:error')}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <PageTitle>{t('myPage:title')}</PageTitle>
          <p className="mt-1 text-sm text-gray-500">{t('myPage:subtitle')}</p>
        </div>

        <div className="space-y-6">
          {/* Profile Info */}
          <ProfileSection profile={profile} />

          {/* Quick Link Cards */}
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/attendance')}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50"
            >
              <Clock className="h-7 w-7 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">{t('myPage:quickLinks.attendance')}</span>
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-green-300 hover:bg-green-50"
            >
              <CalendarDays className="h-7 w-7 text-green-500" />
              <span className="text-sm font-medium text-gray-700">{t('myPage:quickLinks.leaveRequests')}</span>
            </button>
            <button
              onClick={() => navigate('/expense-requests')}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-violet-300 hover:bg-violet-50"
            >
              <FileText className="h-7 w-7 text-violet-500" />
              <span className="text-sm font-medium text-gray-700">{t('myPage:quickLinks.expenseRequests')}</span>
            </button>
          </div>

          {/* Leave Balance */}
          {leaveBalance && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">{t('myPage:leave.title')}</h2>
                <span className="ml-auto text-sm text-gray-400">{currentYear}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <p className="text-xs text-gray-500">{t('myPage:leave.entitlement')}</p>
                  <p className="mt-1 text-xl font-bold text-blue-600">{leaveBalance.entitlement}</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 text-center">
                  <p className="text-xs text-gray-500">{t('myPage:leave.used')}</p>
                  <p className="mt-1 text-xl font-bold text-orange-600">{leaveBalance.used}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3 text-center">
                  <p className="text-xs text-gray-500">{t('myPage:leave.remaining')}</p>
                  <p className="mt-1 text-xl font-bold text-green-600">{leaveBalance.remaining}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500">{t('myPage:leave.carryForward')}</p>
                  <p className="mt-1 text-xl font-bold text-gray-600">{leaveBalance.carryForward}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                {t('myPage:leave.yearsOfService', { years: leaveBalance.yearsOfService })}
              </div>
            </div>
          )}

          {/* Expense Requests */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">{t('myPage:expense.title')}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/expense-requests')}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('myPage:expense.viewAll')}
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/expense-requests/new')}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('myPage:expense.register')}
                </button>
              </div>
            </div>
            {myExpenses.length === 0 ? (
              <p className="text-sm text-gray-400">{t('myPage:expense.noRequests')}</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('expenseRequest:common.requestNumber')}</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('expenseRequest:form.title')}</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">{t('myPage:expense.amount')}</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">{t('myPage:expense.status')}</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('expenseRequest:common.createdAt')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {myExpenses.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/expense-requests/${item.id}`)}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{item.requestNumber}</td>
                        <td className="px-4 py-2.5 text-gray-900 font-medium max-w-[180px] truncate">{item.title}</td>
                        <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{Number(item.totalAmount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center">
                          <ExpenseStatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Entities */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-900">{t('myPage:entities.title')}</h2>
            </div>
            {profile.entities.length === 0 ? (
              <p className="text-sm text-gray-400">{t('myPage:entities.noEntities')}</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('myPage:entities.name')}</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('myPage:entities.code')}</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('myPage:entities.country')}</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('myPage:entities.role')}</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('myPage:entities.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profile.entities.map((entity) => (
                      <tr key={entity.entityId}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{entity.entityName}</td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {entity.entityCode}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{entity.country}</td>
                        <td className="px-4 py-2.5 text-gray-600">{t(`myPage:roles.${entity.role}`, { defaultValue: entity.role })}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            entity.status === 'ACTIVE'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {entity.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Units */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-gray-900">{t('myPage:units.title')}</h2>
            </div>
            {profile.units.length === 0 ? (
              <p className="text-sm text-gray-400">{t('myPage:units.noUnits')}</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('myPage:units.name')}</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('myPage:units.role')}</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">{t('myPage:units.isPrimary')}</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('myPage:units.entityName')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profile.units.map((unit) => (
                      <tr key={unit.unitId}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{unit.unitName}</td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {t(`myPage:units.roles.${unit.role}`, { defaultValue: unit.role })}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {unit.isPrimary && <Star className="mx-auto h-4 w-4 text-amber-400" />}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{unit.entityName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cells */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-gray-900">{t('myPage:cells.title')}</h2>
            </div>
            {!profile.cells || profile.cells.length === 0 ? (
              <p className="text-sm text-gray-400">{t('myPage:cells.noCells')}</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('myPage:cells.name')}</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">{t('myPage:cells.entityName')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profile.cells.map((cell) => (
                      <tr key={cell.cellId}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{cell.cellName}</td>
                        <td className="px-4 py-2.5 text-gray-600">{cell.entityName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Password Change */}
          <PasswordChangeSection />

          {/* Timezone & Language */}
          <TimezoneSection />
        </div>
      </div>
    </div>
  );
}
