import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users, Loader2 } from 'lucide-react';
import MyCellIcon from '@/components/common/icons/MyCellIcon';
import { useAllToday, useOrganizationUnits, useOrganizationCells } from '../hooks/useMyToday';
import TeamTodayPanel from './TeamTodayPanel';
import TodayAttendanceBadge from './TodayAttendanceBadge';
import type { MemberTodaySummary } from '../service/today.service';

type OrgSubTab = 'unit' | 'cell';

export default function OrgTodayPanel() {
  const { t } = useTranslation('today');
  const { data: allTodayData, isLoading } = useAllToday();
  const { data: rawUnits } = useOrganizationUnits();
  const { data: rawCells } = useOrganizationCells();
  const [subTab, setSubTab] = useState<OrgSubTab>('unit');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedCellIds, setSelectedCellIds] = useState<string[]>([]);

  // API 필드명 매핑: name → unitName / cellName
  const units: UnitInfo[] = useMemo(
    () => (rawUnits ?? []).map((u: any) => ({ unitId: u.unitId, unitName: u.name || u.unitName || '' })),
    [rawUnits],
  );
  const cells: CellInfo[] = useMemo(
    () => (rawCells ?? []).map((c: any) => ({ cellId: c.cellId, cellName: c.name || c.cellName || '' })),
    [rawCells],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 서브탭: [부서] [셀] */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setSubTab('unit')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            subTab === 'unit'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="h-4 w-4" />
          {t('org.unitTab')}
        </button>
        <button
          onClick={() => setSubTab('cell')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            subTab === 'cell'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MyCellIcon size={16} />
          {t('org.cellTab')}
        </button>
      </div>

      {/* 서브탭 콘텐츠 */}
      {subTab === 'unit' ? (
        <UnitSection
          units={units}
          members={allTodayData?.members ?? []}
          selectedUnitId={selectedUnitId}
          onSelectUnit={setSelectedUnitId}
        />
      ) : (
        <CellSection
          cells={cells}
          members={allTodayData?.members ?? []}
          selectedCellIds={selectedCellIds}
          onToggleCell={(id) => {
            setSelectedCellIds((prev) =>
              prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
            );
          }}
          onClearSelection={() => setSelectedCellIds([])}
        />
      )}
    </div>
  );
}

/* ── UnitSection ── */

interface UnitInfo {
  unitId: string;
  unitName: string;
}

