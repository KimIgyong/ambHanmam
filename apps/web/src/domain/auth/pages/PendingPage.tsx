import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/domain/auth/store/auth.store';

export default function PendingPage() {
  const { t } = useTranslation('auth');
  const { logout } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('pending.title', 'Pending Approval')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('pending.message', 'Your account is awaiting administrator approval. You will be notified once your account is activated.')}
        </p>
        <button
          onClick={() => logout()}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('pending.logout', 'Logout')}
        </button>
      </div>
    </div>
  );
}
