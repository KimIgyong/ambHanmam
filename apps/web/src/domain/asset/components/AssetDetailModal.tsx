import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, Calendar, Tag, Building2, Cpu, Barcode } from 'lucide-react';
import { useDeleteAsset, useUpdateAssetStatus } from '../hooks/useAsset';
import type { Asset } from '../service/asset.service';
import { LocalDateTime } from '@/components/common/LocalDateTime';

const STATUSES = ['IN_USE', 'STORED', 'REPAIRING', 'DISPOSAL_PENDING', 'DISPOSED', 'RESERVED'] as const;

const currencySymbol = (c?: string) => {
  switch (c) {
    case 'KRW': return '₩';
    case 'VND': return '₫';
    case 'USD': default: return '$';
  }
};

interface Props {
  asset: Asset;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onDeleted: () => void;
}

export default function AssetDetailModal({ asset, onClose, onEdit, onDeleted }: Props) {
  const { t } = useTranslation('asset');
  const updateStatusMutation = useUpdateAssetStatus();
  const deleteMutation = useDeleteAsset();
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [newStatus, setNewStatus] = useState(asset.status);
  const [reason, setReason] = useState('');

  const handleStatusChange = async () => {
    if (!reason.trim()) return;
    await updateStatusMutation.mutateAsync({ id: asset.assetId, data: { status: newStatus, reason: reason.trim() } });
    setShowStatusChange(false);
    setReason('');
  };

  const handleDelete = async () => {
    if (!window.confirm(t('confirm.delete'))) return;
    await deleteMutation.mutateAsync(asset.assetId);
    onDeleted();
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      IN_USE: 'bg-blue-100 text-blue-700',
      STORED: 'bg-gray-100 text-gray-700',
      REPAIRING: 'bg-yellow-100 text-yellow-700',
      DISPOSAL_PENDING: 'bg-orange-100 text-orange-700',
      DISPOSED: 'bg-red-100 text-red-700',
      RESERVED: 'bg-purple-100 text-purple-700',
    };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  const info = (label: string, value: string | number | null | undefined) =>
    value ? (
      <div className="flex justify-between py-1.5 text-sm border-b border-gray-50 dark:border-gray-800">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">{value}</span>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{asset.assetName}</h3>
            <span className="text-xs text-gray-500 font-mono">{asset.assetCode}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Status badge + change button */}
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor(asset.status)}`}>
              {t(`status.${asset.status}`)}
            </span>
            <button
              onClick={() => setShowStatusChange(!showStatusChange)}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              {t('common.edit')}
            </button>
            <button
              onClick={() => onEdit(asset)}
              className="text-xs text-indigo-600 hover:text-indigo-700 underline"
            >
              {t('common.editAll')}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-xs text-red-600 hover:text-red-700 underline disabled:opacity-50"
            >
              {t('common.delete')}
            </button>
          </div>

          {/* Status change form */}
          {showStatusChange && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('form.statusReasonPlaceholder')}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handleStatusChange}
                disabled={!reason.trim() || updateStatusMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {t('form.save')}
              </button>
            </div>
          )}

          {/* Info grid */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wider mb-2">
              <Tag className="w-3.5 h-3.5" /> {t('form.category')}
            </div>
            {info(t('form.category'), t(`category.${asset.assetCategory}`))}
            {info(t('form.ownershipType'), t(`ownership.${asset.ownershipType}`))}
            {info(t('form.quantity'), asset.quantity ?? 1)}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" /> {t('form.department')} / {t('form.location')}
            </div>
            {info(t('form.department'), asset.unit)}
            {info(t('form.location'), asset.location)}
            {info(t('form.manager'), asset.managerName)}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wider mb-2">
              <Cpu className="w-3.5 h-3.5" /> {t('form.manufacturer')} / {t('form.modelName')}
            </div>
            {info(t('form.manufacturer'), asset.manufacturer)}
            {info(t('form.modelName'), asset.modelName)}
            {info(t('form.serialNo'), asset.serialNo)}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wider mb-2">
              <Calendar className="w-3.5 h-3.5" /> {t('form.purchaseDate')} / {t('form.purchaseAmount')}
            </div>
            {info(t('form.purchaseDate'), asset.purchaseDate)}
            {info(t('form.vendor'), asset.vendor)}
            {info(t('form.currency'), asset.currency || 'USD')}
            {info(t('form.purchaseAmount'), asset.purchaseAmount ? `${currencySymbol(asset.currency)}${Number(asset.purchaseAmount).toLocaleString()}` : null)}
            {info(t('form.depreciationYears'), asset.depreciationYears ? `${asset.depreciationYears}년` : null)}
            {info(t('form.residualValue'), asset.residualValue ? `${currencySymbol(asset.currency)}${Number(asset.residualValue).toLocaleString()}` : null)}
          </div>

          {asset.barcode || asset.rfidCode ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-gray-400 uppercase tracking-wider mb-2">
                <Barcode className="w-3.5 h-3.5" /> {t('form.barcode')} / {t('form.rfidCode')}
              </div>
              {info(t('form.barcode'), asset.barcode)}
              {info(t('form.rfidCode'), asset.rfidCode)}
            </div>
          ) : null}

          {/* Meeting room info */}
          {asset.assetCategory === 'MEETING_ROOM' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2">
                <MapPin className="w-3.5 h-3.5" /> {t('category.MEETING_ROOM')}
              </div>
              {info(t('form.roomCapacity'), asset.roomCapacity ? `${asset.roomCapacity}명` : null)}
              {info(t('form.roomEquipments'), asset.roomEquipments?.join(', '))}
              {info(t('form.roomAvailableFrom'), asset.roomAvailableFrom)}
              {info(t('form.roomAvailableTo'), asset.roomAvailableTo)}
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
            {t('common.createdAt')}: {<LocalDateTime value={asset.createdAt} format='YYYY-MM-DD HH:mm' />}
          </div>
        </div>
      </div>
    </div>
  );
}
