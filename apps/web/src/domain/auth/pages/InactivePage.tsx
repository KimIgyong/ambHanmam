import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/domain/auth/store/auth.store';

export default function InactivePage() {
  const { t } = useTranslation('auth');
  const { user, logout } = useAuthStore();

  const statusMessage = user?.status === 'SUSPENDED'
    ? t('inactive.suspendedMessage', 'Your account has been suspended. Please contact the administrator for assistance.')
    : t('inactive.inactiveMessage', 'Your account is currently inactive. Please contact the administrator.');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('inactive.title', 'Account Inactive')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {statusMessage}
        </p>
        <button
          onClick={() => logout()}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('inactive.logout', 'Logout')}
        </button>
      </div>
    </div>
  );
}
