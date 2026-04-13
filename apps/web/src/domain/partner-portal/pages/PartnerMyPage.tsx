import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { partnerPortalApiService } from '../service/partner-portal.service';
import { usePartnerAuthStore } from '../store/partner-auth.store';
import { toast } from 'sonner';

export default function PartnerMyPage() {
  const { t } = useTranslation('partnerPortal');
  const { user } = usePartnerAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['partner-profile'],
    queryFn: () => partnerPortalApiService.getProfile(),
  });

  const changePwMut = useMutation({
    mutationFn: () => partnerPortalApiService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success(t('myPage.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: Error & { response?: { data?: { error?: { message?: string } } } }) => toast.error(err.response?.data?.error?.message || 'Error'),
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('myPage.passwordMismatch'));
      return;
    }
    changePwMut.mutate();
  };

  const displayUser = profile || user;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">{t('myPage.title')}</h1>

      {/* Profile Info */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">{t('myPage.name')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{displayUser?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('myPage.email')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{displayUser?.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('myPage.partner')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{displayUser?.partnerName || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('myPage.jobTitle')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{(profile as any)?.jobTitle || '-'}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">{t('myPage.changePassword')}</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('myPage.currentPassword')}</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('myPage.newPassword')}</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('myPage.confirmNewPassword')}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <button type="submit" disabled={changePwMut.isPending}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {t('myPage.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
