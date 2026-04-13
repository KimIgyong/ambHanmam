import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useCreateAsset } from '../hooks/useAsset';
import type { CreateAssetBody } from '../service/asset.service';

const CATEGORIES = ['IT_EQUIPMENT', 'SUPPLY', 'FACILITY', 'MEETING_ROOM', 'VEHICLE'] as const;
const OWNERSHIPS = ['PURCHASE', 'LEASE', 'OTHER'] as const;
const CURRENCIES = ['USD', 'KRW', 'VND'] as const;

interface Props {
  onClose: () => void;
}

export default function AssetCreateModal({ onClose }: Props) {
  const { t } = useTranslation('asset');
  const createMutation = useCreateAsset();

  const [form, setForm] = useState<CreateAssetBody>({
    asset_name: '',
    asset_category: 'IT_EQUIPMENT',
    ownership_type: 'PURCHASE',
  });

  const set = <K extends keyof CreateAssetBody>(key: K, value: CreateAssetBody[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isMeetingRoom = form.asset_category === 'MEETING_ROOM';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asset_name.trim()) return;
    await createMutation.mutateAsync(form);
    onClose();
  };

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('tab.register')}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Row 1: Name */}
          <div>
            <label className={labelClass}>{t('form.assetName')} *</label>
            <input
              type="text"
              required
              value={form.asset_name}
              onChange={(e) => set('asset_name', e.target.value)}
              placeholder={t('form.assetNamePlaceholder')}
              className={inputClass}
            />
          </div>

          {/* Row 2: Category | Ownership */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('form.category')} *</label>
              <select
                value={form.asset_category}
                onChange={(e) => set('asset_category', e.target.value)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`category.${c}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('form.ownershipType')} *</label>
              <select
                value={form.ownership_type}
                onChange={(e) => set('ownership_type', e.target.value)}
                className={inputClass}
              >
                {OWNERSHIPS.map((o) => (
                  <option key={o} value={o}>{t(`ownership.${o}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Department | Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('form.unit')}</label>
              <input
                type="text"
                value={form.unit || ''}
                onChange={(e) => set('unit', e.target.value || undefined)}
                placeholder={t('form.unitPlaceholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('form.location')}</label>
              <input
                type="text"
                value={form.location || ''}
                onChange={(e) => set('location', e.target.value || undefined)}
                placeholder={t('form.locationPlaceholder')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 4: Manufacturer | Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('form.manufacturer')}</label>
              <input
                type="text"
                value={form.manufacturer || ''}
                onChange={(e) => set('manufacturer', e.target.value || undefined)}
                placeholder={t('form.manufacturerPlaceholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('form.modelName')}</label>
              <input
                type="text"
                value={form.model_name || ''}
                onChange={(e) => set('model_name', e.target.value || undefined)}
                placeholder={t('form.modelNamePlaceholder')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 5: Quantity | Serial | Barcode */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>{t('form.quantity')}</label>
              <input
                type="number"
                min={1}
                value={form.quantity ?? ''}
                onChange={(e) => set('quantity', e.target.value ? Number(e.target.value) : undefined)}
                placeholder={t('form.quantityPlaceholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('form.serialNo')}</label>
              <input
                type="text"
                value={form.serial_no || ''}
                onChange={(e) => set('serial_no', e.target.value || undefined)}
                placeholder={t('form.serialNoPlaceholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('form.barcode')}</label>
              <input
                type="text"
                value={form.barcode || ''}
                onChange={(e) => set('barcode', e.target.value || undefined)}
                placeholder={t('form.barcodePlaceholder')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 6: Purchase Date | Vendor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('form.purchaseDate')}</label>
              <input
                type="date"
                value={form.purchase_date || ''}
                onChange={(e) => set('purchase_date', e.target.value || undefined)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('form.vendor')}</label>
              <input
                type="text"
                value={form.vendor || ''}
                onChange={(e) => set('vendor', e.target.value || undefined)}
                placeholder={t('form.vendorPlaceholder')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 7: Currency | Amount | Depreciation | Residual */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>{t('form.currency')}</label>
              <select
                value={form.currency || 'USD'}
                onChange={(e) => set('currency', e.target.value)}
                className={inputClass}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('form.purchaseAmount')}</label>
              <input
                type="text"
                value={form.purchase_amount || ''}
                onChange={(e) => set('purchase_amount', e.target.value || undefined)}
                placeholder={t('form.purchaseAmountPlaceholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('form.depreciationYears')}</label>
              <input
                type="number"
                min={0}
                value={form.depreciation_years ?? ''}
                onChange={(e) => set('depreciation_years', e.target.value ? Number(e.target.value) : undefined)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('form.residualValue')}</label>
              <input
                type="text"
                value={form.residual_value || ''}
                onChange={(e) => set('residual_value', e.target.value || undefined)}
                placeholder={t('form.residualValuePlaceholder')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Meeting Room specific fields */}
          {isMeetingRoom && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg space-y-3">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {t('category.MEETING_ROOM')} {t('common.detail')}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>{t('form.roomCapacity')}</label>
                  <input
                    type="number"
                    min={1}
                    value={form.room_capacity ?? ''}
                    onChange={(e) => set('room_capacity', e.target.value ? Number(e.target.value) : undefined)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('form.roomAvailableFrom')}</label>
                  <input
                    type="time"
                    value={form.room_available_from || ''}
                    onChange={(e) => set('room_available_from', e.target.value || undefined)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('form.roomAvailableTo')}</label>
                  <input
                    type="time"
                    value={form.room_available_to || ''}
                    onChange={(e) => set('room_available_to', e.target.value || undefined)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>{t('form.roomEquipments')}</label>
                <input
                  type="text"
                  value={(form.room_equipments || []).join(', ')}
                  onChange={(e) => set('room_equipments', e.target.value ? e.target.value.split(',').map((s) => s.trim()) : undefined)}
                  placeholder="TV, PROJECTOR, WHITEBOARD"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {t('form.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !form.asset_name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? '...' : t('form.register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
