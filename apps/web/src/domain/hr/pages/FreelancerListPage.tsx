import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Users, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useFreelancerList, useDeleteFreelancer } from '../hooks/useFreelancer';

export default function FreelancerListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const { data: freelancers = [], isLoading } = useFreelancerList();
  const deleteMutation = useDeleteFreelancer();

  const [search, setSearch] = useState('');

  const filtered = freelancers.filter(
    (f) =>
      f.fullName.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = (id: string) => {
    if (confirm(t('hr:kr.freelancer.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ko-KR').format(amount);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-teal-500" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('hr:kr.freelancer.title')}</h1>
              <p className="text-sm text-gray-500">{t('hr:kr.freelancer.subtitle')}</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate('/hr/freelancers/new')}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              {t('hr:kr.freelancer.add')}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('hr:kr.freelancer.search')}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">{t('hr:kr.freelancer.empty')}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t('hr:kr.freelancer.code')}</th>
                  <th className="px-4 py-3">{t('hr:kr.freelancer.name')}</th>
                  <th className="px-4 py-3">{t('hr:kr.freelancer.contractPeriod')}</th>
                  <th className="px-4 py-3 text-right">{t('hr:kr.freelancer.monthlyAmount')}</th>
                  <th className="px-4 py-3">{t('hr:kr.freelancer.taxRate')}</th>
                  <th className="px-4 py-3">{t('hr:employee.form.status')}</th>
                  {isAdmin && <th className="px-4 py-3 w-20" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((f) => (
                  <tr
                    key={f.freelancerId}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/hr/freelancers/${f.freelancerId}`)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{f.code}</td>
                    <td className="px-4 py-3">{f.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {f.contractStart && f.contractEnd
                        ? `${f.contractStart} ~ ${f.contractEnd}`
                        : f.contractStart || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatAmount(f.monthlyAmount)}</td>
                    <td className="px-4 py-3">{f.taxRate}%</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        f.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : f.status === 'COMPLETED'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        {t(`hr:kr.freelancer.status.${f.status.toLowerCase()}`)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(f.freelancerId); }}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
