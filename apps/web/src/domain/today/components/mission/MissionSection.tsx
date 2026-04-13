import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeHtml } from '@/global/util/sanitize';
import { Target, Edit3, Check, SkipForward, CheckCircle, MinusCircle, ClipboardList, ArrowRight, Languages } from 'lucide-react';
import RichTextEditor from '@/domain/meeting-notes/components/RichTextEditor';
import { useSaveMission, useUpdateMission, useSaveMissionCheck } from '../../hooks/useMyToday';
import { useTranslateContent } from '../../hooks/useMyToday';
import { parseMissionLines } from '../../utils/parseMissionLines';
import type { MissionInfo, YesterdayMissionInfo, MissionCheckLine } from '../../service/today.service';

interface Props {
  mission: MissionInfo | null;
  yesterdayMission: YesterdayMissionInfo | null;
  carryOverText?: string | null;
}

type LineState = 'pending' | 'done' | 'incomplete' | 'na';
type SubChoice = 'mission' | 'task' | null;

interface CheckLineState {
  lineIndex: number;
  text: string;
  state: LineState;
  subChoice: SubChoice;
}

function formatTodayDate(): string {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const w = weekdays[now.getDay()];
  return `${m}월 ${d}일 (${w})`;
}

function isHtmlEmpty(html: string): boolean {
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length === 0;
}

