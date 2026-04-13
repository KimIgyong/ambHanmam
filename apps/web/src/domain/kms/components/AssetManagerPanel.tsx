import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDocAssets, useUploadAsset, useDeleteAsset } from '../hooks/useDocBuilder';
import { Image, Upload, Trash2, Loader2, FileImage } from 'lucide-react';

const ASSET_TYPES = ['LOGO', 'ICON', 'PHOTO', 'DIAGRAM', 'CHART', 'SCREENSHOT', 'OTHER'] as const;
const TYPE_COLORS: Record<string, string> = {
  LOGO: 'bg-orange-50 text-orange-700',
  ICON: 'bg-blue-50 text-blue-700',
  PHOTO: 'bg-green-50 text-green-700',
  DIAGRAM: 'bg-purple-50 text-purple-700',
  CHART: 'bg-yellow-50 text-yellow-700',
  SCREENSHOT: 'bg-gray-50 text-gray-700',
  OTHER: 'bg-gray-50 text-gray-500',
};

export default function AssetManagerPanel() {
  const { t } = useTranslation('kms');
  const [filterType, setFilterType] = useState<string>('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState<string>('LOGO');
  const [uploadUrl, setUploadUrl] = useState('');

  const { data: assets, isLoading } = useDocAssets(filterType || undefined);
  const uploadAsset = useUploadAsset();
  const deleteAsset = useDeleteAsset();

  const handleUpload = () => {
    if (!uploadName) return;

    const formData = new FormData();
    formData.append('name', uploadName);
    formData.append('type', uploadType);
    formData.append('drive_url', uploadUrl);

    uploadAsset.mutate(formData, {
      onSuccess: () => {
        setShowUploadForm(false);
        setUploadName('');
        setUploadUrl('');
      },
    });
  };

  const handleDelete = (dasId: string) => {
    if (confirm(t('docBuilder.assets.deleteConfirm'))) {
      deleteAsset.mutate(dasId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">{t('docBuilder.assets.title')}</h3>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Upload className="h-3.5 w-3.5" />
          {t('docBuilder.assets.upload')}
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !filterType ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {ASSET_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterType === type ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <input
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="Asset name"
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <div className="flex gap-3">
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              {ASSET_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              placeholder="Drive URL (optional)"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={!uploadName || uploadAsset.isPending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploadAsset.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('docBuilder.assets.upload')}
            </button>
            <button
              onClick={() => setShowUploadForm(false)}
              className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Asset List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : !assets?.length ? (
        <div className="rounded-lg border border-dashed border-gray-200 py-8 text-center">
          <FileImage className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">{t('docBuilder.assets.noAssets')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {assets.map((asset: any) => (
            <div key={asset.dasId} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <FileImage className="h-5 w-5 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{asset.dasName}</p>
                <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[asset.dasType] || TYPE_COLORS.OTHER}`}>
                  {asset.dasType}
                </span>
              </div>
              <button
                onClick={() => handleDelete(asset.dasId)}
                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
