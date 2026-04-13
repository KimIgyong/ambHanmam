import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, BarChart2 } from 'lucide-react';
import PageTitle from '@/global/components/PageTitle';
import MyTodayPanel from '../components/MyTodayPanel';
import AllTodayPanel from '../components/AllTodayPanel';
import TeamTodayPanel from '../components/TeamTodayPanel';
import CellTodayPanel from '../components/CellTodayPanel';
import OrgTodayPanel from '../components/OrgTodayPanel';
import TodaySidebar from '../components/sidebar/TodaySidebar';
import { AnalysisModal } from '../components/TodayAiAnalysis';
import ServiceUsageModal from '../components/ServiceUsageModal';
import UserActivityModal from '../components/UserActivityModal';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import ViewScopeTab, { type ViewScope } from '@/shared/components/ViewScopeTab';

type ModalType = 'analysis' | null;

const SCOPE_MAP: Record<ViewScope, 'me' | 'team' | 'cell' | 'all'> = {
  mine: 'me',
  unit: 'team',
  cell: 'cell',
  all: 'all',
  org: 'all',
};

export default function TodayPage() {
  const { t } = useTranslation('today');
  const navigate = useNavigate();
  const [activeScope, setActiveScope] = useState<ViewScope>('mine');
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const { isMaster } = useAuthStore();

  useEffect(() => {
    if (!isMaster()) return;
    const dismissed = localStorage.getItem('amb-usage-modal-dismissed');
    const today = new Date().toISOString().slice(0, 10);
    if (dismissed !== today) {
      setShowUsageModal(true);
    }
  }, [isMaster]);

  useEffect(() => {
    if (isMaster()) return;
    const dismissed = localStorage.getItem('amb-activity-modal-dismissed');
    const today = new Date().toISOString().slice(0, 10);
    if (dismissed !== today) {
      setShowActivityModal(true);
    }
  }, [isMaster]);

  const handleDismissToday = () => {
    localStorage.setItem('amb-usage-modal-dismissed', new Date().toISOString().slice(0, 10));
    setShowUsageModal(false);
  };

  const handleDismissActivityToday = () => {
    localStorage.setItem('amb-activity-modal-dismissed', new Date().toISOString().slice(0, 10));
    setShowActivityModal(false);
  };

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const scope = SCOPE_MAP[activeScope];

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-4 md:mb-6 flex items-center gap-3">
          <PageTitle>{t('title')}</PageTitle>
          <span className="text-sm text-gray-500">
            {now.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' })}
            {' '}
            {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Tab Bar + Action Buttons */}
        <div className="mb-4 md:mb-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <ViewScopeTab activeScope={activeScope} onScopeChange={setActiveScope} />
            <div className="flex items-center gap-1.5 md:gap-2 pb-1">
              <button
                onClick={() => setOpenModal('analysis')}
                className="flex items-center gap-1 md:gap-1.5 rounded-lg bg-indigo-600 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium text-white hover:bg-indigo-700"
              >
                <BrainCircuit className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {activeScope === 'mine'
                    ? t('ai.generateMy', { defaultValue: 'AI코칭' })
                    : t('ai.generate', { defaultValue: 'AI코칭' })}
                </span>
              </button>
              <button
                onClick={() => navigate('/work-reports')}
                className="flex items-center gap-1 md:gap-1.5 rounded-lg border border-gray-300 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <BarChart2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('ai.workReport', { defaultValue: '업무 일지' })}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="min-w-0 flex-1">
            {activeScope === 'mine' && <MyTodayPanel />}
            {activeScope === 'unit' && <TeamTodayPanel />}
            {activeScope === 'cell' && <CellTodayPanel />}
            {activeScope === 'all' && <AllTodayPanel />}
            {activeScope === 'org' && <OrgTodayPanel />}
          </div>

          {/* Sidebar (only on My tab) */}
          {activeScope === 'mine' && (
            <div className="w-full lg:w-72 xl:w-80 shrink-0">
              <div className="lg:sticky lg:top-8">
                <TodaySidebar />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {openModal === 'analysis' && (
        <AnalysisModal scope={scope} onClose={() => setOpenModal(null)} />
      )}
      {showUsageModal && (
        <ServiceUsageModal
          onClose={() => setShowUsageModal(false)}
          onDismissToday={handleDismissToday}
        />
      )}
      {showActivityModal && (
        <UserActivityModal
          onClose={() => setShowActivityModal(false)}
          onDismissToday={handleDismissActivityToday}
        />
      )}
    </div>
  );
}
