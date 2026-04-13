import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Check, X, AlertTriangle, Cpu, Zap, MessageSquare, Settings2 } from 'lucide-react';
import { useAgentConfigs, useUpdateAgentConfig } from '../hooks/useAgentConfigs';
import { UNITS } from '@/global/constant/unit.constant';
import AgentConfigEditModal from '../components/AgentConfigEditModal';
import { LocalDateTime } from '@/components/common/LocalDateTime';

// 전용 AI 에이전트가 구현된 부서 코드
const DEDICATED_AGENT_CODES = ['LEGAL', 'ACCOUNTING', 'TRANSLATION', 'PM', 'DEVELOPMENT'];

// 부서 코드 → CHAT_* 메뉴 코드 매핑 (null이면 권한 코드 미구현)
const DEPT_CHAT_CODE_MAP: Record<string, string | null> = {
  LEGAL: 'CHAT_LEGAL',
  ACCOUNTING: 'CHAT_ACCOUNTING',
  TRANSLATION: null,
  PM: null,
  DEVELOPMENT: null,
  MANAGEMENT: 'CHAT_MANAGEMENT',
  HR: 'CHAT_HR',
  SALES: 'CHAT_SALES',
  IT: 'CHAT_IT',
  MARKETING: 'CHAT_MARKETING',
  GENERAL_AFFAIRS: 'CHAT_GENERAL_AFFAIRS',
  PLANNING: 'CHAT_PLANNING',
};

type TabType = 'chat' | 'prompt';

