import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { clientPortalApiService } from '../service/client-portal.service';
import { useClientAuthStore } from '../store/client-auth.store';
import { toast } from 'sonner';

export default function ClientProfilePage() {
  const { t } = useTranslation('clientPortal');
  const { user } = useClientAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['client-profile'],
    queryFn: () => clientPortalApiService.getProfile(),
  });

  const changePwMut = useMutation({
    mutationFn: () => clientPortalApiService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success(t('profile.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: Error & { response?: { data?: { error?: { message?: string } } } }) => toast.error(err.response?.data?.error?.message || 'Error'),
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }
    changePwMut.mutate();
  };

  const displayUser = profile || user;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">{t('profile.title')}</h1>

      {/* Profile Info */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">{t('profile.name')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{displayUser?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('profile.email')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{displayUser?.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('profile.company')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{displayUser?.clientName || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('profile.jobTitle')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{(profile as any)?.jobTitle || '-'}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">{t('profile.changePassword')}</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('profile.currentPassword')}</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('profile.newPassword')}</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('profile.confirmNewPassword')}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={changePwMut.isPending}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {t('profile.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