export default function MissionSection({ mission, yesterdayMission, carryOverText }: Props) {
  const { t } = useTranslation('today');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [lineStates, setLineStates] = useState<CheckLineState[]>([]);
  const missionEditorRef = useRef<HTMLDivElement>(null);

  const saveMission = useSaveMission();
  const updateMission = useUpdateMission();
  const saveMissionCheck = useSaveMissionCheck();

  // carry-over pre-fill
  useEffect(() => {
    if (carryOverText && !mission) {
      setContent(carryOverText);
    }
  }, [carryOverText, mission]);

  // 어제 미션 라인 파싱
  useEffect(() => {
    if (yesterdayMission?.msnContent) {
      const parsed = parseMissionLines(yesterdayMission.msnContent);
      setLineStates(parsed.map((p) => ({
        lineIndex: p.lineIndex,
        text: p.text,
        state: 'pending' as LineState,
        subChoice: null,
      })));
    }
  }, [yesterdayMission?.msnContent]);

  // 달성도 계산
  const { score, evalCount, excludeCount, pendingCount, incompleteNoChoice } = useMemo(() => {
    const evaluated = lineStates.filter((l) => l.state !== 'pending');
    const naCount = lineStates.filter((l) => l.state === 'na').length;
    const doneCount = lineStates.filter((l) => l.state === 'done').length;
    const evalTotal = evaluated.length - naCount;
    const pCount = lineStates.filter((l) => l.state === 'pending').length;
    const incNoChoice = lineStates.filter((l) => l.state === 'incomplete' && !l.subChoice).length;
    return {
      score: evalTotal > 0 ? Math.round((doneCount / evalTotal) * 100) : null,
      evalCount: evalTotal,
      excludeCount: naCount,
      pendingCount: pCount,
      incompleteNoChoice: incNoChoice,
    };
  }, [lineStates]);

  const canSave = pendingCount === 0 && incompleteNoChoice === 0 && lineStates.length > 0;
  const carryOverLines = lineStates.filter((l) => l.state === 'incomplete' && l.subChoice === 'mission');

  const handleLineState = (idx: number, newState: LineState) => {
    setLineStates((prev) => prev.map((l) =>
      l.lineIndex === idx
        ? { ...l, state: newState, subChoice: newState === 'incomplete' ? l.subChoice : null }
        : l,
    ));
  };

  const handleSubChoice = (idx: number, choice: SubChoice) => {
    setLineStates((prev) => prev.map((l) =>
      l.lineIndex === idx ? { ...l, subChoice: choice } : l,
    ));
  };

  const handleCheckSave = () => {
    if (!yesterdayMission || !canSave) return;
    const lines: MissionCheckLine[] = lineStates.map((l) => ({
      lineIndex: l.lineIndex,
      text: l.text,
      state: l.state as 'done' | 'incomplete' | 'na',
      subChoice: l.subChoice,
    }));
    const hasCarryOver = lineStates.some((l) => l.state === 'incomplete' && l.subChoice === 'mission');
    saveMissionCheck.mutate(
      { date: yesterdayMission.msnDate, lines },
      {
        onSuccess: (data) => {
          if (hasCarryOver && data?.carryOverText) {
            setContent(data.carryOverText);
          }
          if (hasCarryOver) {
            setTimeout(() => {
              missionEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
          }
        },
      },
    );
  };

  const handleSave = () => {
    if (isHtmlEmpty(content)) return;
    saveMission.mutate(content, { onSuccess: () => setContent('') });
  };

  const handleSkip = () => {
    saveMission.mutate(null);
  };

  const handleEdit = () => {
    if (!mission) return;
    setEditContent(mission.msnContent || '');
    setIsEditing(true);
  };

  const handleUpdate = () => {
    if (!mission || isHtmlEmpty(editContent)) return;
    updateMission.mutate(
      { date: mission.msnDate, content: editContent },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const todayLabel = formatTodayDate();

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-5">
      {/* ===== Step 1: 어제 미션 라인별 체크 ===== */}
      {yesterdayMission && lineStates.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          {/* 헤더 + 프로그레스 */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">
                {(() => {
                  const missionDate = new Date(yesterdayMission.msnDate + 'T00:00:00');
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  yesterday.setHours(0, 0, 0, 0);
                  const isYesterday = missionDate.getTime() === yesterday.getTime();
                  return isYesterday
                    ? t('mission.checkTitle', { defaultValue: '어제 미션 체크' })
                    : t('mission.uncheckedTitle', { defaultValue: '미완료 미션 체크' });
                })()}
              </span>
              <span className="text-xs text-amber-500">{yesterdayMission.msnDate}</span>
            </div>
          </div>

          {/* 프로그레스 바 */}
          {score !== null && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">
                  {t('mission.checkScore', { defaultValue: '달성도' })} {score}%
                </span>
                <span className="text-gray-400">
                  {t('mission.progressEval', { defaultValue: '평가 {{eval}}개', eval: evalCount })} · {t('mission.progressExclude', { defaultValue: '제외 {{exclude}}개', exclude: excludeCount })}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          )}

          {/* 라인별 체크 */}
          <div className="space-y-2">
            {lineStates.map((line) => (
              <div key={line.lineIndex} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  {/* 라인 텍스트 */}
                  <span className={`flex-1 text-sm ${
                    line.state === 'done' ? 'text-gray-400 line-through' :
                    line.state === 'na' ? 'italic text-gray-400' : 'text-gray-700'
                  }`}>
                    {line.text}
                  </span>
                  {/* 3버튼 */}
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => handleLineState(line.lineIndex, 'done')}
                      className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        line.state === 'done'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'
                      }`}
                    >
                      {t('mission.lineStateDone', { defaultValue: '완료' })}
                    </button>
                    <button
                      onClick={() => handleLineState(line.lineIndex, 'incomplete')}
                      className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        line.state === 'incomplete'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      {t('mission.lineStateIncomplete', { defaultValue: '미완료' })}
                    </button>
                    <button
                      onClick={() => handleLineState(line.lineIndex, 'na')}
                      className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        line.state === 'na'
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-500'
                      }`}
                    >
                      {t('mission.lineStateNa', { defaultValue: '해당없음' })}
                    </button>
                  </div>
                </div>

                {/* 상태별 서브 UI */}
                {line.state === 'done' && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    {t('mission.doneBadge', { defaultValue: 'Task 완료로 저장됨' })}
                  </div>
                )}

                {line.state === 'incomplete' && !line.subChoice && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-400">{t('mission.subChoicePrompt', { defaultValue: '계속:' })}</span>
                    <button
                      onClick={() => handleSubChoice(line.lineIndex, 'mission')}
                      className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-100"
                    >
                      {t('mission.subChoiceMission', { defaultValue: '오늘 미션으로' })}
                    </button>
                    <button
                      onClick={() => handleSubChoice(line.lineIndex, 'task')}
                      className="rounded bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-600 hover:bg-purple-100"
                    >
                      {t('mission.subChoiceTask', { defaultValue: 'Task 등록' })}
                    </button>
                  </div>
                )}

                {line.state === 'incomplete' && line.subChoice === 'mission' && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-blue-600">
                    <ArrowRight className="h-3 w-3" />
                    {t('mission.missionBadge', { defaultValue: '오늘 미션으로 이어감' })}
                    <button
                      onClick={() => handleSubChoice(line.lineIndex, null)}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      {t('mission.changeChoice', { defaultValue: '변경' })}
                    </button>
                  </div>
                )}

                {line.state === 'incomplete' && line.subChoice === 'task' && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-purple-600">
                    <ClipboardList className="h-3 w-3" />
                    {t('mission.taskBadge', { defaultValue: 'Task로 등록됨' })}
                    <button
                      onClick={() => handleSubChoice(line.lineIndex, null)}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      {t('mission.changeChoice', { defaultValue: '변경' })}
                    </button>
                  </div>
                )}

                {line.state === 'na' && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
                    <MinusCircle className="h-3 w-3" />
                    {t('mission.naBadge', { defaultValue: '평가 제외' })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* carry-over 프리뷰 */}
          {carryOverLines.length > 0 && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="mb-1 text-[11px] font-semibold text-blue-700">
                {t('mission.carryOverTitle', { defaultValue: '오늘 미션으로 이어가기' })}
              </p>
              <ol className="list-inside list-decimal text-xs text-blue-600">
                {carryOverLines.map((l) => (
                  <li key={l.lineIndex}>{l.text}</li>
                ))}
              </ol>
            </div>
          )}

          {/* 푸터: 힌트 + 저장 */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              {!canSave && pendingCount > 0 && t('mission.remainHint', { defaultValue: '{{count}}개 남음 — 미완료 항목의 후속 활동을 선택하세요', count: pendingCount + incompleteNoChoice })}
              {!canSave && pendingCount === 0 && incompleteNoChoice > 0 && t('mission.remainHint', { defaultValue: '{{count}}개 남음 — 미완료 항목의 후속 활동을 선택하세요', count: incompleteNoChoice })}
              {canSave && t('mission.allEvaluated', { defaultValue: '모든 항목이 평가되었습니다' })}
            </span>
            <button
              onClick={handleCheckSave}
              disabled={!canSave || saveMissionCheck.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('mission.saveCheck', { defaultValue: '저장' })}
            </button>
          </div>
        </div>
      )}

      {/* 미션 미작성 */}
      {!mission && (
        <div ref={missionEditorRef}>
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">
              {t('mission.title', { defaultValue: "오늘의 미션" })}
            </h3>
            <span className="text-sm text-gray-400">{todayLabel}</span>
          </div>
          <p className="mb-3 text-sm text-gray-500">
            {t('mission.prompt', { defaultValue: '오늘의 미션을 작성해보세요' })}
          </p>
          <div className="mb-3">
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder={t('mission.placeholder', { defaultValue: '오늘 집중할 핵심 업무를 적어주세요...' })}
              minHeight="100px"
              maxHeight="250px"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isHtmlEmpty(content) || saveMission.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('mission.save', { defaultValue: '저장' })}
            </button>
            <button
              onClick={handleSkip}
              disabled={saveMission.isPending}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
            >
              <SkipForward className="h-3.5 w-3.5" />
              {t('mission.skip', { defaultValue: '오늘은 넘기기' })}
            </button>
          </div>
        </div>
      )}

      {/* 미션 작성 완료 */}
      {mission && mission.msnContent && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" />
              <h3 className="font-semibold text-gray-900">
                {t('mission.title', { defaultValue: "오늘의 미션" })}
              </h3>
              <span className="text-sm text-gray-400">{todayLabel}</span>
            </div>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600"
              >
                <Edit3 className="h-3.5 w-3.5" />
                {t('mission.edit', { defaultValue: '수정' })}
              </button>
            )}
          </div>

          {isEditing ? (
            <div>
              <div className="mb-2">
                <RichTextEditor
                  content={editContent}
                  onChange={setEditContent}
                  minHeight="100px"
                  maxHeight="250px"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={isHtmlEmpty(editContent) || updateMission.isPending}
                  className="rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {t('mission.save', { defaultValue: '저장' })}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  {t('close', { defaultValue: '취소' })}
                </button>
              </div>
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(mission.msnContent) }}
            />
          )}

          {/* 번역 + 체크 결과 */}
          <MissionTranslation missionId={mission.msnId} />

          {mission.msnCheckResult && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span>
                {t('mission.checkScore', { defaultValue: '달성도' })}: {mission.msnCheckScore}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* 미션 넘기기 완료 */}
      {mission && !mission.msnContent && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <SkipForward className="h-4 w-4" />
          {t('mission.skipped', { defaultValue: '오늘은 미션을 넘겼습니다' })}
        </div>
      )}
    </div>
  );
}

const TRANSLATE_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'vi', label: 'Tiếng Việt' },
] as const;

function MissionTranslation({ missionId }: { missionId: string }) {
  const { t } = useTranslation('today');
  const [targetLang, setTargetLang] = useState<string | null>(null);
  const translate = useTranslateContent();

  const handleTranslate = (lang: string) => {
    setTargetLang(lang);
    translate.mutate({ sourceType: 'MISSION', sourceId: missionId, sourceFields: ['content'], targetLang: lang });
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5">
        <Languages className="h-3.5 w-3.5 text-gray-400" />
        {TRANSLATE_LANGS.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleTranslate(lang.code)}
            disabled={translate.isPending}
            className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
              targetLang === lang.code && translate.data
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
      {translate.isPending && (
        <p className="mt-1.5 text-xs text-gray-400">{t('ai.translating', { defaultValue: 'Translating...' })}</p>
      )}
      {translate.data && targetLang && !translate.isPending && (
        <div className="mt-1.5 rounded-lg border border-gray-200 bg-gray-50 p-3 prose prose-sm max-w-none text-gray-600">
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(translate.data) }} />
        </div>
      )}
    </div>
  );
}
