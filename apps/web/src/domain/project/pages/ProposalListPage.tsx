import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useProjectList } from '../hooks/useProject';
import ProjectStatusBadge from '../components/ProjectStatusBadge';

const PROPOSAL_STATUSES = ['', 'DRAFT', 'SUBMITTED', 'REVIEW', 'APPROVED', 'REJECTED'];

export default function ProposalListPage() {
  const { t } = useTranslation('project');
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: projects = [], isLoading } = useProjectList({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  // Proposals = projects in DRAFT/SUBMITTED/REVIEW/APPROVED/REJECTED
  const proposalStatuses = ['DRAFT', 'SUBMITTED', 'REVIEW', 'APPROVED', 'REJECTED'];
  const proposals = projects.filter((p) => !statusFilter || proposalStatuses.includes(p.status));

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('actions.search')}
            className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {PROPOSAL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? t(`status.${s}`) : t('filter.all')}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">{t('empty.proposals')}</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('project.code')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('proposal.name')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('project.category')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('project.priority')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('project.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('project.proposer')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {proposals.map((p) => (
                <tr
                  key={p.projectId}
                  onClick={() => navigate(`/project/proposals/${p.projectId}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {p.category ? t(`category.${p.category}`) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t(`priority.${p.priority}`)}</td>
                  <td className="px-4 py-3"><ProjectStatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.proposerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