export default function AgentSettingsPage() {
  const { t } = useTranslation(['common', 'units']);
  const { data: configs, isLoading } = useAgentConfigs();
  const updateMutation = useUpdateAgentConfig();
  const [editingDeptCode, setEditingDeptCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  const handleToggleActive = async (deptCode: string, currentIsActive: boolean) => {
    if (deptCode === 'TRANSLATION') return;
    setTogglingCode(deptCode);
    try {
      const config = (configs as any[])?.find((c: any) => c.unitCode === deptCode);
      await updateMutation.mutateAsync({
        deptCode,
        dto: {
          system_prompt: config?.systemPrompt || '',
          description: config?.description || '',
          is_active: !currentIsActive,
          visible_cell_ids: config?.visibleCellIds ?? null,
        },
      });
    } finally {
      setTogglingCode(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        {t('common:loadingText')}
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: typeof Bot }[] = [
    { key: 'chat', label: t('common:settingsPage.chatAgents.title'), icon: MessageSquare },
    { key: 'prompt', label: t('common:settingsPage.agents.title'), icon: Settings2 },
  ];

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <Bot className="h-6 w-6 text-indigo-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('common:settingsPage.chatAgents.pageTitle')}</h1>
          <p className="text-sm text-gray-500">{t('common:settingsPage.chatAgents.pageDescription')}</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 채팅 에이전트 관리 탭 */}
      {activeTab === 'chat' && (
        <div className="space-y-2">
          {/* 불일치 경고 배너 */}
          {UNITS.some((d) => DEDICATED_AGENT_CODES.includes(d.code) && !DEPT_CHAT_CODE_MAP[d.code]) && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">{t('common:settingsPage.chatAgents.warningTitle')}</p>
                <p className="mt-0.5 text-amber-700">{t('common:settingsPage.chatAgents.warningDescription')}</p>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t('common:settingsPage.chatAgents.colDepartment')}</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">{t('common:settingsPage.chatAgents.colAiType')}</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">{t('common:settingsPage.chatAgents.colChatCode')}</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">{t('common:settingsPage.chatAgents.colStatus')}</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">{t('common:settingsPage.chatAgents.colActive')}</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">{t('common:settingsPage.chatAgents.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {UNITS.map((dept) => {
                  const Icon = dept.icon;
                  const config = (configs as any[])?.find((c: any) => c.unitCode === dept.code);
                  const isDedicated = DEDICATED_AGENT_CODES.includes(dept.code);
                  const chatCode = DEPT_CHAT_CODE_MAP[dept.code];
                  const isActive = dept.code === 'TRANSLATION' ? true : config?.isActive !== false;
                  const isToggling = togglingCode === dept.code;

                  return (
                    <tr key={dept.code} className="hover:bg-gray-50">
                      {/* 부서명 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-lg p-1.5 ${dept.bgColor}`}>
                            <Icon className={`h-4 w-4 ${dept.color}`} />
                          </div>
                          <span className="font-medium text-gray-900">{t(`units:${dept.nameKey}`)}</span>
                        </div>
                      </td>

                      {/* AI 유형 */}
                      <td className="px-4 py-3 text-center">
                        {isDedicated ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            <Cpu className="h-3 w-3" />{t('common:settingsPage.chatAgents.dedicated')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                            <Zap className="h-3 w-3" />{t('common:settingsPage.chatAgents.general')}
                          </span>
                        )}
                      </td>

                      {/* CHAT_* 권한 코드 */}
                      <td className="px-4 py-3 text-center">
                        {chatCode ? (
                          <span className="rounded bg-green-50 px-1.5 py-0.5 font-mono text-xs text-green-700">{chatCode}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <AlertTriangle className="h-3 w-3" />{t('common:settingsPage.chatAgents.noCode')}
                          </span>
                        )}
                      </td>

                      {/* 상태 */}
                      <td className="px-4 py-3 text-center">
                        {dept.code === 'TRANSLATION' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                            <Check className="h-3 w-3" />{t('common:settingsPage.chatAgents.alwaysOn')}
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            <Check className="h-3 w-3" />Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            <X className="h-3 w-3" />Inactive
                          </span>
                        )}
                      </td>

                      {/* 활성화 토글 */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleActive(dept.code, isActive)}
                          disabled={dept.code === 'TRANSLATION' || isToggling}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
                            isActive ? 'bg-indigo-600' : 'bg-gray-300'
                          } ${dept.code === 'TRANSLATION' ? 'opacity-60' : ''}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              isActive ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </td>

                      {/* 설정 버튼 */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setEditingDeptCode(dept.code)}
                          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          {t('common:edit')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 범례 */}
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
            <span className="font-medium text-gray-600">{t('common:settingsPage.chatAgents.legend')}:</span>
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3 text-indigo-600" />{t('common:settingsPage.chatAgents.dedicated')} — {t('common:settingsPage.chatAgents.legendDedicated')}
            </span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3 w-3 text-gray-400" />{t('common:settingsPage.chatAgents.general')} — {t('common:settingsPage.chatAgents.legendGeneral')}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />{t('common:settingsPage.chatAgents.legendNoCode')}
            </span>
          </div>
        </div>
      )}

      {/* 에이전트 프롬프트 설정 탭 */}
      {activeTab === 'prompt' && (
        <div className="space-y-3">
          {UNITS.map((dept) => {
            const config = (configs as any[])?.find((c: any) => c.unitCode === dept.code);
            const Icon = dept.icon;
            const isActive = dept.code === 'TRANSLATION' ? true : config?.isActive !== false;

            return (
              <div key={dept.code} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${dept.bgColor}`}>
                      <Icon className={`h-5 w-5 ${dept.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {t(`units:${dept.nameKey}`)} Agent
                        </h3>
                        {dept.code === 'TRANSLATION' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                            <Check className="h-3 w-3" />{t('common:settingsPage.chatAgents.alwaysOn')}
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                            <Check className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            <X className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{t(`units:${dept.descriptionKey}`)}</p>
                      {config?.updatedAt && (
                        <p className="mt-1 text-xs text-gray-400">
                          Last updated: {<LocalDateTime value={config.updatedAt} format='YYYY-MM-DD HH:mm' />}
                          {config.updatedBy && ` by ${config.updatedBy.name}`}
                        </p>
                      )}
                      {!config?.hasCustomPrompt && (
                        <p className="mt-1 text-xs text-gray-400">Using default prompt</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingDeptCode(dept.code)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t('common:edit')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingDeptCode && (
        <AgentConfigEditModal
          deptCode={editingDeptCode}
          onClose={() => setEditingDeptCode(null)}
        />
      )}
    </div>
  );
}
