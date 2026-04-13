import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CellResponse } from '@amb/types';
import { useCreateCell, useUpdateCell } from '../hooks/useCells';
import { useEntities } from '@/domain/hr/hooks/useEntity';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editTarget: CellResponse | null;
}

interface FormValues {
  name: string;
  description: string;
  entityId: string;
}

export default function CellFormModal({ isOpen, onClose, editTarget }: Props) {
  const createCell = useCreateCell();
  const updateCell = useUpdateCell();
  const { data: entities } = useEntities();
  const { t } = useTranslation(['members', 'common']);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { name: '', description: '', entityId: '' },
  });

  useEffect(() => {
    if (editTarget) {
      reset({
        name: editTarget.name,
        description: editTarget.description || '',
        entityId: editTarget.entityId || '',
      });
    } else {
      reset({ name: '', description: '', entityId: '' });
    }
  }, [editTarget, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: FormValues) => {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      entity_id: data.entityId || undefined,
    };
    if (editTarget) {
      await updateCell.mutateAsync({
        id: editTarget.cellId,
        data: payload,
      });
    } else {
      await createCell.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {editTarget
            ? t('members:cellForm.editTitle')
            : t('members:cellForm.createTitle')}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:cellForm.name')}
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder={t('members:cellForm.namePlaceholder')}
              {...register('name', { required: true })}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">
                {t('members:cellForm.name')}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:cellForm.description')}
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder={t('members:cellForm.descriptionPlaceholder')}
              rows={3}
              {...register('description')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:cellForm.entity')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              {...register('entityId')}
            >
              <option value="">{t('members:cellForm.noEntity')}</option>
              {(entities || []).map((ent) => (
                <option key={ent.entityId} value={ent.entityId}>
                  {ent.name} ({ent.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              {t('common:close')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {editTarget
                ? t('members:cellForm.update')
                : t('members:cellForm.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
