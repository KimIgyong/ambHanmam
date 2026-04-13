import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { List, FileText, CheckSquare, BarChart3, Plus, Send, Download, Upload } from 'lucide-react';
import PageTitle from '@/global/components/PageTitle';
import AssetListTab from '../components/AssetListTab';
import AssetCreateModal from '../components/AssetCreateModal';
import AssetDetailModal from '../components/AssetDetailModal';
import AssetEditModal from '../components/AssetEditModal';
import AssetRequestTab from '../components/AssetRequestTab';
import AssetRequestCreateModal from '../components/AssetRequestCreateModal';
import AssetApprovalTab from '../components/AssetApprovalTab';
import AssetDashboardTab from '../components/AssetDashboardTab';
import AssetExcelImportModal from '../components/AssetExcelImportModal';
import type { Asset } from '../service/asset.service';
import { assetService } from '../service/asset.service';

type Tab = 'assets' | 'myRequests' | 'approvals' | 'dashboard';

const TABS: { key: Tab; icon: React.ReactNode }[] = [
  { key: 'assets', icon: <List className="w-4 h-4" /> },
  { key: 'myRequests', icon: <FileText className="w-4 h-4" /> },
  { key: 'approvals', icon: <CheckSquare className="w-4 h-4" /> },
  { key: 'dashboard', icon: <BarChart3 className="w-4 h-4" /> },
];

export default function AssetManagementPage() {
  const { t } = useTranslation('asset');
  const [activeTab, setActiveTab] = useState<Tab>('assets');
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const handleViewDetail = useCallback((asset: Asset) => setSelectedAsset(asset), []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-0.5">
            <PageTitle>{t('title')}</PageTitle>
            <p className="text-xs text-gray-500">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'assets' && (
              <>
                <button
                  onClick={() => assetService.downloadImportTemplate()}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('excel.downloadTemplate')}
                </button>
                <button
                  onClick={() => setShowExcelImport(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 border border-amber-300 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {t('excel.uploadExcel')}
                </button>
                <button
                  onClick={() => setShowCreateAsset(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('tab.register')}
                </button>
              </>
            )}
            {activeTab === 'myRequests' && (
              <button
                onClick={() => setShowCreateRequest(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                {t('request.create')}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {TABS.map(({ key, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === key
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {icon}
              {t(`tab.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === 'assets' && <AssetListTab onViewDetail={handleViewDetail} />}
        {activeTab === 'myRequests' && <AssetRequestTab onCreateNew={() => setShowCreateRequest(true)} />}
        {activeTab === 'approvals' && <AssetApprovalTab />}
        {activeTab === 'dashboard' && <AssetDashboardTab />}
      </div>

      {/* Modals */}
      {showCreateAsset && <AssetCreateModal onClose={() => setShowCreateAsset(false)} />}
      {showCreateRequest && <AssetRequestCreateModal onClose={() => setShowCreateRequest(false)} />}
      {showExcelImport && <AssetExcelImportModal onClose={() => setShowExcelImport(false)} />}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onEdit={(asset) => setEditingAsset(asset)}
          onDeleted={() => {
            setSelectedAsset(null);
            setEditingAsset(null);
          }}
        />
      )}
      {editingAsset && (
        <AssetEditModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSaved={(asset) => {
            setEditingAsset(null);
            setSelectedAsset(asset);
          }}
        />
      )}
    </div>
  );
}
