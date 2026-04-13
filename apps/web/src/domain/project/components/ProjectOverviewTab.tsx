import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Save, X, Calendar } from 'lucide-react';
import { ProjectResponse } from '@amb/types';
import { useUpdateProject } from '../hooks/useProject';
import ProjectStatusBadge from './ProjectStatusBadge';
import ProjectMemberList from './ProjectMemberList';
import ProjectClientList from './ProjectClientList';
import AssigneeSelector from '@/domain/issues/components/AssigneeSelector';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import TranslationPanel from '@/domain/translations/components/TranslationPanel';
import ProjectCommentSection from './ProjectCommentSection';

interface ProjectOverviewTabProps {
  project: ProjectResponse;
}

export default function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  const { t } = useTranslation('project');
  const updateProject = useUpdateProject();
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(project.name);
  const [proposerId, setProposerId] = useState<string | null>(project.proposerId);
  const [managerId, setManagerId] = useState<string | null>(project.managerId);
  const [startDate, setStartDate] = useState(project.startDate || '');
  const [endDate, setEndDate] = useState(project.endDate || '');

  const handleStartEdit = () => {
    setName(project.name);
    setProposerId(project.proposerId);
    setManagerId(project.managerId);
    setStartDate(project.startDate || '');
    setEndDate(project.endDate || '');
    setEditing(true);
  };

  const handleSave = () => {
    updateProject.mutate(
      {
        id: project.projectId,
        data: {
          name,
          proposer_id: proposerId || undefined,
          manager_id: managerId || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      },
      {
        onSuccess: () => setEditing(false),
      },
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* 프로젝트 기본 정보 */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">{t('project.detail')}</h3>
            {!editing ? (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {t('actions.edit')}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={updateProject.isPending}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {t('actions.save')}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('actions.cancel')}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {/* 프로젝트 코드 */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-24 shrink-0 text-xs text-gray-500">{t('project.code')}</span>
              <span className="text-sm font-medium text-gray-900">{project.code}</span>
            </div>

            {/* 상태 */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-24 shrink-0 text-xs text-gray-500">{t('project.status')}</span>
              <ProjectStatusBadge status={project.status} />
            </div>

            {/* 프로젝트명 */}
            <div className="col-span-2 flex items-center gap-2 py-1">
              <span className="w-24 shrink-0 text-xs text-gray-500">{t('proposal.name')}</span>
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
                />
              ) : (
                <span className="text-sm font-medium">{project.name}</span>
              )}
            </div>

            {/* 카테고리 */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-24 shrink-0 text-xs text-gray-500">{t('project.category')}</span>
              <span className="text-sm font-medium">{project.category ? t(`category.${project.category}`) : '-'}</span>
            </div>

            {/* 우선순위 */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-24 shrink-0 text-xs text-gray-500">{t('project.priority')}</span>
              <span className="text-sm font-medium">{t(`priority.${project.priority}`)}</span>
            </div>

            {/* 제안자 */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-24 shrink-0 text-xs text-gray-500">{t('project.proposer')}</span>
              {editing ? (
                <div className="flex-1">
                  <AssigneeSelector value={proposerId} onChange={setProposerId} placeholder={t('member.selectUser')} />
                </div>
              ) : (
                <span className="text-sm font-medium">{project.proposerName}</span>
              )}
            </div>

            {/* PM */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-24 shrink-0 text-xs text-gray-500">{t('project.manager')}</span>
              {editing ? (
                <div className="flex-1">
                  <AssigneeSelector value={managerId} onChange={setManagerId} placeholder={t('member.selectUser')} />
                </div>
              ) : (
                <span className="text-sm font-medium">{project.managerName || '-'}</span>
              )}
            </div>

            {/* 시작일 */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-24 shrink-0 text-xs text-gray-500">{t('project.startDate')}</span>
              {editing ? (
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm font-medium">{project.startDate || '-'}</span>
              )}
            </div>

            {/* 종료일 */}
            <div className="flex items-center gap-2 py-1">
              <span className="w-24 shrink-0 text-xs text-gray-500">{t('project.endDate')}</span>
              {editing ? (
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 pl-8 pr-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm font-medium">{project.endDate || '-'}</span>
              )}
            </div>

            {/* 예산 */}
            {project.budget && (
              <div className="flex items-center gap-2 py-1">
                <span className="w-24 shrink-0 text-xs text-gray-500">{t('project.budget')}</span>
                <span className="text-sm font-medium">{Number(project.budget).toLocaleString()} {project.currency}</span>
              </div>
            )}

            {/* 승인일 */}
            {project.approvedAt && (
              <div className="flex items-center gap-2 py-1">
                <span className="w-24 shrink-0 text-xs text-gray-500">{t('status.APPROVED')}</span>
                <span className="text-sm font-medium"><LocalDateTime value={project.approvedAt} format='YYYY-MM-DD HH:mm' /></span>
              </div>
            )}
          </div>
        </div>

        {/* 요약 */}
        {project.summary && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">{t('proposal.summary')}</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.summary}</p>
            <div className="border-t mt-3 pt-3">
              <TranslationPanel
                sourceType="PROJECT"
                sourceId={project.projectId}
                sourceFields={['summary']}
                originalLang={project.originalLang || 'ko'}
                originalContent={{ summary: project.summary }}
              />
            </div>
          </div>
        )}

        {/* 비고 */}
        {project.note && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">{t('project.note')}</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.note}</p>
          </div>
        )}

        {/* 파일 */}
        {project.files && project.files.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Files</h3>
            <div className="divide-y divide-gray-100">
              {project.files.map((f) => (
                <div key={f.fileId} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.title}</p>
                    <p className="text-xs text-gray-500">{f.filename} {f.fileSize ? `(${Math.round(f.fileSize / 1024)}KB)` : ''}</p>
                  </div>
                  {f.gdriveUrl && (
                    <a href={f.gdriveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">
                      View
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 코멘트 */}
        <ProjectCommentSection projectId={project.projectId} />
      </div>

      {/* 사이드바 */}
      <div className="space-y-4">
        <ProjectMemberList projectId={project.projectId} />
        <ProjectClientList projectId={project.projectId} />
      </div>
    </div>
  );
}
