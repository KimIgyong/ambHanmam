import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useCreateInvitation } from '../hooks/useInvitations';
import { useCellList } from '../hooks/useCells';
import { UNITS } from '@/global/constant/unit.constant';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  email: string;
  role: string;
  unit: string;
  cell_id: string;
}

export default function InvitationFormModal({ isOpen, onClose }: Props) {
  const createInvitation = useCreateInvitation();
  const { data: cells } = useCellList();
  const { t } = useTranslation(['members', 'common', 'units']);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    email: string;
    message?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { email: '', role: 'MEMBER', unit: '', cell_id: '' },
  });

  if (!isOpen) return null;

  const onSubmit = async (data: FormValues) => {
    try {
      await createInvitation.mutateAsync({
        email: data.email,
        role: data.role,
        unit: data.unit,
        cell_id: data.cell_id || undefined,
      });
      setResult({ type: 'success', email: data.email });
      reset();
    } catch (error: unknown) {
      const errMsg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setResult({
        type: 'error',
        email: data.email,
        message: errMsg || t('members:invitationForm.errorGeneric'),
      });
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  // 결과 화면
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex flex-col items-center py-4">
            {result.type === 'success' ? (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <h3 className="mt-3 text-lg font-semibold text-gray-900">
                  {t('members:invitationForm.sendSuccessTitle')}
                </h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                  {t('members:invitationForm.sendSuccessDesc', {
                    email: result.email,
                  })}
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-red-500" />
                <h3 className="mt-3 text-lg font-semibold text-gray-900">
                  {t('members:invitationForm.sendErrorTitle')}
                </h3>
                <p className="mt-2 text-center text-sm text-gray-600">
                  {result.message}
                </p>
              </>
            )}
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleClose}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('common:confirm')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {t('members:invitationForm.title')}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:invitationForm.email')}
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder={t('members:invitationForm.emailPlaceholder')}
              {...register('email', { required: true })}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {t('members:invitationForm.email')}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:invitationForm.role')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              {...register('role', { required: true })}
            >
              <option value="MEMBER">{t('members:roles.MEMBER')}</option>
              <option value="MANAGER">{t('members:roles.MANAGER')}</option>
              <option value="VIEWER">{t('members:roles.VIEWER')}</option>
              <option value="ADMIN">{t('members:roles.ADMIN')}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:invitationForm.unit')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              {...register('unit', { required: true })}
            >
              <option value="">{t('members:invitationForm.unit')}</option>
              {UNITS.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {t(`units:${dept.nameKey}`)}
                </option>
              ))}
            </select>
            {errors.unit && (
              <p className="mt-1 text-xs text-red-500">
                {t('members:invitationForm.unit')}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('members:invitationForm.group')}
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              {...register('cell_id')}
            >
              <option value="">{t('members:invitationForm.noGroup')}</option>
              {cells?.map((g) => (
                <option key={g.cellId} value={g.cellId}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              {t('common:close')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('members:invitationForm.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
