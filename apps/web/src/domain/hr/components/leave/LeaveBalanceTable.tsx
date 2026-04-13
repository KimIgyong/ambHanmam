import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { HrLeaveBalanceResponse } from '@amb/types';
import { useLeaveBalances } from '../../hooks/useLeave';
import { formatDate } from '@/lib/format-utils';

interface LeaveBalanceTableProps {
  year: number;
  isAdmin: boolean;
  onRowClick: (employeeId: string) => void;
}

type SortField = keyof Pick<
  HrLeaveBalanceResponse,
  'employeeCode' | 'employeeName' | 'department' | 'startDate' | 'yearsOfService' | 'entitlement' | 'used' | 'carryForward' | 'remaining'
>;

type SortDir = 'asc' | 'desc';

export default function LeaveBalanceTable({ year, isAdmin: _isAdmin, onRowClick }: LeaveBalanceTableProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: balances = [], isLoading } = useLeaveBalances(year);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('employeeCode');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return balances;
    return balances.filter(
      (b) =>
        b.employeeName.toLowerCase().includes(q) ||
        b.employeeCode.toLowerCase().includes(q),
    );
  }, [balances, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const dir = sortDir === 'asc' ? 1 : -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * dir;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * dir;
      }
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const getRemainingColor = (remaining: number) => {
    if (remaining <= 0) return 'text-red-600 font-semibold';
    if (remaining <= 5) return 'text-yellow-600 font-semibold';
    return 'text-green-600 font-semibold';
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="h-3 w-3 text-gray-300" />;
    }
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-teal-600" />
    ) : (
      <ChevronDown className="h-3 w-3 text-teal-600" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  const columns: Array<{ field: SortField; label: string; align?: 'right' }> = [
    { field: 'employeeCode', label: t('hr:leave.table.code') },
    { field: 'employeeName', label: t('hr:leave.table.name') },
    { field: 'department', label: t('hr:leave.table.department') },
    { field: 'startDate', label: t('hr:leave.table.startDate') },
    { field: 'yearsOfService', label: t('hr:leave.table.yearsOfService'), align: 'right' },
    { field: 'entitlement', label: t('hr:leave.table.entitlement'), align: 'right' },
    { field: 'used', label: t('hr:leave.table.used'), align: 'right' },
    { field: 'carryForward', label: t('hr:leave.table.carryForward'), align: 'right' },
    { field: 'remaining', label: t('hr:leave.table.remaining'), align: 'right' },
  ];

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('hr:leave.search')}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          {t('hr:leave.noEmployees')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {columns.map((col) => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIcon field={col.field} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((balance) => (
                <tr
                  key={balance.leaveBalanceId}
                  onClick={() => onRowClick(balance.employeeId)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                    {balance.employeeCode}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                    {balance.employeeName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {balance.department}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {formatDate(balance.startDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
                    {balance.yearsOfService}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
                    {balance.entitlement}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
                    {balance.used}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-gray-900">
                    {balance.carryForward}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right ${getRemainingColor(balance.remaining)}`}>
                    {balance.remaining}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
