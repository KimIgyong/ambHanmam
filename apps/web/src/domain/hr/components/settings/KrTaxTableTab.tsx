import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  useTaxTableSummary,
  useTaxTableByYear,
  useImportTaxTable,
  useDeleteTaxTable,
} from '../../hooks/useKrSettings';

interface KrTaxTableTabProps {
  isAdmin: boolean;
}

export default function KrTaxTableTab({ isAdmin }: KrTaxTableTabProps) {
  const { t } = useTranslation(['hr', 'common']);
  const { data: summaries = [], isLoading } = useTaxTableSummary();
  const importMutation = useImportTaxTable();
  const deleteMutation = useDeleteTaxTable();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [importYear, setImportYear] = useState(new Date().getFullYear());
  const [page, setPage] = useState(1);

  const { data: tableData } = useTaxTableByYear(expandedYear || 0, page);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    importMutation.mutate(
      { year: importYear, csvContent: text },
      {
        onSuccess: (result) => {
          alert(`${result.importedCount} records imported.`);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      },
    );
  };

  const handleDelete = (year: number) => {
    if (confirm(t('hr:settings.deleteConfirm'))) {
      deleteMutation.mutate(year);
    }
  };

  const formatNumber = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{t('hr:kr.taxTable.title')}</h3>
      </div>

      {/* CSV Import */}
      {isAdmin && (
        <div className="flex items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.taxTable.year')}</label>
            <input
              type="number"
              value={importYear}
              onChange={(e) => setImportYear(Number(e.target.value))}
              className="w-24 rounded border border-gray-300 px-2 py-1.5 text-xs"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:kr.taxTable.import')}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-teal-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-teal-700"
            />
          </div>
          {importMutation.isPending && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600" />
          )}
        </div>
      )}

      {/* Summary list */}
      {summaries.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">{t('hr:kr.taxTable.empty')}</div>
      ) : (
        <div className="space-y-2">
          {summaries.map((s) => (
            <div key={s.year} className="rounded-lg border border-gray-200">
              <div
                className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-gray-50"
                onClick={() => {
                  setExpandedYear(expandedYear === s.year ? null : s.year);
                  setPage(1);
                }}
              >
                <div className="flex items-center gap-2">
                  {expandedYear === s.year ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">{s.year}</span>
                  <span className="text-xs text-gray-400">
                    {formatNumber(s.rowCount)} {t('hr:kr.taxTable.records')} / {formatNumber(s.salaryRangeCount)} {t('hr:kr.taxTable.ranges')}
                  </span>
                </div>
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.year); }}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {expandedYear === s.year && tableData && (
                <div className="border-t border-gray-200 px-4 py-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-left font-medium uppercase text-gray-500">
                        <tr>
                          <th className="px-2 py-1.5">{t('hr:kr.taxTable.salaryRange')}</th>
                          <th className="px-2 py-1.5 text-center">{t('hr:kr.taxTable.dependents')}</th>
                          <th className="px-2 py-1.5 text-right">{t('hr:kr.taxTable.taxAmount')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tableData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5 font-mono">
                              {formatNumber(row.salaryFrom)} ~ {formatNumber(row.salaryTo)}
                            </td>
                            <td className="px-2 py-1.5 text-center">{row.dependents}</td>
                            <td className="px-2 py-1.5 text-right font-mono">{formatNumber(row.taxAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {tableData.total > 50 && (
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatNumber(tableData.total)} {t('hr:kr.taxTable.totalRecords')}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="rounded border px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
                        >
                          {t('hr:timesheet.prevMonth')}
                        </button>
                        <span className="px-2 py-1">{page} / {Math.ceil(tableData.total / 50)}</span>
                        <button
                          onClick={() => setPage(page + 1)}
                          disabled={page >= Math.ceil(tableData.total / 50)}
                          className="rounded border px-2 py-1 hover:bg-gray-100 disabled:opacity-50"
                        >
                          {t('hr:timesheet.nextMonth')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
