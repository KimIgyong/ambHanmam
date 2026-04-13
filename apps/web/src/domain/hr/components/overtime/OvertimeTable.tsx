import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Check, X, Trash2 } from 'lucide-react';
import { HrOtRecordResponse } from '@amb/types';
import { useMonthlyOtRecords, useApproveOtRecord, useDeleteOtRecord } from '../../hooks/useOvertime';
import { formatDate } from '@/lib/format-utils';

interface OvertimeTableProps {
  year: number;
  month: number;
  isAdmin: boolean;
  isManager: boolean;
  onEdit: (record: HrOtRecordResponse) => void;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function OvertimeTable({ year, month, isAdmin, isManager, onEdit }: OvertimeTableProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: summaries = [], isLoading } = useMonthlyOtRecords(year, month);
  const approveOt = useApproveOtRecord();
  const deleteOt = useDeleteOtRecord();

  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  const toggleEmployee = (employeeId: string) => {
    setExpandedEmployees((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  const handleApprove = (id: string) => {
    approveOt.mutate({ id, status: 'APPROVED' });
  };

  const handleReject = (id: string) => {
    approveOt.mutate({ id, status: 'REJECTED' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('hr:overtime.deleteConfirm'))) {
      deleteOt.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        {t('hr:overtime.noRecords')}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {summaries.map((summary) => {
        const isExpanded = expandedEmployees.has(summary.employeeId);

        return (
          <div key={summary.employeeId}>
            {/* Employee Header */}
            <button
              onClick={() => toggleEmployee(summary.employeeId)}
              className="flex w-full items-center justify-between px-6 py-3 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <span className="font-mono text-xs text-gray-500">{summary.employeeCode}</span>
                  <span className="ml-2 text-sm font-medium text-gray-900">{summary.employeeName}</span>
                  <span className="ml-2 text-xs text-gray-500">{summary.department}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  {t('hr:overtime.totalActual')}: <span className="font-medium text-gray-900">{summary.totalActualHours}h</span>
                </span>
                <span className="text-gray-500">
                  {t('hr:overtime.totalConverted')}: <span className="font-medium text-teal-700">{summary.totalConvertedHours}h</span>
                </span>
              </div>
            </button>

            {/* Records Sub-table */}
            {isExpanded && (
              <div className="bg-gray-50 px-6 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        <th className="px-3 py-2">{t('hr:overtime.date')}</th>
                        <th className="px-3 py-2">{t('hr:overtime.timeStart')} - {t('hr:overtime.timeEnd')}</th>
                        <th className="px-3 py-2">{t('hr:overtime.type')}</th>
                        <th className="px-3 py-2 text-right">{t('hr:overtime.hours')}</th>
                        <th className="px-3 py-2 text-right">{t('hr:overtime.converted')}</th>
                        <th className="px-3 py-2">{t('hr:overtime.status')}</th>
                        <th className="px-3 py-2 text-right">{t('common:actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {summary.records.map((record) => (
                        <tr
                          key={record.otRecordId}
                          onClick={() => onEdit(record)}
                          className="cursor-pointer transition-colors hover:bg-white"
                        >
                          <td className="px-3 py-2 text-gray-900">{formatDate(record.date)}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {record.timeStart} - {record.timeEnd}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {t(`hr:overtime.otType.${record.otType}`)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900">{record.actualHours}</td>
                          <td className="px-3 py-2 text-right font-medium text-teal-700">
                            {record.convertedHours}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[record.approvalStatus] || 'bg-gray-100 text-gray-600'}`}
                            >
                              {t(`hr:overtime.approval.${record.approvalStatus}`)}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              {(isAdmin || isManager) && record.approvalStatus === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(record.otRecordId)}
                                    title={t('hr:overtime.approve')}
                                    className="rounded p-1 text-green-600 hover:bg-green-50"
                                  >
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(record.otRecordId)}
                                    title={t('hr:overtime.reject')}
                                    className="rounded p-1 text-red-600 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(record.otRecordId)}
                                  title={t('common:delete')}
                                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