function UnitSection({
  units,
  members,
  selectedUnitId,
  onSelectUnit,
}: {
  units: UnitInfo[];
  members: MemberTodaySummary[];
  selectedUnitId: string | null;
  onSelectUnit: (id: string | null) => void;
}) {
  const { t } = useTranslation('today');

  const unitGroups = useMemo(() => {
    const groups = new Map<string, { unitName: string; members: MemberTodaySummary[] }>();
    for (const u of units) {
      groups.set(u.unitId, { unitName: u.unitName, members: [] });
    }
    for (const m of members) {
      if (m.unitName) {
        const unit = units.find((u) => u.unitName === m.unitName);
        if (unit && groups.has(unit.unitId)) {
          groups.get(unit.unitId)!.members.push(m);
        }
      }
    }
    return groups;
  }, [units, members]);

  const filteredData = useMemo(() => {
    if (!selectedUnitId) return undefined;
    const group = unitGroups.get(selectedUnitId);
    if (!group) return undefined;
    return {
      members: group.members,
      summary: {
        totalMembers: group.members.length,
        totalTodayDue: group.members.reduce((s, m) => s + m.todayDueCount, 0),
        totalOverdue: group.members.reduce((s, m) => s + m.overdueCount, 0),
        totalInProgress: group.members.reduce((s, m) => s + m.inProgressCount, 0),
        totalIssues: group.members.reduce((s, m) => s + m.issueCount, 0),
      },
    };
  }, [selectedUnitId, unitGroups]);

  return (
    <div className="space-y-4">
      {/* 부서 칩 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectUnit(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !selectedUnitId
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('org.allUnits')}
        </button>
        {units.map((u) => {
          const count = unitGroups.get(u.unitId)?.members.length ?? 0;
          return (
            <button
              key={u.unitId}
              onClick={() => onSelectUnit(u.unitId === selectedUnitId ? null : u.unitId)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedUnitId === u.unitId
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {u.unitName} ({count})
            </button>
          );
        })}
      </div>

      {/* 부서 카드 뷰 or 멤버 리스트 */}
      {selectedUnitId && filteredData ? (
        <TeamTodayPanel data={filteredData} isLoading={false} />
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((u) => {
            const group = unitGroups.get(u.unitId);
            const memberList = group?.members ?? [];
            const memberCount = memberList.length;
            return (
              <button
                key={u.unitId}
                onClick={() => onSelectUnit(u.unitId)}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">{u.unitName}</h3>
                </div>
                <div className="mb-2 text-sm text-gray-500">
                  <p>
                    <Users className="inline h-3.5 w-3.5 mr-1" />
                    {t('org.members')}: {memberCount}
                  </p>
                </div>
                {memberList.length > 0 && (
                  <div className="space-y-1 border-t border-gray-100 pt-2">
                    {memberList.map((m) => (
                      <div key={m.userId} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate">{m.userName}</span>
                        <TodayAttendanceBadge type={m.todayAttendanceType || 'OFFICE'} approval={m.todayAttendanceApproval} size="sm" showWork />
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── CellSection ── */

interface CellInfo {
  cellId: string;
  cellName: string;
}

function CellSection({
  cells,
  members,
  selectedCellIds,
  onToggleCell,
  onClearSelection,
}: {
  cells: CellInfo[];
  members: MemberTodaySummary[];
  selectedCellIds: string[];
  onToggleCell: (id: string) => void;
  onClearSelection: () => void;
}) {
  const { t } = useTranslation('today');

  const cellMemberMap = useMemo(() => {
    const map = new Map<string, MemberTodaySummary[]>();
    for (const c of cells) {
      map.set(c.cellId, []);
    }
    for (const m of members) {
      for (const cid of m.cellIds ?? []) {
        if (map.has(cid)) {
          map.get(cid)!.push(m);
        }
      }
    }
    return map;
  }, [cells, members]);

  const filteredData = useMemo(() => {
    if (selectedCellIds.length === 0) return undefined;
    const seen = new Set<string>();
    const filtered: MemberTodaySummary[] = [];
    for (const cid of selectedCellIds) {
      for (const m of cellMemberMap.get(cid) ?? []) {
        if (!seen.has(m.userId)) {
          seen.add(m.userId);
          filtered.push(m);
        }
      }
    }
    return {
      members: filtered,
      summary: {
        totalMembers: filtered.length,
        totalTodayDue: filtered.reduce((s, m) => s + m.todayDueCount, 0),
        totalOverdue: filtered.reduce((s, m) => s + m.overdueCount, 0),
        totalInProgress: filtered.reduce((s, m) => s + m.inProgressCount, 0),
        totalIssues: filtered.reduce((s, m) => s + m.issueCount, 0),
      },
    };
  }, [selectedCellIds, cellMemberMap]);

  return (
    <div className="space-y-4">
      {/* 셀 칩 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onClearSelection}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selectedCellIds.length === 0
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('org.allCells')}
        </button>
        {cells.map((c) => {
          const count = cellMemberMap.get(c.cellId)?.length ?? 0;
          return (
            <button
              key={c.cellId}
              onClick={() => onToggleCell(c.cellId)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCellIds.includes(c.cellId)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.cellName} ({count})
            </button>
          );
        })}
      </div>

      {/* 셀 선택 시 멤버 리스트, 미선택 시 카드 그리드 */}
      {selectedCellIds.length > 0 && filteredData ? (
        <TeamTodayPanel data={filteredData} isLoading={false} />
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cells.map((c) => {
            const cellMembers = cellMemberMap.get(c.cellId) ?? [];
            return (
              <button
                key={c.cellId}
                onClick={() => onToggleCell(c.cellId)}
                className="rounded-xl border border-gray-200 bg-white p-4 text-left hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MyCellIcon size={20} className="text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">{c.cellName}</h3>
                </div>
                <div className="mb-2 text-sm text-gray-500">
                  <p>
                    <Users className="inline h-3.5 w-3.5 mr-1" />
                    {t('org.members')}: {cellMembers.length}
                  </p>
                </div>
                {cellMembers.length > 0 && (
                  <div className="space-y-1 border-t border-gray-100 pt-2">
                    {cellMembers.map((m) => (
                      <div key={m.userId} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 truncate">{m.userName}</span>
                        <TodayAttendanceBadge type={m.todayAttendanceType || 'OFFICE'} approval={m.todayAttendanceApproval} size="sm" showWork />
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
